"""
load_test.py

Basic concurrent load test for catalog + search endpoints.
Requires API running and some published products in Meilisearch.

    python -m scripts.load_test --url http://localhost:8000 --concurrency 20 --requests 200
"""

from __future__ import annotations

import argparse
import asyncio
import statistics
import time

import httpx

ENDPOINTS = [
    "/catalog/categories",
    "/catalog/brands",
    "/catalog/products",
    "/catalog/search?q=nike",
    "/health",
]


async def hit(client: httpx.AsyncClient, url: str, path: str) -> float:
    start = time.perf_counter()
    resp = await client.get(f"{url}{path}")
    elapsed = time.perf_counter() - start
    resp.raise_for_status()
    return elapsed


async def worker(url: str, requests_per_worker: int, latencies: list[float]) -> None:
    async with httpx.AsyncClient(timeout=30.0) as client:
        for i in range(requests_per_worker):
            path = ENDPOINTS[i % len(ENDPOINTS)]
            try:
                latencies.append(await hit(client, url, path))
            except Exception as e:
                print(f"ERROR {path}: {e}")


async def run(url: str, concurrency: int, total_requests: int) -> None:
    per_worker = total_requests // concurrency
    latencies: list[float] = []
    start = time.perf_counter()
    await asyncio.gather(*[worker(url, per_worker, latencies) for _ in range(concurrency)])
    elapsed = time.perf_counter() - start

    if not latencies:
        print("No successful requests")
        return

    print(f"Requests:  {len(latencies)}")
    print(f"Duration:  {elapsed:.2f}s")
    print(f"RPS:       {len(latencies) / elapsed:.1f}")
    print(f"p50:       {statistics.median(latencies) * 1000:.1f}ms")
    print(f"p95:       {sorted(latencies)[int(len(latencies) * 0.95)] * 1000:.1f}ms")
    print(f"p99:       {sorted(latencies)[int(len(latencies) * 0.99)] * 1000:.1f}ms")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://localhost:8000")
    parser.add_argument("--concurrency", type=int, default=10)
    parser.add_argument("--requests", type=int, default=100)
    args = parser.parse_args()
    asyncio.run(run(args.url, args.concurrency, args.requests))


if __name__ == "__main__":
    main()
