"""
PostgreSQL-native cache backed by an UNLOGGED table.

UNLOGGED skips WAL for throwaway cache data — fast writes, wiped on crash
(which is acceptable; Postgres catalog tables remain source of truth).

Expiry is enforced on read (expires_at > now()) so correctness does not
depend on the sweep job. The periodic sweep just reclaims disk space.
"""

from __future__ import annotations

import json
import logging
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import AsyncSessionLocal, sync_engine

log = logging.getLogger(__name__)

CREATE_TABLE_SQL = """
CREATE UNLOGGED TABLE IF NOT EXISTS cache_entries (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
)
"""

CREATE_INDEX_SQL = """
CREATE INDEX IF NOT EXISTS ix_cache_entries_expires_at ON cache_entries (expires_at)
"""


async def ensure_table(session: AsyncSession) -> None:
    await session.execute(text(CREATE_TABLE_SQL))
    await session.execute(text(CREATE_INDEX_SQL))
    await session.commit()


async def get(key: str) -> Any | None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text(
                "SELECT value FROM cache_entries "
                "WHERE key = :key AND expires_at > now()"
            ),
            {"key": key},
        )
        row = result.first()
        if row is None:
            return None
        return row[0]


async def set(key: str, value: Any, ttl_seconds: int) -> None:
    expires_at = datetime.now(UTC) + timedelta(seconds=ttl_seconds)
    payload = json.dumps(value, default=str)
    async with AsyncSessionLocal() as session:
        await session.execute(
            text(
                """
                INSERT INTO cache_entries (key, value, expires_at)
                VALUES (:key, CAST(:value AS jsonb), :expires_at)
                ON CONFLICT (key) DO UPDATE
                    SET value = EXCLUDED.value,
                        expires_at = EXCLUDED.expires_at
                """
            ),
            {"key": key, "value": payload, "expires_at": expires_at},
        )
        await session.commit()


async def delete(key: str) -> None:
    async with AsyncSessionLocal() as session:
        await session.execute(
            text("DELETE FROM cache_entries WHERE key = :key"),
            {"key": key},
        )
        await session.commit()


async def delete_prefix(prefix: str) -> int:
    """Delete all keys starting with prefix (e.g. 'catalog:' for 'catalog:*')."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text("DELETE FROM cache_entries WHERE key LIKE :pattern RETURNING key"),
            {"pattern": prefix + "%"},
        )
        await session.commit()
        return len(result.fetchall())


async def sweep_expired() -> int:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text("DELETE FROM cache_entries WHERE expires_at < now() RETURNING key")
        )
        await session.commit()
        count = len(result.fetchall())
        if count:
            log.info("cache sweep removed %d expired entries", count)
        return count


async def notify_invalidation(prefix: str) -> None:
    """Optional LISTEN/NOTIFY hook for multi-instance cache drops."""
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(
                text("SELECT pg_notify('cache_invalidate', :prefix)"),
                {"prefix": prefix},
            )
            await session.commit()
    except Exception as e:
        log.debug("pg_notify skip: %s", e)


def delete_prefix_sync(prefix: str) -> int:
    with sync_engine.connect() as conn:
        result = conn.execute(
            text("DELETE FROM cache_entries WHERE key LIKE :pattern RETURNING key"),
            {"pattern": prefix + "%"},
        )
        conn.commit()
        return len(result.fetchall())


def sweep_expired_sync() -> int:
    with sync_engine.connect() as conn:
        result = conn.execute(
            text("DELETE FROM cache_entries WHERE expires_at < now() RETURNING key")
        )
        conn.commit()
        return len(result.fetchall())
