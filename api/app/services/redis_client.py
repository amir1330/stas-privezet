"""Shared async Redis connection."""

from functools import lru_cache

import redis.asyncio as aioredis

from app.config import get_settings


@lru_cache
def get_redis() -> aioredis.Redis:
    return aioredis.from_url(get_settings().redis_url, decode_responses=True)
