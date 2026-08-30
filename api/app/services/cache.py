"""Catalog cache facade — same call-site API as before; backed by Postgres UNLOGGED table."""

import hashlib
import json
import logging
from typing import Any

from app import cache as pg_cache

log = logging.getLogger(__name__)

DEFAULT_TTL = 120
CATEGORIES_TTL = 300
HOMEPAGE_TTL = 60


def _pattern_to_prefix(pattern: str) -> str:
    """Convert Redis-style 'catalog:*' to prefix 'catalog:'."""
    return pattern[:-1] if pattern.endswith("*") else pattern


async def cache_get(key: str) -> Any | None:
    try:
        return await pg_cache.get(key)
    except Exception as e:
        log.debug("cache_get miss (%s): %s", key, e)
        return None


async def cache_set(key: str, value: Any, ttl: int = DEFAULT_TTL) -> None:
    try:
        await pg_cache.set(key, value, ttl)
    except Exception as e:
        log.debug("cache_set skip (%s): %s", key, e)


async def cache_delete_pattern(pattern: str) -> int:
    try:
        prefix = _pattern_to_prefix(pattern)
        count = await pg_cache.delete_prefix(prefix)
        await pg_cache.notify_invalidation(prefix)
        return count
    except Exception as e:
        log.debug("cache_delete_pattern skip (%s): %s", pattern, e)
        return 0


def products_cache_key(**params: Any) -> str:
    raw = json.dumps(params, sort_keys=True, default=str)
    digest = hashlib.sha256(raw.encode()).hexdigest()[:16]
    return f"catalog:products:{digest}"


async def invalidate_catalog() -> None:
    await cache_delete_pattern("catalog:*")
    await cache_delete_pattern("homepage:*")


def invalidate_catalog_sync() -> None:
    try:
        pg_cache.delete_prefix_sync("catalog:")
        pg_cache.delete_prefix_sync("homepage:")
    except Exception as e:
        log.debug("invalidate_catalog_sync skip: %s", e)
