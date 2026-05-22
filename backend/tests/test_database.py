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
        self.assertEqual(len(names), 16)

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
        self.assertEqual(config["daily_default_chance"], 1)
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
                "product_count": 1,
                "reward_count": 7,
                "draw_result_count": 1,
            },
        )


class HealthStatusTests(unittest.TestCase):
    def test_build_health_status_returns_database_and_seed_summary(self):
        status = build_health_status("gaokao_lucky_sign_2026")

        self.assertEqual(status["database"]["connected"], True)
        self.assertEqual(status["database"]["table_count"], 16)
        self.assertEqual(status["activity"]["activity_code"], "gaokao_lucky_sign_2026")
        self.assertEqual(status["activity"]["daily_default_chance"], 1)
        self.assertEqual(status["seed_counts"]["reward_count"], 7)


if __name__ == "__main__":
    unittest.main()
