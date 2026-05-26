import sqlite3
from typing import Any

from .database import fetch_one


class ActivityRepository:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def get_activity_state_config(self, activity_code: str) -> dict[str, Any]:
        row = fetch_one(
            self.conn,
            """
            SELECT
              activity_code,
              activity_name,
              status,
              daily_default_chance,
              daily_share_bonus_limit,
              share_target,
              checkin_target,
              grand_prize_name
            FROM activity_config
            WHERE activity_code = ?
            """,
            (activity_code,),
        )
        if row is None:
            raise LookupError(f"activity_config not found: {activity_code}")
        return row

    def get_basic_config_counts(self, activity_code: str) -> dict[str, int]:
        queries = {
            "asset_count": "SELECT COUNT(*) AS count FROM activity_asset_config WHERE activity_code = ?",
            "product_count": "SELECT COUNT(*) AS count FROM product_recommend_config WHERE activity_code = ?",
            "reward_count": "SELECT COUNT(*) AS count FROM reward_config WHERE activity_code = ?",
            "draw_result_count": "SELECT COUNT(*) AS count FROM draw_result_config WHERE activity_code = ? AND status = 'enabled'",
        }
        counts: dict[str, int] = {}
        for key, sql in queries.items():
            row = fetch_one(self.conn, sql, (activity_code,))
            counts[key] = int(row["count"]) if row is not None else 0
        return counts
