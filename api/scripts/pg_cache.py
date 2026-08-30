"""
pg_cache.py — CLI helpers for the Postgres UNLOGGED cache table.

    python -m scripts.pg_cache sweep          # delete expired rows
    python -m scripts.pg_cache invalidate catalog:  # drop prefix
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.cache import delete_prefix_sync, sweep_expired_sync


def main():
    parser = argparse.ArgumentParser(description="Postgres cache maintenance")
    sub = parser.add_subparsers(dest="cmd", required=True)

    sub.add_parser("sweep", help="Delete expired cache_entries rows")

    inv = sub.add_parser("invalidate", help="Delete keys by prefix")
    inv.add_argument("prefix", help="Key prefix, e.g. catalog:")

    args = parser.parse_args()

    if args.cmd == "sweep":
        n = sweep_expired_sync()
        print(f"swept {n} expired entries")
    elif args.cmd == "invalidate":
        n = delete_prefix_sync(args.prefix)
        print(f"deleted {n} entries with prefix {args.prefix!r}")


if __name__ == "__main__":
    main()
