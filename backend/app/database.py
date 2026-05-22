import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterable, Iterator


def default_database_path() -> Path:
    configured_path = os.environ.get("GAOKAO_H5_DB_PATH")
    if configured_path:
        return Path(configured_path).expanduser().resolve()

    return Path(__file__).resolve().parents[1] / "data" / "gaokao_h5_dev.sqlite3"


def connect(database_path: str | Path | None = None) -> sqlite3.Connection:
    db_path = Path(database_path) if database_path is not None else default_database_path()
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def connection(database_path: str | Path | None = None) -> Iterator[sqlite3.Connection]:
    conn = connect(database_path)
    try:
        yield conn
    finally:
        conn.close()


def fetch_one(conn: sqlite3.Connection, sql: str, params: Iterable[Any] = ()) -> dict[str, Any] | None:
    row = conn.execute(sql, tuple(params)).fetchone()
    return dict(row) if row is not None else None


def fetch_all(conn: sqlite3.Connection, sql: str, params: Iterable[Any] = ()) -> list[dict[str, Any]]:
    rows = conn.execute(sql, tuple(params)).fetchall()
    return [dict(row) for row in rows]


def table_names(conn: sqlite3.Connection) -> list[str]:
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
