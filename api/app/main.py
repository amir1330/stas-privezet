import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.cache import ensure_table, sweep_expired
from app.config import get_settings
from app.db import AsyncSessionLocal
from app.logging_config import setup_logging
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.request_logging import RequestLoggingMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.routers import admin, admin_products, auth, catalog, inquiries, orders, site

settings = get_settings()
log = logging.getLogger(__name__)

CACHE_SWEEP_INTERVAL_SECONDS = 300


async def _cache_sweep_loop() -> None:
    """Periodic expiry sweep — APScheduler/pg_cron fallback when pg_cron is unavailable."""
    while True:
        await asyncio.sleep(CACHE_SWEEP_INTERVAL_SECONDS)
        try:
            await sweep_expired()
        except Exception as e:
            log.warning("cache sweep failed: %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    async with AsyncSessionLocal() as session:
        await ensure_table(session)

    sweep_task = asyncio.create_task(_cache_sweep_loop())

    if settings.env == "production":
        try:
            import sentry_sdk
            from sentry_sdk.integrations.fastapi import FastApiIntegration

            dsn = settings.sentry_dsn or __import__("os").environ.get("SENTRY_DSN")
            if dsn:
                sentry_sdk.init(dsn=dsn, integrations=[FastApiIntegration()], traces_sample_rate=0.1)
        except ImportError:
            pass

    yield

    sweep_task.cancel()
    try:
        await sweep_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="Poizon Reseller Marketplace API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.web_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(catalog.router)
app.include_router(inquiries.router)
app.include_router(orders.router)
app.include_router(admin.router)
app.include_router(admin_products.router)
app.include_router(site.router)

# Local dev image serving (image pipeline writes here)
_static_dir = Path("/tmp/marketplace-images")
_static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(_static_dir)), name="static")


@app.get("/health")
async def health():
    checks: dict = {"api": "ok"}
    try:
        from app.cache import get as cache_get

        # Postgres cache is healthy if we can read (miss is fine)
        await cache_get("__health_probe__")
        checks["pg_cache"] = "ok"
    except Exception as e:
        checks["pg_cache"] = f"error: {e}"
    try:
        from app.services.redis_client import get_redis

        await get_redis().ping()
        checks["redis"] = "ok"
    except Exception as e:
        checks["redis"] = f"error: {e} (rate limiting only)"
    try:
        from app.services.meilisearch_client import get_meili_client

        get_meili_client().health()
        checks["meilisearch"] = "ok"
    except Exception as e:
        checks["meilisearch"] = f"error: {e}"
    from fastapi.responses import JSONResponse

    overall = "ok" if checks["api"] == "ok" else "error"
    if any(v != "ok" for k, v in checks.items() if k != "api"):
        overall = "degraded"
    return JSONResponse(content={"status": overall, "checks": checks}, status_code=200)
