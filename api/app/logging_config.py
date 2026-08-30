"""Structured JSON logging setup."""

import logging
import sys

from app.config import get_settings


def setup_logging() -> None:
    settings = get_settings()
    level = getattr(logging, settings.log_level.upper(), logging.INFO)

    handler = logging.StreamHandler(sys.stdout)
    if settings.env == "production":
        try:
            import json
            from datetime import UTC, datetime

            class JsonFormatter(logging.Formatter):
                def format(self, record: logging.LogRecord) -> str:
                    payload = {
                        "ts": datetime.now(UTC).isoformat(),
                        "level": record.levelname,
                        "logger": record.name,
                        "msg": record.getMessage(),
                    }
                    for key in ("request_id", "method", "path", "status", "duration_ms", "client"):
                        if hasattr(record, key):
                            payload[key] = getattr(record, key)
                    return json.dumps(payload)

            handler.setFormatter(JsonFormatter())
        except ImportError:
            handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s"))
    else:
        handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s"))

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)
