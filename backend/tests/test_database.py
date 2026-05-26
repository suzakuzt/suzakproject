import json
import sqlite3
import unittest
from pathlib import Path

from backend.app.database import connect, connection, default_database_path, fetch_one, table_names
from backend.app.health import build_health_status
from backend.app.repositories import ActivityRepository


class DatabaseConnectionTests(unittest.TestCase):
    def test_default_database_path_points_to_local_sqlite_file(self):
        db_path = default_database_path()

        self.assertEqual(db_path.name, "gaokao_h5_dev.sqlite3")
        self.assertTrue(db_path.exists())

    def test_connect_enables_foreign_keys_and_row_access_by_name(self):
        with connection() as conn:
            foreign_keys = conn.execute("PRAGMA foreign_keys").fetchone()[0]
            row = conn.execute("SELECT 1 AS ok").fetchone()

        self.assertEqual(foreign_keys, 1)
        self.assertEqual(row["ok"], 1)

    def test_table_names_returns_stable_activity_schema(self):
        with connection() as conn:
            names = table_names(conn)

        self.assertIn("activity_config", names)
        self.assertIn("user_daily_state", names)
        self.assertIn("draw_record", names)
        self.assertIn("coupon_issue_config", names)
        self.assertIn("grand_prize_draw_config", names)
        self.assertEqual(len(names), 18)

    def test_fetch_one_returns_dictionary_or_none(self):
        with connection() as conn:
            row = fetch_one(conn, "SELECT activity_code FROM activity_config WHERE activity_code = ?", ("gaokao_lucky_sign_2026",))
            missing = fetch_one(conn, "SELECT activity_code FROM activity_config WHERE activity_code = ?", ("missing",))

        self.assertEqual(row, {"activity_code": "gaokao_lucky_sign_2026"})
        self.assertIsNone(missing)


class ActivityRepositoryTests(unittest.TestCase):
    def test_get_activity_state_config_reads_seeded_basic_rules(self):
        with connection() as conn:
            repo = ActivityRepository(conn)
            config = repo.get_activity_state_config("gaokao_lucky_sign_2026")

        self.assertEqual(config["activity_code"], "gaokao_lucky_sign_2026")
        self.assertEqual(config["daily_default_chance"], 1000)
        self.assertEqual(config["daily_share_bonus_limit"], 3)
        self.assertEqual(config["share_target"], 5)
        self.assertEqual(config["checkin_target"], 7)

    def test_get_basic_config_counts_reads_seeded_mock_configuration(self):
        with connection() as conn:
            repo = ActivityRepository(conn)
            counts = repo.get_basic_config_counts("gaokao_lucky_sign_2026")

        self.assertEqual(
            counts,
            {
                "asset_count": 8,
                "product_count": 4,
                "reward_count": 7,
                "draw_result_count": 5,
            },
        )

    def test_draw_result_config_reads_seeded_exam_sign_library_without_side_copy(self):
        expected_titles = [
            "过儿签",
            "范围签",
            "预习签",
            "磕头签",
            "粘锅签",
        ]
        expected_main_texts = [
            "考试期间，不要叫我真名，叫我过儿。",
            "世界上最宽广的是什么？考试范围。",
            "快要考试了，别人在复习，自己在预习。",
            "给书磕个头，就当是复习过了吧。",
            "想在这次考试咸鱼翻身的，没想到粘锅了。",
        ]

        with connection() as conn:
            rows = conn.execute(
                """
                SELECT result_code, result_title, main_text, good_text, avoid_text, explain_content, ext_json
                FROM draw_result_config
                WHERE activity_code = ? AND status = 'enabled'
                ORDER BY sort_order ASC, id ASC
                """,
                ("gaokao_lucky_sign_2026",),
            ).fetchall()

        self.assertEqual([row["result_code"] for row in rows], [f"sign_{index:03d}" for index in range(1, 6)])
        self.assertEqual([row["result_title"] for row in rows], expected_titles)
        self.assertEqual([row["main_text"] for row in rows], expected_main_texts)
        self.assertTrue(all(row["good_text"] == "" for row in rows))
        self.assertTrue(all(row["avoid_text"] == "" for row in rows))
        self.assertIn("此签一出，主打一个“精神改名大法”", rows[0]["explain_content"])
        first_ext = json.loads(rows[0]["ext_json"])
        self.assertEqual(first_ext["sign_type"], "过儿签")
        self.assertEqual(first_ext["main_text_columns"], ["考试期间，不要叫我真名，叫我过儿。"])
        self.assertEqual(first_ext["fortune_headline"], "过儿签")
        self.assertEqual(first_ext["fortune_hint"], "考试期间，不要叫我真名，叫我过儿。")
        self.assertIn("名字先改成过儿", first_ext["explain_text"])


class HealthStatusTests(unittest.TestCase):
    def test_build_health_status_returns_database_and_seed_summary(self):
        status = build_health_status("gaokao_lucky_sign_2026")

        self.assertEqual(status["database"]["connected"], True)
        self.assertEqual(status["database"]["table_count"], 18)
        self.assertEqual(status["activity"]["activity_code"], "gaokao_lucky_sign_2026")
        self.assertEqual(status["activity"]["daily_default_chance"], 1000)
        self.assertEqual(status["seed_counts"]["reward_count"], 7)


if __name__ == "__main__":
    unittest.main()
