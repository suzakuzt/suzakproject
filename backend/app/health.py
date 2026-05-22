import json
from typing import Any

from .database import connection, default_database_path, table_names
from .repositories import ActivityRepository


DEFAULT_ACTIVITY_CODE = "gaokao_lucky_sign_2026"


def build_health_status(activity_code: str = DEFAULT_ACTIVITY_CODE) -> dict[str, Any]:
    db_path = default_database_path()
    with connection(db_path) as conn:
        names = table_names(conn)
        repo = ActivityRepository(conn)
        activity = repo.get_activity_state_config(activity_code)
        seed_counts = repo.get_basic_config_counts(activity_code)

    return {
        "database": {
            "connected": True,
            "path": str(db_path),
            "table_count": len(names),
        },
        "activity": activity,
        "seed_counts": seed_counts,
    }


def main() -> None:
    print(json.dumps(build_health_status(), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
