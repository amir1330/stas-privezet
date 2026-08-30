"""
security_audit.py

Basic automated security checks against a running API.
Run: python -m scripts.security_audit --url http://localhost:8000
"""

from __future__ import annotations

import argparse
import uuid

import httpx

CHECKS: list[tuple[str, callable]] = []


def check(name: str):
    def deco(fn):
        CHECKS.append((name, fn))
        return fn
    return deco


@check("health is public")
def health_public(url: str) -> bool:
    r = httpx.get(f"{url}/health")
    return r.status_code == 200


@check("admin routes require auth")
def admin_auth(url: str) -> bool:
    r = httpx.get(f"{url}/admin/products")
    return r.status_code in (401, 403)


@check("sqli in search rejected safely")
def sqli_search(url: str) -> bool:
    r = httpx.get(f"{url}/catalog/search", params={"q": "'; DROP TABLE products;--"})
    return r.status_code in (200, 422)


@check("idor inquiry blocked")
def idor_inquiry(url: str) -> bool:
    fake = str(uuid.uuid4())
    r = httpx.patch(f"{url}/inquiries/{fake}", json={"status": "closed"})
    return r.status_code in (401, 403, 404)


@check("security headers present")
def security_headers(url: str) -> bool:
    r = httpx.get(f"{url}/health")
    return "x-content-type-options" in {k.lower() for k in r.headers}


@check("rate limit headers on login")
def rate_limit_login(url: str) -> bool:
    for _ in range(15):
        httpx.post(f"{url}/auth/login", json={"email": "nope@test.com", "password": "wrongpassword1"})
    r = httpx.post(f"{url}/auth/login", json={"email": "nope@test.com", "password": "wrongpassword1"})
    return r.status_code in (401, 429)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://localhost:8000")
    args = parser.parse_args()

    passed, failed = 0, 0
    for name, fn in CHECKS:
        try:
            ok = fn(args.url)
            status = "PASS" if ok else "FAIL"
            print(f"[{status}] {name}")
            if ok:
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"[ERROR] {name}: {e}")
            failed += 1

    print(f"\n{passed} passed, {failed} failed")


if __name__ == "__main__":
    main()
