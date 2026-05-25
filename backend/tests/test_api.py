import unittest
import os
import tempfile
import json
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.app.ai_explain import _parse_ai_content
from backend.app.main import app


class AiExplainParsingTests(unittest.TestCase):
    def test_parse_ai_content_accepts_string_lines_and_strips_numbering(self):
        content = json.dumps(
            {
                "thinkingProcess": "\u601d\u8003\u7b7e\u9762\n\u770b\u725b\u6c14\u8865\u7ed9\n\u6536\u6210\u597d\u8fd0",
                "explainLines": "1. \u843d\u7b14\u751f\u82b1;2. \u725b\u6c14\u8865\u7ed9;\u2022 \u91d1\u699c\u9898\u540d",
                "themeText": "\u9ad8\u8003\u597d\u8fd0 x \u725b\u6c14\u8865\u7ed9",
            },
            ensure_ascii=False,
        )

        payload = _parse_ai_content(content)

        self.assertEqual(payload["thinkingProcess"], ["\u601d\u8003\u7b7e\u9762", "\u770b\u725b\u6c14\u8865\u7ed9", "\u6536\u6210\u597d\u8fd0"])
        self.assertEqual(payload["explainLines"], ["\u843d\u7b14\u751f\u82b1", "\u725b\u6c14\u8865\u7ed9", "\u91d1\u699c\u9898\u540d"])


class ApiHealthTests(unittest.TestCase):
    def test_health_endpoint_returns_database_and_activity_summary(self):
        client = TestClient(app)

        response = client.get("/api/health")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["database"]["connected"], True)
        self.assertEqual(payload["database"]["table_count"], 16)
        self.assertEqual(payload["activity"]["activity_code"], "gaokao_lucky_sign_2026")
        self.assertEqual(payload["seed_counts"]["reward_count"], 7)


class ActivityApiFlowTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp_dir.name) / "activity.sqlite3"
        self.poster_dir = Path(self.temp_dir.name) / "posters"
        self._previous_database_path = os.environ.get("GAOKAO_H5_DB_PATH")
        self._previous_poster_dir = os.environ.get("GAOKAO_H5_POSTER_DIR")
        self._previous_deepseek_env = {
            key: os.environ.get(key)
            for key in ("DEEPSEEK_API_KEY", "DEEPSEEK_BASE_URL", "DEEPSEEK_MODEL", "DEEPSEEK_REASONING_EFFORT")
        }
        os.environ["GAOKAO_H5_DB_PATH"] = str(self.database_path)
        os.environ["GAOKAO_H5_POSTER_DIR"] = str(self.poster_dir)
        os.environ["DEEPSEEK_API_KEY"] = ""
        os.environ.pop("DEEPSEEK_BASE_URL", None)
        os.environ.pop("DEEPSEEK_MODEL", None)
        os.environ.pop("DEEPSEEK_REASONING_EFFORT", None)
        self._initialize_database()
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close()
        if self._previous_database_path is None:
            os.environ.pop("GAOKAO_H5_DB_PATH", None)
        else:
            os.environ["GAOKAO_H5_DB_PATH"] = self._previous_database_path
        if self._previous_poster_dir is None:
            os.environ.pop("GAOKAO_H5_POSTER_DIR", None)
        else:
            os.environ["GAOKAO_H5_POSTER_DIR"] = self._previous_poster_dir
        for key, value in self._previous_deepseek_env.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value
        self.temp_dir.cleanup()

    def _initialize_database(self):
        import sqlite3

        root_dir = Path(__file__).resolve().parents[2]
        scripts = [
            root_dir / "database" / "sqlite" / "001_init_activity_tables.sql",
            root_dir / "database" / "sqlite" / "002_seed_basic_mock_config.sql",
            root_dir / "database" / "sqlite" / "003_optimize_activity_tables.sql",
            root_dir / "database" / "sqlite" / "004_allow_duplicate_reward_claims_per_draw.sql",
        ]
        conn = sqlite3.connect(self.database_path)
        try:
            for script in scripts:
                conn.executescript(script.read_text(encoding="utf-8"))
        finally:
            conn.close()

    def _create_session(self, user_key="user_001", share_token=None):
        payload = {"user_key": user_key, "source_page": "p1", "source_channel": "test"}
        if share_token:
            payload["share_token"] = share_token
        response = self.client.post("/api/h5/session/create", json=payload)
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def _draw(self, session_token):
        response = self.client.post("/api/draw/execute", json={"session_token": session_token})
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def _draw_with_reward(self, session_token, reward_code):
        draw = self._draw(session_token)
        import sqlite3

        conn = sqlite3.connect(self.database_path)
        try:
            row = conn.execute("SELECT result_summary_json FROM draw_record WHERE id = ?", (draw["draw_id"],)).fetchone()
            summary = json.loads(row[0] or "{}")
            summary["reward_code"] = reward_code
            summary["rewardCode"] = reward_code
            conn.execute(
                "UPDATE draw_record SET result_summary_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (json.dumps(summary, ensure_ascii=False), draw["draw_id"]),
            )
            conn.commit()
        finally:
            conn.close()

        draw["result"]["reward_code"] = reward_code
        draw["result"]["rewardCode"] = reward_code
        return draw

    def _set_draw_chance(self, user_id, chance):
        import sqlite3

        conn = sqlite3.connect(self.database_path)
        try:
            conn.execute(
                """
                UPDATE user_daily_state
                SET base_draw_chance = ?,
                    used_draw_count = 0,
                    remaining_draw_count = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE activity_code = 'gaokao_lucky_sign_2026' AND user_id = ?
                """,
                (chance, chance, user_id),
            )
            conn.commit()
        finally:
            conn.close()

    def test_session_create_and_activity_state_return_daily_chance(self):
        session = self._create_session()

        self.assertEqual(session["activity_code"], "gaokao_lucky_sign_2026")
        self.assertEqual(session["user"]["user_key"], "user_001")
        self.assertEqual(session["daily_state"]["remaining_draw_count"], 1)

        response = self.client.get("/api/activity/state", params={"session_token": session["session_token"]})

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["daily_state"]["base_draw_chance"], 1)
        self.assertEqual(payload["daily_state"]["remaining_draw_count"], 1)
        self.assertEqual(payload["progress"]["lit_days"], 0)
        self.assertEqual(payload["progress"]["shared_count"], 0)

    def test_draw_execute_consumes_chance_and_creates_one_daily_checkin(self):
        session = self._create_session()

        draw = self._draw(session["session_token"])

        self.assertEqual(draw["success"], True)
        self.assertEqual(draw["result"]["signType"], "金榜题名签")
        self.assertEqual(draw["result"]["signLevel"], "上上签")
        self.assertEqual(draw["result"]["mainTextColumns"], ["金榜题名", "愿你落笔生花"])
        self.assertEqual(draw["daily_state"]["remaining_draw_count"], 0)
        self.assertEqual(draw["checkin"]["checked_in_today"], True)
        self.assertEqual(draw["checkin"]["lit_days"], 1)
        self.assertEqual(draw["result"]["result_code"], "sign_001")

        second_response = self.client.post("/api/draw/execute", json={"session_token": session["session_token"]})

        self.assertEqual(second_response.status_code, 200)
        self.assertEqual(second_response.json()["success"], False)
        self.assertEqual(second_response.json()["error_code"], "no_chance")

    def test_draw_randomly_assigns_coupon_and_claim_requires_that_coupon(self):
        session = self._create_session()

        draw = self._draw_with_reward(session["session_token"], "discount_75")

        explain_response = self.client.get(
            "/api/explain/detail",
            params={"session_token": session["session_token"], "draw_id": draw["draw_id"]},
        )
        wrong_claim = self.client.post(
            "/api/benefit/claim",
            json={
                "session_token": session["session_token"],
                "draw_id": draw["draw_id"],
                "reward_code": "coupon_10",
                "mobile": "13800138000",
            },
        )
        right_claim = self.client.post(
            "/api/benefit/claim",
            json={
                "session_token": session["session_token"],
                "draw_id": draw["draw_id"],
                "reward_code": "discount_75",
                "mobile": "13800138000",
            },
        )

        self.assertEqual(draw["result"]["reward_code"], "discount_75")
        self.assertEqual(explain_response.status_code, 200)
        self.assertEqual(explain_response.json()["benefit"]["rewardCode"], "discount_75")
        self.assertEqual(explain_response.json()["benefit"]["reward"]["imageUrl"], "/assets/p5/element_coupon_75off_card.png")
        self.assertEqual(wrong_claim.status_code, 400)
        self.assertEqual(wrong_claim.json()["detail"], "reward does not match draw result")
        self.assertEqual(right_claim.status_code, 200)
        self.assertEqual(right_claim.json()["reward"]["reward_code"], "discount_75")

    def test_draw_random_pool_rotates_all_five_configured_p5_coupon_assets(self):
        session = self._create_session()
        self._set_draw_chance(session["user"]["user_id"], 5)

        draws = [self._draw(session["session_token"]) for _ in range(5)]

        self.assertEqual(
            [draw["result"]["reward_code"] for draw in draws],
            ["coupon_10", "coupon_20", "coupon_30", "discount_9", "discount_75"],
        )

    def test_legacy_draw_without_locked_coupon_gets_one_before_p5_render(self):
        import sqlite3

        session = self._create_session()
        draw = self._draw(session["session_token"])

        conn = sqlite3.connect(self.database_path)
        try:
            conn.execute(
                "UPDATE draw_record SET result_summary_json = json_remove(result_summary_json, '$.reward_code', '$.rewardCode') WHERE id = ?",
                (draw["draw_id"],),
            )
            conn.commit()
        finally:
            conn.close()

        explain_response = self.client.get(
            "/api/explain/detail",
            params={"session_token": session["session_token"], "draw_id": draw["draw_id"]},
        )

        wrong_claim = self.client.post(
            "/api/benefit/claim",
            json={
                "session_token": session["session_token"],
                "draw_id": draw["draw_id"],
                "reward_code": "discount_75",
                "mobile": "13800138000",
            },
        )
        right_claim = self.client.post(
            "/api/benefit/claim",
            json={
                "session_token": session["session_token"],
                "draw_id": draw["draw_id"],
                "reward_code": "coupon_10",
                "mobile": "13800138000",
            },
        )

        self.assertEqual(explain_response.status_code, 200)
        self.assertEqual(explain_response.json()["benefit"]["rewardCode"], "coupon_10")
        self.assertEqual(explain_response.json()["benefit"]["reward"]["imageUrl"], "/assets/p5/element_coupon_10yuan_card.png")
        self.assertEqual(wrong_claim.status_code, 400)
        self.assertEqual(right_claim.status_code, 200)

    def test_benefit_randomize_keeps_the_draw_coupon_before_claim(self):
        session = self._create_session()
        draw = self._draw_with_reward(session["session_token"], "coupon_20")

        randomize_response = self.client.post(
            "/api/benefit/randomize",
            json={"session_token": session["session_token"], "draw_id": draw["draw_id"]},
        )

        wrong_claim = self.client.post(
            "/api/benefit/claim",
            json={
                "session_token": session["session_token"],
                "draw_id": draw["draw_id"],
                "reward_code": "coupon_20",
                "mobile": "13800138000",
            },
        )
        right_claim = self.client.post(
            "/api/benefit/claim",
            json={
                "session_token": session["session_token"],
                "draw_id": draw["draw_id"],
                "reward_code": "coupon_30",
                "mobile": "13800138000",
            },
        )

        self.assertEqual(randomize_response.status_code, 200)
        self.assertEqual(randomize_response.json()["rewardCode"], "coupon_20")
        self.assertEqual(randomize_response.json()["reward"]["imageUrl"], "/assets/p5/element_coupon_20yuan_card.png")
        self.assertEqual(wrong_claim.status_code, 200)
        self.assertEqual(right_claim.status_code, 400)

    def test_benefit_randomize_ignores_exclude_and_returns_draw_coupon(self):
        session = self._create_session()
        draw = self._draw_with_reward(session["session_token"], "discount_75")

        response = self.client.post(
            "/api/benefit/randomize",
            json={
                "session_token": session["session_token"],
                "draw_id": draw["draw_id"],
                "exclude_reward_code": "coupon_10",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["rewardCode"], "discount_75")
        self.assertEqual(response.json()["reward"]["imageUrl"], "/assets/p5/element_coupon_75off_card.png")

    def test_each_new_draw_rotates_but_existing_draw_benefit_stays_fixed(self):
        session = self._create_session()
        self._set_draw_chance(session["user"]["user_id"], 5)

        draws = [self._draw(session["session_token"]) for _ in range(5)]
        reward_codes = [draw["result"]["reward_code"] for draw in draws]

        self.assertEqual(
            reward_codes,
            ["coupon_10", "coupon_20", "coupon_30", "discount_9", "discount_75"],
        )

        first_a = self.client.post(
            "/api/benefit/randomize",
            json={"session_token": session["session_token"], "draw_id": draws[0]["draw_id"]},
        )
        first_b = self.client.post(
            "/api/benefit/randomize",
            json={"session_token": session["session_token"], "draw_id": draws[0]["draw_id"], "exclude_reward_code": "coupon_10"},
        )

        self.assertEqual(first_a.json()["rewardCode"], "coupon_10")
        self.assertEqual(first_b.json()["rewardCode"], "coupon_10")

    def test_explain_detail_returns_readable_chinese_copy(self):
        session = self._create_session()
        draw = self._draw(session["session_token"])

        response = self.client.get("/api/explain/detail", params={"session_token": session["session_token"], "draw_id": draw["draw_id"]})

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertGreaterEqual(len(payload["thinkingProcess"]), 3)
        self.assertEqual(payload["ai"]["provider"], "fallback")
        self.assertEqual(payload["title"], "AI解签结果")
        self.assertEqual(payload["explainLines"], ["锦绣前程，步步生花", "实力如锦，终成佳绩", "心之所向，金榜题名"])
        self.assertEqual(payload["product"]["productName"], "和牛 · 锦绣前程板腱")
        self.assertEqual(payload["benefit"]["claimButtonText"], "领取专属福利")

    def test_explain_detail_uses_deepseek_prompt_when_key_configured(self):
        session = self._create_session()
        draw = self._draw(session["session_token"])
        captured = {}

        class FakeDeepSeekResponse:
            def __enter__(self):
                return self

            def __exit__(self, *_args):
                return False

            def read(self):
                reasoning_content = "\n".join(
                    [
                        "Process\u601d\u8003\u8fc7\u7a0b1\uff1a\u5148\u770b\u7b7e\u9762\u91cc\u7684\u8fdb\u53d6\u52bf\u5934",
                        "\u601d\u8003\u8fc7\u7a0b2\uff1a\u518d\u628a\u725b\u6c14\u8865\u7ed9\u653e\u8fdb\u795d\u798f",
                        "\u601d\u8003\u8fc7\u7a0b3\uff1a\u6700\u540e\u6536\u6210\u4e09\u884c\u597d\u73a9\u7b7e\u6587",
                        "",
                        "explainLines\u7b7e\u65871\uff1a1. \u725b\u6c14\u8865\u7ed9\u5230\u4f4d",
                        "\u7b7e\u65872\uff1a- \u843d\u7b14\u50cf\u725b\u6392\u7206\u6c41",
                        "\u7b7e\u65873\uff1a\u2022 \u5206\u6570\u4e00\u8def\u5411\u4e0a\u52a0\u6cb9",
                    ]
                )
                return json.dumps({"choices": [{"message": {"content": "", "reasoning_content": reasoning_content}}]}).encode("utf-8")

        def fake_urlopen(request, timeout):
            captured["url"] = request.full_url
            captured["timeout"] = timeout
            captured["authorization"] = request.get_header("Authorization")
            captured["body"] = json.loads(request.data.decode("utf-8"))
            return FakeDeepSeekResponse()

        previous_env = {key: os.environ.get(key) for key in ("DEEPSEEK_API_KEY", "DEEPSEEK_BASE_URL", "DEEPSEEK_MODEL")}
        os.environ["DEEPSEEK_API_KEY"] = "test-deepseek-key"
        os.environ["DEEPSEEK_BASE_URL"] = "https://api.deepseek.test"
        os.environ["DEEPSEEK_MODEL"] = "deepseek-v4-pro"
        try:
            with patch("urllib.request.urlopen", side_effect=fake_urlopen):
                response = self.client.get("/api/explain/detail", params={"session_token": session["session_token"], "draw_id": draw["draw_id"]})
        finally:
            for key, value in previous_env.items():
                if value is None:
                    os.environ.pop(key, None)
                else:
                    os.environ[key] = value

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(captured["url"], "https://api.deepseek.test/chat/completions")
        self.assertEqual(captured["authorization"], "Bearer test-deepseek-key")
        self.assertEqual(captured["body"]["model"], "deepseek-v4-pro")
        self.assertEqual(captured["body"]["thinking"]["type"], "enabled")
        self.assertEqual(captured["body"]["response_format"]["type"], "json_object")
        self.assertIn("\u725b\u6c14\u8865\u7ed9", captured["body"]["messages"][0]["content"])
        self.assertIn("\u8bf7\u53ea\u8f93\u51fa JSON", captured["body"]["messages"][0]["content"])
        self.assertEqual(payload["ai"]["provider"], "deepseek")
        self.assertEqual(payload["ai"]["model"], "deepseek-v4-pro")
        self.assertEqual(payload["explainLines"][0], "\u725b\u6c14\u8865\u7ed9\u5230\u4f4d")
        self.assertEqual(payload["explainLines"][1], "\u843d\u7b14\u50cf\u725b\u6392\u7206\u6c41")
        self.assertEqual(payload["explainLines"][2], "\u5206\u6570\u4e00\u8def\u5411\u4e0a\u52a0\u6cb9")
        self.assertEqual(payload["thinkingProcess"][1], "\u518d\u628a\u725b\u6c14\u8865\u7ed9\u653e\u8fdb\u795d\u798f")

    def test_share_record_adds_up_to_three_extra_draw_chances(self):
        session = self._create_session()

        results = [
            self.client.post("/api/share/record", json={"session_token": session["session_token"], "share_channel": "wechat"}).json()
            for _ in range(4)
        ]

        self.assertEqual([item["reward_granted"] for item in results], [True, True, True, False])
        self.assertTrue(results[0]["share_url"].startswith("/activity/home?share_token="))
        self.assertNotIn("page=p1", results[0]["share_url"])
        self.assertEqual(results[-1]["daily_state"]["share_reward_count_today"], 3)
        self.assertEqual(results[-1]["daily_state"]["remaining_draw_count"], 4)

    def test_claimed_coupon_appears_in_reward_center_and_gift_is_last(self):
        session = self._create_session()
        draw = self._draw_with_reward(session["session_token"], "coupon_20")

        claim_response = self.client.post(
            "/api/benefit/claim",
            json={
                "session_token": session["session_token"],
                "draw_id": draw["draw_id"],
                "reward_code": "coupon_20",
                "mobile": "13800138000",
            },
        )
        reward_response = self.client.get("/api/reward/center/detail", params={"session_token": session["session_token"]})

        self.assertEqual(claim_response.status_code, 200)
        self.assertEqual(claim_response.json()["reward"]["reward_code"], "coupon_20")
        self.assertEqual(claim_response.json()["receiver_mobile_masked"], "138****8000")
        self.assertTrue(claim_response.json()["claim_token"].startswith("ct_"))
        self.assertIn("claim_token=", claim_response.json()["action"]["target"])
        self.assertIn("claim_no=", claim_response.json()["action"]["target"])
        self.assertNotIn("13800138000", claim_response.json()["action"]["target"])
        self.assertEqual(reward_response.status_code, 200)
        rewards = reward_response.json()["display_rewards"]
        claimed_rewards = reward_response.json()["claimed_rewards"]
        self.assertEqual(len(claimed_rewards), 1)
        self.assertEqual(len(rewards), 6)
        self.assertEqual([reward["reward_code"] for reward in rewards], ["coupon_10", "coupon_20", "coupon_30", "discount_9", "discount_75", "gift_985"])
        self.assertEqual(rewards[0]["reward_code"], "coupon_10")
        self.assertEqual(rewards[0]["status"], "unclaimed")
        self.assertEqual(rewards[0]["button_text"], "\u672a\u9886\u53d6")
        self.assertEqual(rewards[1]["reward_code"], "coupon_20")
        self.assertEqual(rewards[1]["status"], "unused")
        self.assertEqual(rewards[1]["button_text"], "\u53bb\u9886\u53d6")
        self.assertEqual(rewards[-1]["reward_code"], "gift_985")
        self.assertEqual(rewards[-1]["button_text"], "未达标")
        self.assertEqual(reward_response.json()["draw_again_action"]["action"]["target"], "/activity/home")
        self.assertEqual(reward_response.json()["rules_action"]["action"]["target"], "/activity/rules")
        self.assertEqual(rewards[-1]["action"]["target"], "/activity/grand-prize")

    def test_same_coupon_can_be_claimed_again_for_a_new_draw(self):
        session = self._create_session()
        first_draw = self._draw_with_reward(session["session_token"], "coupon_20")

        first_claim = self.client.post(
            "/api/benefit/claim",
            json={
                "session_token": session["session_token"],
                "draw_id": first_draw["draw_id"],
                "reward_code": "coupon_20",
                "mobile": "13800138000",
            },
        )

        self.client.post("/api/share/record", json={"session_token": session["session_token"], "share_channel": "wechat"})
        second_draw = self._draw_with_reward(session["session_token"], "coupon_20")
        second_explain = self.client.get(
            "/api/explain/detail",
            params={"session_token": session["session_token"], "draw_id": second_draw["draw_id"]},
        )
        second_claim = self.client.post(
            "/api/benefit/claim",
            json={
                "session_token": session["session_token"],
                "draw_id": second_draw["draw_id"],
                "reward_code": "coupon_20",
                "mobile": "13900139000",
            },
        )
        reward_response = self.client.get("/api/reward/center/detail", params={"session_token": session["session_token"]})

        self.assertEqual(first_claim.status_code, 200)
        self.assertEqual(second_explain.status_code, 200)
        self.assertEqual(second_explain.json()["benefit"]["claimStatus"], "unclaimed")
        self.assertEqual(second_claim.status_code, 200)
        self.assertNotEqual(first_claim.json()["claim_no"], second_claim.json()["claim_no"])
        claimed_rewards = reward_response.json()["claimed_rewards"]
        self.assertEqual([reward["reward_code"] for reward in claimed_rewards], ["coupon_20", "coupon_20"])
        self.assertNotEqual(claimed_rewards[0]["reward_id"], claimed_rewards[1]["reward_id"])
        display_rewards = reward_response.json()["display_rewards"]
        self.assertEqual([reward["reward_code"] for reward in display_rewards], ["coupon_10", "coupon_20", "coupon_30", "discount_9", "discount_75", "gift_985"])
        self.assertEqual(sum(1 for reward in display_rewards if reward["reward_code"] == "coupon_20"), 1)
        self.assertEqual(display_rewards[0]["button_text"], "\u672a\u9886\u53d6")
        self.assertEqual(display_rewards[1]["button_text"], "\u53bb\u9886\u53d6")

    def test_claim_benefit_requires_valid_mobile_and_persists_claim_identity(self):
        import sqlite3

        session = self._create_session()
        draw = self._draw(session["session_token"])
        reward_code = draw["result"]["reward_code"]

        missing_mobile = self.client.post(
            "/api/benefit/claim",
            json={"session_token": session["session_token"], "draw_id": draw["draw_id"], "reward_code": reward_code},
        )
        invalid_mobile = self.client.post(
            "/api/benefit/claim",
            json={
                "session_token": session["session_token"],
                "draw_id": draw["draw_id"],
                "reward_code": reward_code,
                "mobile": "12345",
            },
        )
        valid_mobile = self.client.post(
            "/api/benefit/claim",
            json={
                "session_token": session["session_token"],
                "draw_id": draw["draw_id"],
                "reward_code": reward_code,
                "mobile": "13800138000",
            },
        )

        self.assertEqual(missing_mobile.status_code, 400)
        self.assertEqual(missing_mobile.json()["detail"], "mobile is required")
        self.assertEqual(invalid_mobile.status_code, 400)
        self.assertEqual(invalid_mobile.json()["detail"], "mobile format is invalid")
        self.assertEqual(valid_mobile.status_code, 200)

        payload = valid_mobile.json()
        self.assertEqual(payload["receiver_mobile_masked"], "138****8000")
        self.assertEqual(payload["coupon_issue_status"], "pending")
        self.assertTrue(payload["claim_token"].startswith("ct_"))
        self.assertNotIn("13800138000", payload["action"]["target"])

        conn = sqlite3.connect(self.database_path)
        try:
            conn.row_factory = sqlite3.Row
            record = conn.execute(
                """
                SELECT receiver_mobile, receiver_mobile_masked, claim_token, coupon_issue_status
                FROM reward_claim_record
                WHERE claim_no = ?
                """,
                (payload["claim_no"],),
            ).fetchone()
        finally:
            conn.close()

        self.assertEqual(record["receiver_mobile"], "13800138000")
        self.assertEqual(record["receiver_mobile_masked"], "138****8000")
        self.assertEqual(record["claim_token"], payload["claim_token"])
        self.assertEqual(record["coupon_issue_status"], "pending")

        resolve_response = self.client.get(
            "/api/benefit/claim/resolve",
            params={"claim_token": payload["claim_token"]},
        )

        self.assertEqual(resolve_response.status_code, 200)
        self.assertEqual(resolve_response.json()["claim_no"], payload["claim_no"])
        self.assertEqual(resolve_response.json()["receiver_mobile_masked"], "138****8000")
        self.assertNotIn("receiver_mobile", resolve_response.json())

    def test_claim_benefit_returns_p5_coupon_image_for_draw_reward(self):
        session = self._create_session()
        draw = self._draw_with_reward(session["session_token"], "discount_75")
        explain_response = self.client.get(
            "/api/explain/detail",
            params={"session_token": session["session_token"], "draw_id": draw["draw_id"]},
        )
        claim_response = self.client.post(
            "/api/benefit/claim",
            json={
                "session_token": session["session_token"],
                "draw_id": draw["draw_id"],
                "reward_code": "discount_75",
                "mobile": "13800138000",
            },
        )

        self.assertEqual(explain_response.status_code, 200)
        self.assertEqual(explain_response.json()["benefit"]["rewardCode"], "discount_75")
        self.assertEqual(explain_response.json()["benefit"]["reward"]["imageUrl"], "/assets/p5/element_coupon_75off_card.png")
        self.assertEqual(claim_response.status_code, 200)
        self.assertEqual(claim_response.json()["reward"]["reward_code"], "discount_75")
        self.assertEqual(claim_response.json()["reward"]["imageUrl"], "/assets/p5/element_coupon_75off_card.png")

    def test_claim_benefit_rejects_rewards_not_bound_to_draw_result(self):
        session = self._create_session()
        draw = self._draw(session["session_token"])

        for reward_code in ("coupon_50", "gift_985"):
            response = self.client.post(
                "/api/benefit/claim",
                json={
                    "session_token": session["session_token"],
                    "draw_id": draw["draw_id"],
                    "reward_code": reward_code,
                    "mobile": "13800138000",
                },
            )

            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.json()["detail"], "reward does not match draw result")

        reward_response = self.client.get("/api/reward/center/detail", params={"session_token": session["session_token"]})

        self.assertEqual(reward_response.status_code, 200)
        self.assertEqual(reward_response.json()["claimed_rewards"], [])

    def test_friend_draw_through_share_increases_assist_count_and_unlocks_gift(self):
        owner = self._create_session("owner")
        share = self.client.post("/api/share/record", json={"session_token": owner["session_token"], "share_channel": "wechat"}).json()

        for index in range(5):
            friend = self._create_session(f"friend_{index}", share["share_token"])
            self._draw(friend["session_token"])

        response = self.client.get("/api/grand-prize/qualification/detail", params={"session_token": owner["session_token"]})
        reward_response = self.client.get("/api/reward/center/detail", params={"session_token": owner["session_token"]})

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["shared_count"], 5)
        self.assertEqual(payload["qualify_status"], "qualified")
        self.assertEqual(payload["button_text"], "去使用")
        self.assertTrue(payload["lottery_no"].startswith("GP"))
        self.assertEqual(reward_response.status_code, 200)
        self.assertEqual(reward_response.json()["display_rewards"][-1]["button_text"], "去使用")

    def test_rules_explain_and_tracking_endpoints_return_flow_data(self):
        session = self._create_session()
        draw = self._draw(session["session_token"])

        explain_response = self.client.get(
            "/api/explain/detail",
            params={"session_token": session["session_token"], "draw_id": draw["draw_id"]},
        )
        rules_response = self.client.get("/api/activity/rules/detail")
        tracking_response = self.client.post(
            "/api/tracking/event",
            json={"session_token": session["session_token"], "page_code": "p2", "event_name": "view_result"},
        )

        self.assertEqual(explain_response.status_code, 200)
        self.assertEqual(explain_response.json()["result"]["result_code"], "sign_001")
        self.assertEqual(rules_response.status_code, 200)
        self.assertGreaterEqual(len(rules_response.json()["rules"]), 7)
        self.assertEqual(tracking_response.status_code, 200)
        self.assertEqual(tracking_response.json()["success"], True)

    def test_poster_save_persists_png_and_returns_readable_image_url(self):
        session = self._create_session()
        image_data_url = (
            "data:image/png;base64,"
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII="
        )

        response = self.client.post(
            "/api/poster/save",
            json={
                "session_token": session["session_token"],
                "page_code": "p2",
                "poster_type": "result_share",
                "image_data_url": image_data_url,
            },
        )

        self.assertEqual(response.status_code, 200, response.text)
        payload = response.json()
        self.assertEqual(payload["success"], True)
        self.assertEqual(payload["saved"], True)
        self.assertTrue(payload["poster_id"].startswith("poster_"))
        self.assertGreater(payload["byte_size"], 0)
        self.assertTrue((self.poster_dir / f"{payload['poster_id']}.png").exists())

        image_response = self.client.get(payload["poster_url"])
        self.assertEqual(image_response.status_code, 200)
        self.assertEqual(image_response.headers["content-type"], "image/png")


if __name__ == "__main__":
    unittest.main()
