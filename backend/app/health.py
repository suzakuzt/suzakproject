import json
from typing import Any

from .database import build_mysql_config, connection, default_database_path, get_database_engine, table_names
from .repositories import ActivityRepository


DEFAULT_ACTIVITY_CODE = "gaokao_lucky_sign_2026"


def build_health_status(activity_code: str = DEFAULT_ACTIVITY_CODE) -> dict[str, Any]:
    engine = get_database_engine()
    with connection() as conn:
        names = table_names(conn)
        repo = ActivityRepository(conn)
        activity = repo.get_activity_state_config(activity_code)
        seed_counts = repo.get_basic_config_counts(activity_code)

    database: dict[str, Any] = {
        "connected": True,
        "engine": engine,
        "table_count": len(names),
    }
    if engine == "mysql":
        config = build_mysql_config()
        database.update(
            {
                "host": config["host"],
                "database": config["database"],
                "user": config["user"],
            }
        )
    else:
        database["path"] = str(default_database_path())

    return {
        "database": database,
        "activity": activity,
        "seed_counts": seed_counts,
    }


def main() -> None:
    print(json.dumps(build_health_status(), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
