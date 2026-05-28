import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterable, Iterator

from .local_env import load_local_env


SUPPORTED_DATABASE_ENGINES = {"sqlite", "mysql"}
DEFAULT_SQLITE_BOOTSTRAP_SCRIPTS = (
    "001_init_activity_tables.sql",
    "002_seed_basic_mock_config.sql",
    "003_optimize_activity_tables.sql",
    "004_allow_duplicate_reward_claims_per_draw.sql",
    "006_add_coupon_issue_config.sql",
    "007_add_grand_prize_draw_config.sql",
    "008_add_grand_prize_lottery_suffix.sql",
    "009_add_grand_prize_draw_time.sql",
)


class MysqlConnection:
    db_engine = "mysql"

    def __init__(self, raw_conn: Any):
        self.raw_conn = raw_conn

    def execute(self, sql: str, params: Iterable[Any] = ()):
        cursor = self.raw_conn.cursor()
        cursor.execute(translate_sql_placeholders(sql), tuple(params))
        return cursor

    def commit(self) -> None:
        self.raw_conn.commit()

    def rollback(self) -> None:
        self.raw_conn.rollback()

    def close(self) -> None:
        self.raw_conn.close()


def default_database_path() -> Path:
    configured_path = os.environ.get("GAOKAO_H5_DB_PATH")
    if configured_path:
        return Path(configured_path).expanduser().resolve()

    default_path = Path(__file__).resolve().parents[1] / "data" / "gaokao_h5_dev.sqlite3"
    _ensure_default_sqlite_database(default_path)
    return default_path


def get_database_engine() -> str:
    load_local_env()
    engine = os.environ.get("GAOKAO_H5_DB_ENGINE", "sqlite").strip().lower() or "sqlite"
    if engine not in SUPPORTED_DATABASE_ENGINES:
        raise ValueError("GAOKAO_H5_DB_ENGINE must be sqlite or mysql")
    return engine


def build_mysql_config() -> dict[str, Any]:
    load_local_env()
    return {
        "host": os.environ.get("GAOKAO_H5_MYSQL_HOST", "127.0.0.1"),
        "port": int(os.environ.get("GAOKAO_H5_MYSQL_PORT", "3306")),
        "database": os.environ.get("GAOKAO_H5_MYSQL_DATABASE", "gaokao_h5"),
        "user": os.environ.get("GAOKAO_H5_MYSQL_USER", "root"),
        "password": os.environ.get("GAOKAO_H5_MYSQL_PASSWORD", ""),
        "charset": "utf8mb4",
        "connect_timeout": int(os.environ.get("GAOKAO_H5_MYSQL_CONNECT_TIMEOUT", "10")),
    }


def translate_sql_placeholders(sql: str) -> str:
    translated: list[str] = []
    in_single_quote = False
    in_double_quote = False
    escaped = False
    for char in sql:
        if escaped:
            translated.append(char)
            escaped = False
            continue
        if char == "\\" and (in_single_quote or in_double_quote):
            translated.append(char)
            escaped = True
            continue
        if char == "'" and not in_double_quote:
            in_single_quote = not in_single_quote
            translated.append(char)
            continue
        if char == '"' and not in_single_quote:
            in_double_quote = not in_double_quote
            translated.append(char)
            continue
        if char == "?" and not in_single_quote and not in_double_quote:
            translated.append("%s")
            continue
        translated.append(char)
    return "".join(translated)


def connect(database_path: str | Path | None = None) -> Any:
    if database_path is not None or get_database_engine() == "sqlite":
        return _connect_sqlite(database_path)
    return _connect_mysql()


def _connect_sqlite(database_path: str | Path | None = None) -> sqlite3.Connection:
    db_path = Path(database_path) if database_path is not None else default_database_path()
    if database_path is None:
        _ensure_default_sqlite_database(db_path)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def _ensure_default_sqlite_database(db_path: Path) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(db_path) as conn:
        has_activity_schema = conn.execute(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'activity_config'"
        ).fetchone()
        if has_activity_schema:
            return

        sqlite_dir = Path(__file__).resolve().parents[2] / "database" / "sqlite"
        for script_name in DEFAULT_SQLITE_BOOTSTRAP_SCRIPTS:
            conn.executescript((sqlite_dir / script_name).read_text(encoding="utf-8"))


def _connect_mysql() -> MysqlConnection:
    try:
        import pymysql
        from pymysql.cursors import DictCursor
    except ImportError as error:
        raise RuntimeError("PyMySQL is required when GAOKAO_H5_DB_ENGINE=mysql") from error

    config = build_mysql_config()
    raw_conn = pymysql.connect(
        host=config["host"],
        port=config["port"],
        user=config["user"],
        password=config["password"],
        database=config["database"],
        charset=config["charset"],
        connect_timeout=config["connect_timeout"],
        autocommit=False,
        cursorclass=DictCursor,
    )
    return MysqlConnection(raw_conn)


@contextmanager
def connection(database_path: str | Path | None = None) -> Iterator[Any]:
    conn = connect(database_path)
    try:
        yield conn
    finally:
        conn.close()


def fetch_one(conn: Any, sql: str, params: Iterable[Any] = ()) -> dict[str, Any] | None:
    row = conn.execute(sql, tuple(params)).fetchone()
    return dict(row) if row is not None else None


def fetch_all(conn: Any, sql: str, params: Iterable[Any] = ()) -> list[dict[str, Any]]:
    rows = conn.execute(sql, tuple(params)).fetchall()
    return [dict(row) for row in rows]


def table_names(conn: Any) -> list[str]:
    if is_mysql_connection(conn):
        rows = conn.execute(
            """
            SELECT table_name AS name
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
            ORDER BY table_name
            """
        ).fetchall()
        return [row["name"] for row in rows]

    rows = conn.execute(
        """
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name NOT LIKE 'sqlite_%'
        ORDER BY name
        """
    ).fetchall()
    return [row["name"] for row in rows]


def is_mysql_connection(conn: Any) -> bool:
    return getattr(conn, "db_engine", "") == "mysql"


def last_insert_id(conn: Any, cursor: Any | None = None) -> int:
    if cursor is not None and getattr(cursor, "lastrowid", None) is not None:
        return int(cursor.lastrowid)
    if is_mysql_connection(conn):
        row = conn.execute("SELECT LAST_INSERT_ID() AS id").fetchone()
        return int(row["id"])
    return int(conn.execute("SELECT last_insert_rowid()").fetchone()[0])


def is_integrity_error(error: Exception) -> bool:
    if isinstance(error, sqlite3.IntegrityError):
        return True
    return error.__class__.__name__ == "IntegrityError" and error.__class__.__module__.startswith("pymysql")
