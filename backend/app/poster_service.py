import base64
import binascii
import os
import uuid
from pathlib import Path
from typing import Any

from .activity_service import DEFAULT_ACTIVITY_CODE, ApiError, record_tracking_event


PNG_DATA_URL_PREFIX = "data:image/png;base64,"
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def get_poster_storage_dir() -> Path:
    configured_dir = os.environ.get("GAOKAO_H5_POSTER_DIR")
    if configured_dir:
        return Path(configured_dir)

    return Path(__file__).resolve().parents[1] / "data" / "posters"


def save_poster(payload: dict[str, Any]) -> dict[str, Any]:
    image_data_url = payload.get("image_data_url") or ""
    if not image_data_url.startswith(PNG_DATA_URL_PREFIX):
        raise ApiError(400, "poster image must be a png data url")

    encoded_image = image_data_url[len(PNG_DATA_URL_PREFIX) :]
    try:
        image_bytes = base64.b64decode(encoded_image, validate=True)
    except (binascii.Error, ValueError) as error:
        raise ApiError(400, "poster image base64 is invalid") from error

    if not image_bytes.startswith(PNG_SIGNATURE):
        raise ApiError(400, "poster image content is not png")

    poster_id = f"poster_{uuid.uuid4().hex}"
    storage_dir = get_poster_storage_dir()
    storage_dir.mkdir(parents=True, exist_ok=True)
    poster_path = storage_dir / f"{poster_id}.png"
    poster_path.write_bytes(image_bytes)

    response = {
        "success": True,
        "saved": True,
        "poster_id": poster_id,
        "poster_url": f"/api/poster/image/{poster_id}",
        "byte_size": len(image_bytes),
        "content_type": "image/png",
    }

    record_tracking_event(
        {
            "session_token": payload.get("session_token"),
            "activity_code": payload.get("activity_code") or DEFAULT_ACTIVITY_CODE,
            "page_code": payload.get("page_code") or "p2",
            "event_name": "poster_save_success",
            "event_payload": {
                "poster_id": poster_id,
                "poster_type": payload.get("poster_type") or "result_share",
                "byte_size": len(image_bytes),
            },
        },
    )

    return response


def resolve_poster_path(poster_id: str) -> Path | None:
    if not poster_id.startswith("poster_") or not all(char.isalnum() or char == "_" for char in poster_id):
        return None

    poster_path = get_poster_storage_dir() / f"{poster_id}.png"
    if not poster_path.is_file():
        return None

    return poster_path
