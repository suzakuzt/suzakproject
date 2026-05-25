import json
import re
import sqlite3
import secrets
import uuid
from datetime import date, datetime
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from .ai_explain import generate_ai_explain
from .database import connection, fetch_all, fetch_one
from ..services.hermes_coupon_client import HermesCouponClient, HermesCouponError, HermesCouponIssueConfig


DEFAULT_ACTIVITY_CODE = "gaokao_lucky_sign_2026"
MOBILE_PATTERN = re.compile(r"^1[3-9]\d{9}$")
P5_RANDOM_REWARD_CODES = ("coupon_10", "coupon_20", "coupon_30", "discount_9", "discount_75")
_hermes_coupon_client: HermesCouponClient | None = None


class ApiError(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(message)


def get_hermes_coupon_client() -> HermesCouponClient:
    global _hermes_coupon_client
    if _hermes_coupon_client is None:
        _hermes_coupon_client = HermesCouponClient()
    return _hermes_coupon_client


def create_session(payload: dict[str, Any]) -> dict[str, Any]:
    activity_code = payload.get("activity_code") or DEFAULT_ACTIVITY_CODE
    user_key = payload.get("user_key") or f"anon_{uuid.uuid4().hex}"
    share_token = payload.get("share_token")
    source_user_id = None
    invite_status = "none"

    with connection() as conn:
        config = _get_activity_config(conn, activity_code)
        conn.execute(
            """
            INSERT INTO activity_user (activity_code, user_key, external_user_id, openid, unionid, nickname, avatar_url, source_channel)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(activity_code, user_key) DO UPDATE SET
              external_user_id = COALESCE(excluded.external_user_id, activity_user.external_user_id),
              openid = COALESCE(excluded.openid, activity_user.openid),
              unionid = COALESCE(excluded.unionid, activity_user.unionid),
              nickname = COALESCE(excluded.nickname, activity_user.nickname),
              avatar_url = COALESCE(excluded.avatar_url, activity_user.avatar_url),
              source_channel = COALESCE(excluded.source_channel, activity_user.source_channel),
              updated_at = CURRENT_TIMESTAMP
            """,
            (
                activity_code,
                user_key,
                payload.get("external_user_id"),
                payload.get("openid"),
                payload.get("unionid"),
                payload.get("nickname"),
                payload.get("avatar_url"),
                payload.get("source_channel"),
            ),
        )
        user = _get_user_by_key(conn, activity_code, user_key)

        if share_token:
            share = fetch_one(conn, "SELECT user_id FROM share_record WHERE activity_code = ? AND share_token = ?", (activity_code, share_token))
            if share and int(share["user_id"]) != int(user["id"]):
                source_user_id = int(share["user_id"])
                invite_status = "pending"
            else:
                invite_status = "invalid"

        session_token = f"sess_{uuid.uuid4().hex}"
        conn.execute(
            """
            INSERT INTO activity_session (
              activity_code, user_id, session_token, source_page, source_channel, source_share_token,
              source_user_id, ip_address, user_agent, invite_status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                activity_code,
                user["id"],
                session_token,
                payload.get("source_page"),
                payload.get("source_channel"),
                share_token,
                source_user_id,
                payload.get("ip_address"),
                payload.get("user_agent"),
                invite_status,
            ),
        )
        session = _get_session(conn, session_token)
        daily_state = _ensure_daily_state(conn, config, int(user["id"]))
        progress = _refresh_qualification(conn, config, int(user["id"]))
        conn.commit()

        return {
            "activity_code": activity_code,
            "session_token": session_token,
            "user": _format_user(user),
            "session": _format_session(session),
            "daily_state": _format_daily_state(daily_state),
            "progress": progress,
        }


def get_activity_state(session_token: str) -> dict[str, Any]:
    with connection() as conn:
        session = _get_session(conn, session_token)
        config = _get_activity_config(conn, session["activity_code"])
        daily_state = _ensure_daily_state(conn, config, int(session["user_id"]))
        progress = _refresh_qualification(conn, config, int(session["user_id"]))
        conn.commit()
        return {
            "activity": _format_activity(config),
            "user": _format_user(session),
            "session": _format_session(session),
            "daily_state": _format_daily_state(daily_state),
            "progress": progress,
        }


def execute_draw(payload: dict[str, Any]) -> dict[str, Any]:
    with connection() as conn:
        session = _get_session(conn, payload["session_token"])
        config = _get_activity_config(conn, session["activity_code"])
        daily_state = _ensure_daily_state(conn, config, int(session["user_id"]))
        if int(daily_state["remaining_draw_count"]) <= 0:
            return {
                "success": False,
                "error_code": "no_chance",
                "message": "今日机会已用完，分享可再得机会",
                "daily_state": _format_daily_state(daily_state),
            }

        result = _get_random_draw_result(conn, session["activity_code"])
        draw_reward = _get_random_draw_reward(conn, session["activity_code"], result.get("reward_code"), user_id=int(session["user_id"]))
        draw_no = f"DR{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6].upper()}"
        biz_date = _today()
        result_summary = _build_p2_result(result)
        result_summary["reward_code"] = draw_reward["reward_code"]
        result_summary["rewardCode"] = draw_reward["reward_code"]
        conn.execute(
            """
            INSERT INTO draw_record (
              activity_code, user_id, session_id, draw_no, result_code, biz_date, source_share_token,
              result_level_snapshot, result_title_snapshot, main_text_snapshot, good_text_snapshot,
              avoid_text_snapshot, explain_title_snapshot, explain_content_snapshot, result_summary_json
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session["activity_code"],
                session["user_id"],
                session["id"],
                draw_no,
                result["result_code"],
                biz_date,
                session.get("source_share_token"),
                result.get("result_level"),
                result.get("result_title"),
                result.get("main_text"),
                result.get("good_text"),
                result.get("avoid_text"),
                result.get("explain_title"),
                result.get("explain_content"),
                json.dumps(result_summary, ensure_ascii=False),
            ),
        )
        draw_id = int(conn.execute("SELECT last_insert_rowid()").fetchone()[0])

        chance_before = int(daily_state["remaining_draw_count"])
        chance_after = chance_before - 1
        conn.execute(
            """
            UPDATE user_daily_state
            SET used_draw_count = used_draw_count + 1,
                remaining_draw_count = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (chance_after, daily_state["id"]),
        )
        _insert_chance_log(conn, session["activity_code"], int(session["user_id"]), "draw_consume", -1, chance_before, chance_after, "draw_record", str(draw_id))

        checkin = _record_checkin_once(conn, session["activity_code"], int(session["user_id"]), draw_id)
        if session.get("invite_status") == "pending" and session.get("source_share_token"):
            _complete_share_assist(conn, session, draw_id)

        daily_state = _get_daily_state(conn, session["activity_code"], int(session["user_id"]), biz_date)
        progress = _refresh_qualification(conn, config, int(session["user_id"]))
        conn.commit()

        return {
            "success": True,
            "draw_id": draw_id,
            "draw_no": draw_no,
            "result": result_summary,
            "daily_state": _format_daily_state(daily_state),
            "checkin": checkin,
            "progress": progress,
        }


def get_explain_detail(session_token: str, draw_id: int | None = None, result_code: str | None = None) -> dict[str, Any]:
    with connection() as conn:
        session = _get_session(conn, session_token)
        draw = _get_draw(conn, session, draw_id, result_code)
        result = _get_draw_result(conn, session["activity_code"], draw["result_code"])
        product = _get_product(conn, session["activity_code"], result.get("product_code"))
        reward_code = _ensure_draw_reward_code(conn, session["activity_code"], draw, result, user_id=int(session["user_id"]))
        reward = _get_reward(conn, session["activity_code"], reward_code)
        claim = fetch_one(
            conn,
            """
            SELECT claim_status
            FROM reward_claim_record
            WHERE activity_code = ? AND user_id = ? AND draw_id = ? AND reward_code = ?
            """,
            (session["activity_code"], session["user_id"], draw["id"], reward_code),
        )
        ext = _parse_json(result.get("ext_json"), {})
        ai_explain = generate_ai_explain(result, product)
        detail = {
            "draw_id": draw["id"],
            "result": _build_p2_result(result),
            "title": result.get("explain_title") or "AI解签结果",
            "explainLines": ai_explain["explainLines"],
            "thinkingProcess": ai_explain["thinkingProcess"],
            "themeText": ai_explain.get("themeText") or ext.get("theme_text") or "高考好运 x 牛气补给",
            "ai": ai_explain["ai"],
            "product": _format_product_for_p4(product),
            "benefit": _format_benefit_for_p4(conn, session["activity_code"], result, reward, claim),
        }
        conn.commit()
        return detail


def claim_benefit(payload: dict[str, Any]) -> dict[str, Any]:
    mobile = _normalize_mobile(payload.get("mobile"))
    with connection() as conn:
        session = _get_session(conn, payload["session_token"])
        draw = _get_draw(conn, session, payload.get("draw_id"), None)
        result = _get_draw_result(conn, session["activity_code"], draw["result_code"])
        expected_reward_code = _ensure_draw_reward_code(conn, session["activity_code"], draw, result, user_id=int(session["user_id"]))
        requested_reward_code = payload.get("reward_code")
        if requested_reward_code and requested_reward_code != expected_reward_code:
            raise ApiError(400, "reward does not match draw result")

        reward_code = expected_reward_code
        reward = _get_reward(conn, session["activity_code"], reward_code)
        if not reward:
            raise ApiError(404, "reward not found")

        masked_mobile = _mask_mobile(mobile)
        existing = fetch_one(
            conn,
            """
            SELECT *
            FROM reward_claim_record
            WHERE activity_code = ? AND user_id = ? AND draw_id = ? AND reward_code = ?
            """,
            (session["activity_code"], session["user_id"], draw["id"], reward_code),
        )
        if existing:
            claim_token = existing.get("claim_token") or _build_claim_token()
            if existing.get("coupon_issue_status") == "issued" and existing.get("claim_status") == "success":
                return _format_claim_result(existing, reward, _get_p5_reward_image_url(conn, session["activity_code"], reward))

            if existing.get("coupon_issue_status") == "pending" and existing.get("claim_status") == "pending":
                raise ApiError(409, "领取处理中，请稍后查看")

            issue_config = _get_coupon_issue_config(conn, session["activity_code"], reward_code)
            claim_id = int(existing["id"])
            conn.execute(
                """
                UPDATE reward_claim_record
                SET receiver_mobile = ?,
                    receiver_mobile_masked = ?,
                    claim_token = COALESCE(claim_token, ?),
                    claim_status = 'pending',
                    coupon_issue_status = 'pending',
                    coupon_issue_error = NULL,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (mobile, masked_mobile, claim_token, claim_id),
            )
            conn.commit()
        else:
            claim_no = f"CL{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6].upper()}"
            claim_token = _build_claim_token()
            issue_config = _get_coupon_issue_config(conn, session["activity_code"], reward_code)
            try:
                cursor = conn.execute(
                    """
                    INSERT INTO reward_claim_record (
                      activity_code, user_id, session_id, draw_id, reward_code, claim_no, claim_status,
                      claim_channel, reward_snapshot_json, action_type, action_target, receiver_mobile,
                      receiver_mobile_masked, claim_token, coupon_issue_status, coupon_issue_error,
                      external_coupon_id, biz_date, claimed_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, NULL, ?, NULL)
                    """,
                    (
                        session["activity_code"],
                        session["user_id"],
                        session["id"],
                        draw["id"],
                        reward_code,
                        claim_no,
                        payload.get("claim_channel") or "h5",
                        json.dumps(_format_reward_snapshot(reward), ensure_ascii=False),
                        reward.get("action_type"),
                        reward.get("action_target"),
                        mobile,
                        masked_mobile,
                        claim_token,
                        _today(),
                    ),
                )
                claim_id = int(cursor.lastrowid)
                conn.commit()
            except sqlite3.IntegrityError:
                conn.rollback()
                duplicate = fetch_one(
                    conn,
                    """
                    SELECT *
                    FROM reward_claim_record
                    WHERE activity_code = ? AND user_id = ? AND draw_id = ? AND reward_code = ?
                    """,
                    (session["activity_code"], session["user_id"], draw["id"], reward_code),
                )
                if duplicate and duplicate.get("coupon_issue_status") == "issued" and duplicate.get("claim_status") == "success":
                    return _format_claim_result(duplicate, reward, _get_p5_reward_image_url(conn, session["activity_code"], reward))
                if duplicate:
                    raise ApiError(409, "领取处理中，请稍后查看")
                raise

        try:
            issue_result = _issue_hermes_coupon(mobile, issue_config)
        except ApiError as exc:
            conn.execute(
                """
                UPDATE reward_claim_record
                SET claim_status = 'failed',
                    coupon_issue_status = 'failed',
                    coupon_issue_error = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (exc.message[:255], claim_id),
            )
            conn.commit()
            raise

        external_coupon_id = _extract_hermes_task_id(issue_result)
        conn.execute(
            """
            UPDATE reward_claim_record
            SET claim_status = 'success',
                coupon_issue_status = 'issued',
                coupon_issue_error = NULL,
                external_coupon_id = ?,
                claimed_at = COALESCE(claimed_at, CURRENT_TIMESTAMP),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (external_coupon_id, claim_id),
        )
        claim = fetch_one(conn, "SELECT * FROM reward_claim_record WHERE id = ?", (claim_id,))
        conn.commit()
        return _format_claim_result(claim, reward, _get_p5_reward_image_url(conn, session["activity_code"], reward))


def randomize_benefit(payload: dict[str, Any]) -> dict[str, Any]:
    with connection() as conn:
        session = _get_session(conn, payload["session_token"])
        draw = _get_draw(conn, session, payload.get("draw_id"), None)
        result = _get_draw_result(conn, session["activity_code"], draw["result_code"])
        existing_claim = fetch_one(
            conn,
            """
            SELECT reward_code, claim_status
            FROM reward_claim_record
            WHERE activity_code = ? AND user_id = ? AND draw_id = ?
            ORDER BY created_at DESC, id DESC
            LIMIT 1
            """,
            (session["activity_code"], session["user_id"], draw["id"]),
        )

        if existing_claim:
            reward_code = existing_claim["reward_code"]
        else:
            reward_code = _ensure_draw_reward_code(conn, session["activity_code"], draw, result, user_id=int(session["user_id"]))

        reward = _get_reward(conn, session["activity_code"], reward_code)
        claim = fetch_one(
            conn,
            """
            SELECT claim_status
            FROM reward_claim_record
            WHERE activity_code = ? AND user_id = ? AND draw_id = ? AND reward_code = ?
            """,
            (session["activity_code"], session["user_id"], draw["id"], reward_code),
        )
        benefit = _format_benefit_for_p4(conn, session["activity_code"], result, reward, claim)
        conn.commit()
        return benefit


def get_claim_result(session_token: str, claim_no: str) -> dict[str, Any]:
    with connection() as conn:
        session = _get_session(conn, session_token)
        claim = fetch_one(
            conn,
            """
            SELECT *
            FROM reward_claim_record
            WHERE activity_code = ? AND user_id = ? AND claim_no = ?
            """,
            (session["activity_code"], session["user_id"], claim_no),
        )
        if not claim:
            raise ApiError(404, "claim not found")
        reward = _get_reward(conn, session["activity_code"], claim["reward_code"])
        return _format_claim_result(claim, reward, _get_p5_reward_image_url(conn, session["activity_code"], reward))


def resolve_claim_by_token(claim_token: str) -> dict[str, Any]:
    with connection() as conn:
        claim = fetch_one(
            conn,
            """
            SELECT *
            FROM reward_claim_record
            WHERE claim_token = ?
            """,
            (claim_token,),
        )
        if not claim:
            raise ApiError(404, "claim not found")
        reward = _get_reward(conn, claim["activity_code"], claim["reward_code"])
        result = _format_claim_result(claim, reward, _get_p5_reward_image_url(conn, claim["activity_code"], reward))
        return {
            "activity_code": claim["activity_code"],
            "claim_no": result["claim_no"],
            "claim_token": result["claim_token"],
            "claimStatus": result["claimStatus"],
            "receiver_mobile_masked": result["receiver_mobile_masked"],
            "coupon_issue_status": result["coupon_issue_status"],
            "reward": result["reward"],
        }


def record_share(payload: dict[str, Any]) -> dict[str, Any]:
    with connection() as conn:
        session = _get_session(conn, payload["session_token"])
        config = _get_activity_config(conn, session["activity_code"])
        daily_state = _ensure_daily_state(conn, config, int(session["user_id"]))
        share_token = f"SH{uuid.uuid4().hex[:18]}"
        reward_granted = int(daily_state["share_reward_count_today"]) < int(config["daily_share_bonus_limit"])
        reward_delta = 1 if reward_granted else 0
        conn.execute(
            """
            INSERT INTO share_record (
              activity_code, user_id, session_id, share_token, biz_date, share_channel,
              reward_granted, reward_chance_delta
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session["activity_code"],
                session["user_id"],
                session["id"],
                share_token,
                _today(),
                payload.get("share_channel") or "unknown",
                1 if reward_granted else 0,
                reward_delta,
            ),
        )
        if reward_granted:
            chance_before = int(daily_state["remaining_draw_count"])
            chance_after = chance_before + 1
            conn.execute(
                """
                UPDATE user_daily_state
                SET extra_draw_chance = extra_draw_chance + 1,
                    remaining_draw_count = remaining_draw_count + 1,
                    share_reward_count_today = share_reward_count_today + 1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (daily_state["id"],),
            )
            _insert_chance_log(conn, session["activity_code"], int(session["user_id"]), "share_bonus", 1, chance_before, chance_after, "share_record", share_token)
        daily_state = _get_daily_state(conn, session["activity_code"], int(session["user_id"]), _today())
        conn.commit()
        return {
            "success": True,
            "share_token": share_token,
            "share_url": f"/activity/home?share_token={share_token}",
            "reward_granted": reward_granted,
            "reward_chance_delta": reward_delta,
            "daily_state": _format_daily_state(daily_state),
        }


def get_reward_center(session_token: str) -> dict[str, Any]:
    with connection() as conn:
        session = _get_session(conn, session_token)
        config = _get_activity_config(conn, session["activity_code"])
        daily_state = _ensure_daily_state(conn, config, int(session["user_id"]))
        progress = _refresh_qualification(conn, config, int(session["user_id"]))
        claimed = fetch_all(
            conn,
            """
            SELECT c.id AS claim_id, c.claim_status, c.claim_no, c.created_at AS claim_created_at,
                   c.use_status,
                   r.reward_code, r.reward_type, r.reward_name, r.reward_title, r.reward_desc, r.reward_amount_text,
                   r.reward_image_url, r.button_text, r.action_type, r.action_target, r.ext_json
            FROM reward_claim_record c
            JOIN reward_config r
              ON r.activity_code = c.activity_code AND r.reward_code = c.reward_code
            WHERE c.activity_code = ?
              AND c.user_id = ?
              AND c.claim_status = 'success'
              AND r.is_grand_prize = 0
            ORDER BY r.sort_order ASC, c.created_at ASC
            """,
            (session["activity_code"], session["user_id"]),
        )
        reward_configs = fetch_all(
            conn,
            """
            SELECT r.reward_code, r.reward_type, r.reward_name, r.reward_title, r.reward_desc, r.reward_amount_text,
                   r.reward_image_url, r.button_text, r.action_type, r.action_target, r.ext_json
            FROM reward_config r
            WHERE r.activity_code = ?
              AND r.status = 'enabled'
              AND r.is_grand_prize = 0
            ORDER BY r.sort_order ASC, r.id ASC
            """,
            (session["activity_code"],),
        )
        claimed_by_code: dict[str, dict[str, Any]] = {}
        for row in claimed:
            claimed_by_code.setdefault(row["reward_code"], row)
        display_rows = [claimed_by_code.get(row["reward_code"], row) for row in reward_configs[:5]]
        rewards = [_format_reward_for_p6(row) for row in claimed]
        gift = _format_gift_for_p6(_get_gift_reward(conn, session["activity_code"]), progress)
        display_rewards = [_format_reward_for_p6(row) for row in display_rows] + [gift]
        product = _get_first_product(conn, session["activity_code"])
        conn.commit()
        return {
            "activity_id": session["activity_code"],
            "page_title": "我的奖励",
            "daily_state": _format_daily_state(daily_state),
            "progress": progress,
            "claimed_rewards": rewards,
            "gift_reward": gift,
            "display_rewards": display_rewards,
            "layout_rows": 1 if len(display_rewards) <= 3 else 2,
            "product_recommend": _format_product_for_p6(product),
            "draw_again_action": {"button_text": "再抽一次", "action": {"type": "activity_home", "target": "/activity/home"}},
            "rules_action": {"button_text": "活动规则", "action": {"type": "activity_rules", "target": "/activity/rules"}},
        }


def get_grand_prize_detail(session_token: str) -> dict[str, Any]:
    with connection() as conn:
        session = _get_session(conn, session_token)
        config = _get_activity_config(conn, session["activity_code"])
        progress = _refresh_qualification(conn, config, int(session["user_id"]))
        qrcode = _get_asset(conn, session["activity_code"], "p8_wechat_qrcode")
        qualified = progress["gift_qualified"]
        lottery_no = progress.get("lottery_no") or ""
        status_text = "待开奖" if qualified else "未达标"
        detail = {
            "activity_id": session["activity_code"],
            "qualify_status": progress["gift_status"],
            "qualified": qualified,
            "shared_count": progress["shared_count"],
            "lit_days": progress["lit_days"],
            "button_text": "去使用" if qualified else "未达标",
            "lottery_no": lottery_no,
            "hero": {
                "title": "985和牛礼盒抽奖资格",
                "subtitle": "分享5个好友或累计点亮7天即可解锁",
            },
            "qualification": {
                "qualified": qualified,
                "qualify_type": progress.get("qualify_type") or "none",
                "qualify_desc": progress["progress_desc"],
                "prize_title": config["grand_prize_name"],
                "lottery_no": lottery_no,
            },
            "benefits": [
                {"id": "coupon_50", "title": "50元券", "desc": "企微领取"},
                {"id": "gift_qualification", "title": "礼盒资格", "desc": "已解锁" if qualified else "未达标"},
                {"id": "draw_notice", "title": "开奖提醒", "desc": "企微通知"},
            ],
            "lottery_status": {
                "status": "pending" if qualified else "locked",
                "status_text": status_text,
                "draw_time_desc": "活动结束后 3 个工作日内统一开奖",
                "notice": "中奖编号将在本页面与企微社群同步公示",
                "publicity_title": "中奖公示",
                "publicity_desc": "开奖后将在此更新",
            },
            "wechat_group": {
                "qrcode_url": qrcode.get("asset_url") if qrcode else "",
                "qrcode_id": _parse_json(qrcode.get("ext_json") if qrcode else None, {}).get("qrcode_id", "grand_prize_wechat_default"),
                "title": "扫码添加企微领取",
                "benefits": ["领取50元券", "接收礼盒开奖通知", "查看中奖结果"],
            },
        }
        conn.commit()
        return detail


def get_rules_detail(activity_code: str = DEFAULT_ACTIVITY_CODE) -> dict[str, Any]:
    with connection() as conn:
        config = _get_activity_config(conn, activity_code)
        qrcode = _get_asset(conn, activity_code, "p7_wechat_group_qrcode")
        rules = _parse_json(config.get("rules_text"), [])
        return {
            "activity_id": activity_code,
            "page_title": "活动规则",
            "subtitle": config["activity_name"],
            "rules": rules,
            "wechat_group": {
                "qrcode_url": qrcode.get("asset_url") if qrcode else "",
                "title": "扫码添加企微",
                "desc": "进群可获取活动提醒、专属优惠及福利通知",
            },
        }


def record_tracking_event(payload: dict[str, Any]) -> dict[str, Any]:
    with connection() as conn:
        session = None
        if payload.get("session_token"):
            session = fetch_one(
                conn,
                "SELECT activity_code, user_id, session_token FROM activity_session WHERE session_token = ?",
                (payload["session_token"],),
            )
        conn.execute(
            """
            INSERT INTO tracking_event (activity_code, user_id, session_token, page_code, event_name, event_payload, client_time)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session.get("activity_code") if session else payload.get("activity_code") or DEFAULT_ACTIVITY_CODE,
                session.get("user_id") if session else None,
                payload.get("session_token"),
                payload.get("page_code"),
                payload["event_name"],
                json.dumps(payload.get("event_payload") or {}, ensure_ascii=False),
                payload.get("client_time"),
            ),
        )
        event_id = int(conn.execute("SELECT last_insert_rowid()").fetchone()[0])
        conn.commit()
        return {"success": True, "event_id": event_id}


def _today() -> str:
    return date.today().isoformat()


def _get_activity_config(conn, activity_code: str) -> dict[str, Any]:
    config = fetch_one(conn, "SELECT * FROM activity_config WHERE activity_code = ?", (activity_code,))
    if not config:
        raise ApiError(404, "activity not found")
    return config


def _get_user_by_key(conn, activity_code: str, user_key: str) -> dict[str, Any]:
    user = fetch_one(conn, "SELECT * FROM activity_user WHERE activity_code = ? AND user_key = ?", (activity_code, user_key))
    if not user:
        raise ApiError(404, "user not found")
    return user


def _get_session(conn, session_token: str) -> dict[str, Any]:
    session = fetch_one(
        conn,
        """
        SELECT s.*, u.user_key, u.external_user_id, u.openid, u.unionid, u.nickname, u.avatar_url
        FROM activity_session s
        JOIN activity_user u ON u.id = s.user_id
        WHERE s.session_token = ? AND s.status = 'active'
        """,
        (session_token,),
    )
    if not session:
        raise ApiError(404, "session not found")
    return session


def _ensure_daily_state(conn, config: dict[str, Any], user_id: int) -> dict[str, Any]:
    activity_code = config["activity_code"]
    biz_date = _today()
    existing = _get_daily_state(conn, activity_code, user_id, biz_date)
    if existing:
        return existing

    base_chance = int(config["daily_default_chance"])
    conn.execute(
        """
        INSERT INTO user_daily_state (
          activity_code, user_id, biz_date, base_draw_chance, extra_draw_chance,
          used_draw_count, remaining_draw_count, share_reward_count_today, checked_in_today
        )
        VALUES (?, ?, ?, ?, 0, 0, ?, 0, 0)
        """,
        (activity_code, user_id, biz_date, base_chance, base_chance),
    )
    _insert_chance_log(conn, activity_code, user_id, "daily_default", base_chance, 0, base_chance, "daily_state", biz_date)
    return _get_daily_state(conn, activity_code, user_id, biz_date)


def _get_daily_state(conn, activity_code: str, user_id: int, biz_date: str) -> dict[str, Any] | None:
    return fetch_one(
        conn,
        "SELECT * FROM user_daily_state WHERE activity_code = ? AND user_id = ? AND biz_date = ?",
        (activity_code, user_id, biz_date),
    )


def _get_random_draw_result(conn, activity_code: str) -> dict[str, Any]:
    results = fetch_all(
        conn,
        """
        SELECT *
        FROM draw_result_config
        WHERE activity_code = ? AND status = 'enabled'
        ORDER BY sort_order ASC, id ASC
        """,
        (activity_code,),
    )
    if not results:
        raise ApiError(404, "draw result not configured")
    return results[secrets.randbelow(len(results))]


def _get_random_draw_reward(
    conn,
    activity_code: str,
    fallback_reward_code: str | None,
    exclude_reward_code: str | None = None,
    exclude_reward_codes: set[str | None] | None = None,
    user_id: int | None = None,
) -> dict[str, Any]:
    excluded_codes = {code for code in (exclude_reward_codes or set()) if code}
    if exclude_reward_code:
        excluded_codes.add(exclude_reward_code)
    placeholders = ",".join("?" for _ in P5_RANDOM_REWARD_CODES)
    rewards = fetch_all(
        conn,
        f"""
        SELECT *
        FROM reward_config
        WHERE activity_code = ?
          AND status = 'enabled'
          AND reward_code IN ({placeholders})
        ORDER BY sort_order ASC, id ASC
        """,
        (activity_code, *P5_RANDOM_REWARD_CODES),
    )
    if rewards:
        candidates = [reward for reward in rewards if reward["reward_code"] not in excluded_codes]
        return _select_rotating_reward(conn, activity_code, rewards, candidates or rewards, exclude_reward_code, user_id)

    reward = _get_reward(conn, activity_code, fallback_reward_code)
    if not reward:
        raise ApiError(404, "reward not configured")
    return reward


def _select_rotating_reward(
    conn,
    activity_code: str,
    rewards: list[dict[str, Any]],
    candidates: list[dict[str, Any]],
    anchor_reward_code: str | None = None,
    user_id: int | None = None,
) -> dict[str, Any]:
    reward_by_code = {reward["reward_code"]: reward for reward in rewards}
    candidate_codes = {reward["reward_code"] for reward in candidates}
    anchor_code = anchor_reward_code if anchor_reward_code in reward_by_code else None

    if not anchor_code and user_id is not None:
        recent_draws = fetch_all(
            conn,
            """
            SELECT result_summary_json
            FROM draw_record
            WHERE activity_code = ? AND user_id = ?
            ORDER BY updated_at DESC, id DESC
            LIMIT 12
            """,
            (activity_code, user_id),
        )
        for draw in recent_draws:
            summary = _parse_json(draw.get("result_summary_json"), {})
            reward_code = summary.get("reward_code") or summary.get("rewardCode")
            if reward_code in reward_by_code:
                anchor_code = reward_code
                break

    ordered_codes = [reward["reward_code"] for reward in rewards]
    if anchor_code in ordered_codes:
        anchor_index = ordered_codes.index(anchor_code)
        rotated_codes = ordered_codes[anchor_index + 1 :] + ordered_codes[: anchor_index + 1]
    else:
        rotated_codes = ordered_codes

    for reward_code in rotated_codes:
        if reward_code in candidate_codes:
            return reward_by_code[reward_code]

    return candidates[0]


def _get_draw_result(conn, activity_code: str, result_code: str) -> dict[str, Any]:
    result = fetch_one(conn, "SELECT * FROM draw_result_config WHERE activity_code = ? AND result_code = ?", (activity_code, result_code))
    if not result:
        raise ApiError(404, "draw result not found")
    return result


def _get_draw_reward_code(draw: dict[str, Any], result: dict[str, Any]) -> str | None:
    summary = _parse_json(draw.get("result_summary_json"), {})
    return summary.get("reward_code") or summary.get("rewardCode") or result.get("reward_code")


def _set_draw_reward_code(conn, draw: dict[str, Any], result: dict[str, Any], reward_code: str) -> None:
    summary = _parse_json(draw.get("result_summary_json"), {})
    if not summary:
        summary = _build_p2_result(result)
    summary["reward_code"] = reward_code
    summary["rewardCode"] = reward_code
    summary_json = json.dumps(summary, ensure_ascii=False)
    conn.execute(
        """
        UPDATE draw_record
        SET result_summary_json = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        (summary_json, draw["id"]),
    )
    draw["result_summary_json"] = summary_json


def _ensure_draw_reward_code(conn, activity_code: str, draw: dict[str, Any], result: dict[str, Any], user_id: int | None = None) -> str | None:
    summary = _parse_json(draw.get("result_summary_json"), {})
    reward_code = summary.get("reward_code") or summary.get("rewardCode")
    if reward_code:
        return reward_code

    reward = _get_random_draw_reward(conn, activity_code, result.get("reward_code"), user_id=user_id)
    reward_code = reward["reward_code"]
    _set_draw_reward_code(conn, draw, result, reward_code)
    return reward_code


def _get_draw(conn, session: dict[str, Any], draw_id: int | None = None, result_code: str | None = None) -> dict[str, Any]:
    if draw_id is not None:
        draw = fetch_one(
            conn,
            "SELECT * FROM draw_record WHERE activity_code = ? AND user_id = ? AND id = ?",
            (session["activity_code"], session["user_id"], draw_id),
        )
    elif result_code:
        draw = fetch_one(
            conn,
            """
            SELECT *
            FROM draw_record
            WHERE activity_code = ? AND user_id = ? AND result_code = ?
            ORDER BY created_at DESC, id DESC
            LIMIT 1
            """,
            (session["activity_code"], session["user_id"], result_code),
        )
    else:
        draw = fetch_one(
            conn,
            """
            SELECT *
            FROM draw_record
            WHERE activity_code = ? AND user_id = ?
            ORDER BY created_at DESC, id DESC
            LIMIT 1
            """,
            (session["activity_code"], session["user_id"]),
        )
    if not draw:
        raise ApiError(404, "draw record not found")
    return draw


def _record_checkin_once(conn, activity_code: str, user_id: int, draw_id: int) -> dict[str, Any]:
    biz_date = _today()
    existing = fetch_one(
        conn,
        "SELECT * FROM checkin_record WHERE activity_code = ? AND user_id = ? AND biz_date = ?",
        (activity_code, user_id, biz_date),
    )
    if existing:
        lit_days = _count_lit_days(conn, activity_code, user_id)
        return {"checked_in_today": True, "lit_day_no": existing["lit_day_no"], "lit_days": lit_days}

    lit_day_no = _count_lit_days(conn, activity_code, user_id) + 1
    conn.execute(
        """
        INSERT INTO checkin_record (activity_code, user_id, draw_id, biz_date, lit_day_no)
        VALUES (?, ?, ?, ?, ?)
        """,
        (activity_code, user_id, draw_id, biz_date, lit_day_no),
    )
    conn.execute(
        """
        UPDATE user_daily_state
        SET checked_in_today = 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE activity_code = ? AND user_id = ? AND biz_date = ?
        """,
        (activity_code, user_id, biz_date),
    )
    return {"checked_in_today": True, "lit_day_no": lit_day_no, "lit_days": lit_day_no}


def _complete_share_assist(conn, session: dict[str, Any], draw_id: int) -> None:
    share = fetch_one(
        conn,
        """
        SELECT *
        FROM share_record
        WHERE activity_code = ? AND share_token = ?
        """,
        (session["activity_code"], session["source_share_token"]),
    )
    if not share or int(share["user_id"]) == int(session["user_id"]):
        conn.execute("UPDATE activity_session SET invite_status = 'invalid', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (session["id"],))
        return

    existing = fetch_one(
        conn,
        """
        SELECT id
        FROM share_assist_record
        WHERE activity_code = ? AND share_token = ? AND assister_user_id = ?
        """,
        (session["activity_code"], session["source_share_token"], session["user_id"]),
    )
    if existing:
        conn.execute("UPDATE activity_session SET invite_status = 'completed', assist_completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (session["id"],))
        return

    conn.execute(
        """
        INSERT INTO share_assist_record (
          activity_code, share_record_id, share_token, sharer_user_id, assister_user_id,
          assister_session_id, draw_id, biz_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            session["activity_code"],
            share["id"],
            session["source_share_token"],
            share["user_id"],
            session["user_id"],
            session["id"],
            draw_id,
            _today(),
        ),
    )
    conn.execute(
        """
        UPDATE share_record
        SET share_status = 'completed',
            completed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        (share["id"],),
    )
    conn.execute(
        """
        UPDATE activity_session
        SET invite_status = 'completed',
            assist_completed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        (session["id"],),
    )
    config = _get_activity_config(conn, session["activity_code"])
    _refresh_qualification(conn, config, int(share["user_id"]))


def _refresh_qualification(conn, config: dict[str, Any], user_id: int) -> dict[str, Any]:
    activity_code = config["activity_code"]
    lit_days = _count_lit_days(conn, activity_code, user_id)
    shared_count = _count_share_assists(conn, activity_code, user_id)
    share_target = int(config["share_target"])
    light_target = int(config["checkin_target"])
    by_share = shared_count >= share_target
    by_checkin = lit_days >= light_target
    qualified = by_share or by_checkin
    qualify_type = "both" if by_share and by_checkin else "share" if by_share else "checkin" if by_checkin else "none"
    status = "qualified" if qualified else "not_qualified"
    lottery_no = f"GP{datetime.now().strftime('%Y%m%d')}{user_id:06d}" if qualified else None
    completed_days = list(range(1, min(lit_days, light_target) + 1))
    snapshot = {
        "shared_count": shared_count,
        "share_target": share_target,
        "lit_days": lit_days,
        "light_target": light_target,
    }
    conn.execute(
        """
        INSERT INTO grand_prize_qualification (
          activity_code, user_id, qualify_status, qualify_type, shared_count, lit_days,
          lottery_no, lottery_status, qrcode_id, qrcode_url, qualified_at, qualification_snapshot_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'grand_prize_wechat_default', '/assets/p8/qrcode_grand_prize_wechat.png',
                CASE WHEN ? = 'qualified' THEN CURRENT_TIMESTAMP ELSE NULL END, ?)
        ON CONFLICT(activity_code, user_id) DO UPDATE SET
          qualify_status = excluded.qualify_status,
          qualify_type = excluded.qualify_type,
          shared_count = excluded.shared_count,
          lit_days = excluded.lit_days,
          lottery_no = COALESCE(grand_prize_qualification.lottery_no, excluded.lottery_no),
          qualified_at = CASE
            WHEN grand_prize_qualification.qualified_at IS NULL AND excluded.qualify_status = 'qualified' THEN CURRENT_TIMESTAMP
            ELSE grand_prize_qualification.qualified_at
          END,
          qualification_snapshot_json = excluded.qualification_snapshot_json,
          updated_at = CURRENT_TIMESTAMP
        """,
        (
            activity_code,
            user_id,
            status,
            qualify_type,
            shared_count,
            lit_days,
            lottery_no,
            status,
            json.dumps(snapshot, ensure_ascii=False),
        ),
    )
    saved = fetch_one(
        conn,
        "SELECT * FROM grand_prize_qualification WHERE activity_code = ? AND user_id = ?",
        (activity_code, user_id),
    )
    return {
        "shared_count": shared_count,
        "share_target": share_target,
        "lit_days": lit_days,
        "light_target": light_target,
        "completed_days": completed_days,
        "gift_qualified": qualified,
        "gift_status": status,
        "qualify_status": status,
        "qualify_type": qualify_type,
        "lottery_no": saved.get("lottery_no") if saved else lottery_no,
        "progress_desc": "分享5个好友，或累计点亮7天，赢取985和牛礼盒抽奖资格！",
    }


def _count_lit_days(conn, activity_code: str, user_id: int) -> int:
    row = fetch_one(
        conn,
        "SELECT COUNT(DISTINCT biz_date) AS count FROM checkin_record WHERE activity_code = ? AND user_id = ? AND status = 'valid'",
        (activity_code, user_id),
    )
    return int(row["count"]) if row else 0


def _count_share_assists(conn, activity_code: str, user_id: int) -> int:
    row = fetch_one(
        conn,
        "SELECT COUNT(*) AS count FROM share_assist_record WHERE activity_code = ? AND sharer_user_id = ? AND assist_status = 'completed'",
        (activity_code, user_id),
    )
    return int(row["count"]) if row else 0


def _insert_chance_log(conn, activity_code: str, user_id: int, change_type: str, delta: int, before: int, after: int, source_type: str, source_id: str) -> None:
    conn.execute(
        """
        INSERT INTO draw_chance_log (
          activity_code, user_id, log_no, biz_date, change_type, chance_delta,
          chance_before, chance_after, source_type, source_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            activity_code,
            user_id,
            f"LG{uuid.uuid4().hex}",
            _today(),
            change_type,
            delta,
            before,
            after,
            source_type,
            source_id,
        ),
    )


def _get_reward(conn, activity_code: str, reward_code: str | None) -> dict[str, Any] | None:
    if not reward_code:
        return None
    return fetch_one(conn, "SELECT * FROM reward_config WHERE activity_code = ? AND reward_code = ?", (activity_code, reward_code))


def _get_gift_reward(conn, activity_code: str) -> dict[str, Any]:
    gift = fetch_one(conn, "SELECT * FROM reward_config WHERE activity_code = ? AND is_grand_prize = 1 LIMIT 1", (activity_code,))
    if not gift:
        raise ApiError(404, "gift reward not configured")
    return gift


def _get_product(conn, activity_code: str, product_code: str | None) -> dict[str, Any] | None:
    if not product_code:
        return None
    return fetch_one(conn, "SELECT * FROM product_recommend_config WHERE activity_code = ? AND product_code = ?", (activity_code, product_code))


def _get_first_product(conn, activity_code: str) -> dict[str, Any] | None:
    return fetch_one(
        conn,
        """
        SELECT *
        FROM product_recommend_config
        WHERE activity_code = ? AND status = 'enabled'
        ORDER BY sort_order ASC, id ASC
        LIMIT 1
        """,
        (activity_code,),
    )


def _get_asset(conn, activity_code: str, asset_key: str) -> dict[str, Any] | None:
    return fetch_one(conn, "SELECT * FROM activity_asset_config WHERE activity_code = ? AND asset_key = ?", (activity_code, asset_key))


def _format_activity(config: dict[str, Any]) -> dict[str, Any]:
    return {
        "activity_code": config["activity_code"],
        "activity_name": config["activity_name"],
        "status": config["status"],
        "daily_default_chance": config["daily_default_chance"],
        "daily_share_bonus_limit": config["daily_share_bonus_limit"],
        "share_target": config["share_target"],
        "checkin_target": config["checkin_target"],
        "grand_prize_name": config["grand_prize_name"],
    }


def _format_user(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "user_id": row.get("user_id") or row.get("id"),
        "user_key": row.get("user_key"),
        "external_user_id": row.get("external_user_id"),
        "openid": row.get("openid"),
    }


def _format_session(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "session_id": row.get("id"),
        "session_token": row.get("session_token"),
        "source_share_token": row.get("source_share_token"),
        "invite_status": row.get("invite_status"),
    }


def _format_daily_state(row: dict[str, Any] | None) -> dict[str, Any]:
    if not row:
        return {}
    return {
        "biz_date": row["biz_date"],
        "base_draw_chance": row["base_draw_chance"],
        "extra_draw_chance": row["extra_draw_chance"],
        "used_draw_count": row["used_draw_count"],
        "remaining_draw_count": row["remaining_draw_count"],
        "share_reward_count_today": row["share_reward_count_today"],
        "checked_in_today": bool(row["checked_in_today"]),
    }


def _build_p2_result(result: dict[str, Any]) -> dict[str, Any]:
    ext = _parse_json(result.get("ext_json"), {})
    main_columns = ext.get("main_text_columns")
    if not main_columns:
        main_columns = _split_lines(result.get("main_text"))
    return {
        "result_code": result["result_code"],
        "signType": ext.get("sign_type") or result.get("result_title"),
        "signLevel": result.get("result_level"),
        "mainTextColumns": main_columns,
        "goodFor": result.get("good_text"),
        "avoid": result.get("avoid_text"),
        "explainText": ext.get("explain_text") or result.get("explain_content"),
    }


def _format_product_for_p4(product: dict[str, Any] | None) -> dict[str, Any]:
    if not product:
        return {"productId": "", "productName": "", "productImage": ""}
    ext = _parse_json(product.get("ext_json"), {})
    return {
        "productId": ext.get("p4_product_id") or product.get("product_id") or product.get("product_code"),
        "productName": ext.get("p4_product_name") or product.get("product_name"),
        "productImage": product.get("product_image_url"),
        "action": {"type": product.get("action_type"), "target": product.get("action_target")},
    }


def _format_benefit_for_p4(conn, activity_code: str, result: dict[str, Any], reward: dict[str, Any] | None, claim: dict[str, Any] | None) -> dict[str, Any]:
    ext = _parse_json(result.get("ext_json"), {})
    if not reward:
        return {
            "benefitId": "",
            "rewardCode": "",
            "reward": {},
            "claimStatus": "unclaimed",
            "claimButtonText": ext.get("claim_button_text") or "领取专属福利",
        }

    return {
        "benefitId": ext.get("benefit_id") or reward.get("reward_code"),
        "rewardCode": reward.get("reward_code"),
        "reward": _format_reward_for_p5(reward, _get_p5_reward_image_url(conn, activity_code, reward)),
        "claimStatus": "claimed" if claim and claim["claim_status"] == "success" else "unclaimed",
        "claimButtonText": ext.get("claim_button_text") or "领取专属福利",
    }


def _format_product_for_p6(product: dict[str, Any] | None) -> dict[str, Any]:
    if not product:
        return {}
    ext = _parse_json(product.get("ext_json"), {})
    return {
        "product_id": product.get("product_id") or product.get("product_code"),
        "title": product.get("product_name"),
        "subtitle": product.get("product_desc"),
        "button_text": ext.get("button_text") or "去看看",
        "image_url": product.get("product_image_url"),
        "action": {"type": product.get("action_type"), "target": product.get("action_target")},
    }


def _format_reward_snapshot(reward: dict[str, Any]) -> dict[str, Any]:
    return {
        "reward_code": reward["reward_code"],
        "reward_type": reward["reward_type"],
        "reward_name": reward["reward_name"],
        "reward_title": reward.get("reward_title"),
        "reward_desc": reward.get("reward_desc"),
        "reward_amount_text": reward.get("reward_amount_text"),
        "reward_image_url": reward.get("reward_image_url"),
    }


def _get_p5_reward_image_url(conn, activity_code: str, reward: dict[str, Any] | None) -> str:
    if not reward:
        return ""

    ext = _parse_json(reward.get("ext_json"), {})
    if ext.get("p5_image_url"):
        return ext["p5_image_url"]

    asset = _get_asset(conn, activity_code, f"{reward['reward_code']}_image")
    if asset and asset.get("fallback_url"):
        return asset["fallback_url"]

    return reward.get("reward_image_url") or ""


def _format_reward_for_p5(reward: dict[str, Any], image_url: str = "", coupon_status: str = "unused") -> dict[str, Any]:
    ext = _parse_json(reward.get("ext_json"), {})
    return {
        "reward_code": reward["reward_code"],
        "rewardType": reward["reward_type"],
        "couponId": reward["reward_code"],
        "couponLabel": ext.get("coupon_label") or "优惠券",
        "thresholdText": ext.get("threshold_text") or reward.get("reward_desc") or "",
        "amountText": reward.get("reward_title") or reward.get("reward_amount_text") or "",
        "unitText": ext.get("unit_text") or "",
        "couponName": reward.get("reward_name"),
        "couponStatus": coupon_status,
        "validTimeText": "",
        "imageUrl": image_url,
        "image_url": image_url,
    }


def _normalize_mobile(value: str | None) -> str:
    mobile = str(value or "").strip()
    if not mobile:
        raise ApiError(400, "mobile is required")
    if not MOBILE_PATTERN.fullmatch(mobile):
        raise ApiError(400, "mobile format is invalid")
    return mobile


def _mask_mobile(mobile: str) -> str:
    return f"{mobile[:3]}****{mobile[-4:]}"


def _build_claim_token() -> str:
    return f"ct_{uuid.uuid4().hex}"


def _get_coupon_issue_config(conn, activity_code: str, reward_code: str) -> HermesCouponIssueConfig:
    row = fetch_one(
        conn,
        """
        SELECT id, reward_code, hermes_title, hermes_id, ref_id, ref_type, start_time, end_time, face_value
        FROM coupon_issue_config
        WHERE activity_code = ?
          AND reward_code = ?
          AND issue_channel = 'hermes'
          AND status = 'enabled'
        LIMIT 1
        """,
        (activity_code, reward_code),
    )
    if not row:
        raise ApiError(502, "发券配置缺失，请稍后重试")

    return HermesCouponIssueConfig(
        config_id=int(row["id"]),
        reward_code=str(row["reward_code"]),
        hermes_title=str(row["hermes_title"]),
        hermes_id=int(row["hermes_id"]),
        ref_id=int(row["ref_id"]),
        ref_type=int(row["ref_type"]),
        start_time=str(row["start_time"]),
        end_time=str(row["end_time"]),
        face_value=str(row["face_value"]),
    )


def _issue_hermes_coupon(mobile: str, issue_config: HermesCouponIssueConfig) -> dict[str, Any]:
    try:
        return get_hermes_coupon_client().issue_coupon(mobile, issue_config)
    except HermesCouponError as exc:
        raise ApiError(502, "发券失败，请稍后重试") from exc


def _extract_hermes_task_id(issue_result: dict[str, Any]) -> str | None:
    data = issue_result.get("data") if isinstance(issue_result.get("data"), dict) else {}
    task_id = data.get("id")
    return None if task_id in (None, "") else str(task_id)


def _append_claim_identity(target: str, claim_token: str | None, claim_no: str | None) -> str:
    if not target:
        return ""

    split_target = urlsplit(target)
    query_items = dict(parse_qsl(split_target.query, keep_blank_values=True))
    if claim_token:
        query_items["claim_token"] = claim_token
    if claim_no:
        query_items["claim_no"] = claim_no

    return urlunsplit(
        (
            split_target.scheme,
            split_target.netloc,
            split_target.path,
            urlencode(query_items),
            split_target.fragment,
        )
    )


def _format_claim_result(claim: dict[str, Any], reward: dict[str, Any], p5_image_url: str = "") -> dict[str, Any]:
    ext = _parse_json(reward.get("ext_json"), {})
    claim_no = claim["claim_no"]
    claim_token = claim.get("claim_token") or ""
    receiver_mobile_masked = claim.get("receiver_mobile_masked") or ""
    coupon_issue_status = claim.get("coupon_issue_status") or "pending"
    action_target = _append_claim_identity(reward.get("action_target") or claim.get("action_target") or "", claim_token, claim_no)
    button_text = "去领取" if reward.get("reward_type") in ("coupon", "discount_coupon") else reward.get("button_text") or "去领取"

    return {
        "success": True,
        "message": "领取成功",
        "pageTitle": "领取成功",
        "claim_no": claim_no,
        "claim_token": claim_token,
        "claimToken": claim_token,
        "claimStatus": "claimed" if claim["claim_status"] == "success" else claim["claim_status"],
        "receiver_mobile_masked": receiver_mobile_masked,
        "receiverMobileMasked": receiver_mobile_masked,
        "coupon_issue_status": coupon_issue_status,
        "couponIssueStatus": coupon_issue_status,
        "external_coupon_id": claim.get("external_coupon_id") or "",
        "externalCouponId": claim.get("external_coupon_id") or "",
        "reward": _format_reward_for_p5(reward, p5_image_url, claim.get("use_status") or "unused"),
        "action": {
            "buttonText": button_text,
            "type": reward.get("action_type"),
            "target": action_target,
        },
    }

    return {
        "pageTitle": "领取成功",
        "claim_no": claim["claim_no"],
        "claimStatus": "claimed" if claim["claim_status"] == "success" else claim["claim_status"],
        "reward": {
            "reward_code": reward["reward_code"],
            "rewardType": reward["reward_type"],
            "couponId": reward["reward_code"],
            "couponLabel": ext.get("coupon_label") or "优惠券",
            "thresholdText": ext.get("threshold_text") or reward.get("reward_desc") or "",
            "amountText": reward.get("reward_title") or reward.get("reward_amount_text") or "",
            "unitText": ext.get("unit_text") or "",
            "couponName": reward.get("reward_name"),
            "couponStatus": claim.get("use_status") or "unused",
            "validTimeText": "",
        },
        "action": {
            "buttonText": reward.get("button_text") or "去使用",
            "type": reward.get("action_type"),
            "target": reward.get("action_target") or "",
        },
    }


def _format_reward_for_p6(row: dict[str, Any]) -> dict[str, Any]:
    ext = _parse_json(row.get("ext_json"), {})
    is_claimed = row.get("claim_status") == "success" or row.get("claim_id") is not None
    claim_identity = row.get("claim_no") or row.get("claim_id")
    reward_id = f"{row['reward_code']}_{claim_identity}" if is_claimed and claim_identity else row["reward_code"]
    status = row.get("use_status") or ("unused" if is_claimed else "unclaimed")
    button_text = "未领取" if status == "unclaimed" else "去领取"
    return {
        "reward_code": row["reward_code"],
        "reward_id": reward_id,
        "reward_type": row["reward_type"],
        "title": row.get("reward_title") or row.get("reward_amount_text") or row.get("reward_name"),
        "unit_text": ext.get("unit_text") or "",
        "desc": ext.get("threshold_text") or row.get("reward_desc") or "",
        "status": status,
        "button_text": button_text,
        "image_url": row.get("reward_image_url") or "",
        "action": {"type": row.get("action_type"), "target": row.get("action_target") or ""},
    }


def _format_gift_for_p6(gift: dict[str, Any], progress: dict[str, Any]) -> dict[str, Any]:
    qualified = progress["gift_qualified"]
    return {
        "reward_code": gift["reward_code"],
        "reward_id": gift["reward_code"],
        "reward_type": "gift_lottery_qualification",
        "title": gift.get("reward_title") or gift.get("reward_name"),
        "desc": gift.get("reward_desc") or "抽奖资格",
        "status": "qualified" if qualified else "not_qualified",
        "button_text": "去使用" if qualified else "未达标",
        "action": {"type": "gift_qualification_detail", "target": "/activity/grand-prize"},
    }
    return {
        "reward_code": gift["reward_code"],
        "reward_id": gift["reward_code"],
        "reward_type": "gift_lottery_qualification",
        "title": gift.get("reward_title") or gift.get("reward_name"),
        "desc": gift.get("reward_desc") or "抽奖资格",
        "status": "qualified" if qualified else "not_qualified",
        "button_text": "去领取" if qualified else "未达标",
        "action": {"type": "gift_qualification_detail", "target": "/activity/grand-prize"},
    }


def _parse_json(value: str | None, default: Any) -> Any:
    if not value:
        return default
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return default


def _split_lines(value: str | None) -> list[str]:
    if not value:
        return []
    normalized = value.replace("\\r\\n", "\n").replace("\\n", "\n")
    return [line.strip() for line in normalized.splitlines() if line.strip()]
