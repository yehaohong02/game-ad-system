"""Redis client singleton."""

from __future__ import annotations

import redis

from src.shared.config import get_settings

_client: redis.Redis | None = None


def get_redis() -> redis.Redis:
    """Return a singleton Redis client."""
    global _client
    if _client is None:
        settings = get_settings()
        _client = redis.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            db=settings.redis_db,
            decode_responses=True,
        )
    return _client
