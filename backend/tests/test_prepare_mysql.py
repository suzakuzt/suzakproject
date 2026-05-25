import unittest
from pathlib import Path

from scripts.prepare_mysql import (
    MysqlPrepareConfig,
    build_bootstrap_sql,
    collect_mysql_scripts,
    extract_create_table_names,
)


class MysqlPrepareScriptTests(unittest.TestCase):
    def test_collect_mysql_scripts_returns_stable_init_order(self):
        root_dir = Path(__file__).resolve().parents[2]

        scripts = collect_mysql_scripts(root_dir)

        self.assertEqual(
            [script.name for script in scripts],
            [
                "001_init_activity_tables.sql",
                "002_seed_basic_mock_config.sql",
            ],
        )

    def test_mysql_schema_tracks_current_activity_table_count(self):
        root_dir = Path(__file__).resolve().parents[2]
        init_sql = (root_dir / "database" / "mysql" / "001_init_activity_tables.sql").read_text(encoding="utf-8")

        table_names = extract_create_table_names(init_sql)

        self.assertIn("activity_config", table_names)
        self.assertIn("reward_claim_record", table_names)
        self.assertIn("tracking_event", table_names)
        self.assertEqual(len(table_names), 16)

    def test_build_bootstrap_sql_is_safe_for_dry_run_and_masks_password(self):
        root_dir = Path(__file__).resolve().parents[2]
        config = MysqlPrepareConfig(
            database="gaokao_h5_prod",
            host="db.internal",
            port=3306,
            user="activity_user",
            password="secret-password",
        )

        sql = build_bootstrap_sql(root_dir, config)

        self.assertIn("CREATE DATABASE IF NOT EXISTS `gaokao_h5_prod`", sql)
        self.assertIn("USE `gaokao_h5_prod`;", sql)
        self.assertIn("001_init_activity_tables.sql", sql)
        self.assertIn("002_seed_basic_mock_config.sql", sql)
        self.assertNotIn("secret-password", sql)

    def test_database_name_must_be_a_mysql_identifier(self):
        config = MysqlPrepareConfig(database="gaokao-h5-prod")

        with self.assertRaises(ValueError):
            config.mysql_database_identifier()


if __name__ == "__main__":
    unittest.main()
