# Poizon Reseller Marketplace — Implementation Plan

**Goal:** A fast (McMaster-Carr-tier), modern-looking marketplace for 30k+ products, built on Python + Postgres, running on a single VPS, with 3 roles (User / Admin / Support), secure by default, and ready to bolt on payments later.

---

## 0. Recommended Stack (and why)

| Layer | Choice | Why |
|---|---|---|
| Backend API | **FastAPI** (Python, async) | Async Postgres access, auto OpenAPI docs, Pydantic validation as first-line security. |
| Database | **PostgreSQL 16** | Relational integrity for orders/inquiries, JSONB for specs, full-text search fallback, **UNLOGGED cache table** for hot read paths. |
| ORM / DB access | **SQLAlchemy 2.0 (async) + Alembic** | Parameterized queries, migrations in git. |
| Search / filtering | **Meilisearch** (self-hosted) | Faceted filter+search at 30k scale; sub-50ms on one VPS. |
| Cache | **Postgres `UNLOGGED cache_entries`** | Category pages, search result pages, product detail, exchange-rate calcs — skips WAL for fast cache writes; expiry checked on read; `pg_cron` or app-level sweep reclaims rows. |
| Rate limiting | **Redis** | Token-bucket counters on login/inquiry/search — higher-frequency, latency-sensitive; **not** used for catalog caching. |
| Frontend | **Next.js (App Router) + Tailwind** | SSR/ISR by default; minimal client JS on storefront. |
| Object storage | **Cloudflare R2** + CDN | 30k products × N images off VPS disk. |
| Reverse proxy | **Traefik** or **Nginx** | TLS, Brotli, HTTP/2/3, edge rate limiting. |
| Auth | **JWT access + httpOnly refresh cookie**, **argon2id** | Stateless-friendly RBAC. |
| Deployment | **Docker Compose** | Each service isolated; scale out later without rewrite. |

---

## 3. Phased Roadmap (excerpt — Phase 3)

### Phase 3 — Search & Caching Layer

- Stand up Meilisearch, index products (title, brand, category, price, size) with sync job on publish/edit.
- **Postgres-native caching** (replaces Redis for catalog):
  - **`UNLOGGED TABLE cache_entries`** — `(key TEXT PK, value JSONB, expires_at TIMESTAMPTZ)` + index on `expires_at`.
  - **What gets cached:** category tree, brand list, cursor-paginated product lists, Meilisearch result pages, individual product detail JSON.
  - **TTL:** set on write via `expires_at`; **`get()` returns `None` if expired** even before sweep runs (correctness never depends on cron alone).
  - **Sweep:** `pg_cron` job every 5 min *or* asyncio periodic task in API lifespan (`DELETE WHERE expires_at < now()`) when `pg_cron` isn't on the host image.
  - **Invalidation on publish/edit:** admin routes call `delete_prefix('catalog:')` / `delete_prefix('homepage:')` after mutating products; optional `pg_notify('cache_invalidate', prefix)` for multi-instance drops.
- Load-test catalog list + search endpoints before frontend ships.

---

## Why this holds up at 30k+ products on one VPS

- Images and search offload to R2/CDN and Meilisearch — the two things that don't scale on a single box.
- **Postgres cache avoids the expensive join/search query**, not Postgres itself — cached responses are a single indexed `key` lookup on an UNLOGGED table (no WAL on writes), so hot storefront paths skip query planning and relation scans while still using one database engine.
- ISR on Next.js means many page views never hit the API at all.
- Phase 6 tricks (prefetch, CLS, Brotli) reduce bytes and client CPU — perceived speed matters more than raw horsepower.

---

## Appendix D — `app/cache.py` (Postgres-native cache)

Reference implementation lives at `api/app/cache.py`. CLI maintenance: `python -m scripts.pg_cache sweep`.

```python
"""
Postgres UNLOGGED cache — Redis replacement for catalog/search payloads.

Table (also in Alembic 002):
    CREATE UNLOGGED TABLE cache_entries (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL
    );
    CREATE INDEX ix_cache_entries_expires_at ON cache_entries (expires_at);

Interface (identical shape to former Redis facade in app/services/cache.py):
    await cache.get(key)              -> value | None  (None on miss OR expired)
    await cache.set(key, val, ttl)    -> upsert with expires_at = now() + ttl
    await cache.delete(key)
    await cache.delete_prefix("catalog:")  -> invalidates catalog:* keys

Sweep (pick one):
    - pg_cron:  SELECT cron.schedule('0 */5 * * * *', $$DELETE FROM cache_entries WHERE expires_at < now()$$);
    - APScheduler / asyncio loop in FastAPI lifespan (current default — pg_cron not in postgres:16-alpine)

Invalidation:
    - Admin publish/edit -> delete_prefix('catalog:') + delete_prefix('homepage:')
    - Optional NOTIFY for multi-worker: SELECT pg_notify('cache_invalidate', 'catalog:');

NOT migrated in this pass:
    - Rate limiting (still Redis token bucket in app/middleware/rate_limit.py)
    - Session storage (JWT cookies — no server-side session store today)
"""
```

Call sites import `cache_get` / `cache_set` / `invalidate_catalog` from `app.services.cache` — unchanged.

---

## Data Model (Section 1 — unchanged)

Catalog tables (`products`, `variants`, `images`, etc.) are separate from `cache_entries`. Never import `scraper_state.db` — only `data/products/*.json` feeds Postgres.
