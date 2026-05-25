import os
from pathlib import Path


def load_local_env() -> None:
    backend_dir = Path(__file__).resolve().parents[1]
    for env_path in (backend_dir / ".env", backend_dir / ".env.local"):
        if not env_path.exists():
            continue
        for line in env_path.read_text(encoding="utf-8").splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            key, value = stripped.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))
