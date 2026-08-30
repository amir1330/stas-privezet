"""Redis token-bucket rate limiter middleware."""

from collections.abc import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.services.redis_client import get_redis

LIMITS: dict[str, tuple[int, int]] = {
    "/auth/login": (10, 60),
    "/auth/register": (5, 60),
    "/inquiries": (20, 60),
    "/catalog/search": (60, 60),
}


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        limit_cfg = None
        for prefix, cfg in LIMITS.items():
            if path.startswith(prefix) and request.method in ("POST", "GET"):
                limit_cfg = cfg
                break

        if limit_cfg and request.client:
            max_requests, window = limit_cfg
            key = f"rl:{path}:{request.client.host}"
            try:
                redis = get_redis()
                count = await redis.incr(key)
                if count == 1:
                    await redis.expire(key, window)
                if count > max_requests:
                    return JSONResponse(
                        status_code=429,
                        content={"detail": "Rate limit exceeded"},
                        headers={"Retry-After": str(window)},
                    )
            except Exception:
                pass  # degrade — allow request if Redis unavailable

        return await call_next(request)
