"""
sync_meilisearch.py

Sync published products from Postgres into Meilisearch.
Run after import or on a cron schedule.

    python -m scripts.sync_meilisearch
    python -m scripts.sync_meilisearch --full   # reindex all published
"""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db import sync_engine
from app.models import Product
from app.services.meilisearch_client import get_index, product_document

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("meili_sync")

BATCH = 500


def build_doc(product: Product) -> dict:
    sizes = [v.size for v in product.variants if v.size and v.in_stock]
    thumb = sorted(product.images, key=lambda i: i.sort_order)[0].cdn_url if product.images else None
    return product_document(
        id=str(product.id),
        slug=product.slug,
        title=product.title,
        brand=product.brand,
        category_name=product.category.name if product.category else None,
        category_slug=product.category.slug if product.category else None,
        price_krw=float(product.price_krw) if product.price_krw else None,
        is_in_stock=product.is_in_stock,
        sizes=sizes,
        thumbnail_url=thumb,
        created_at=product.created_at.isoformat() if product.created_at else "",
    )


def sync_all() -> int:
    index = get_index()
    total = 0
    with Session(sync_engine) as session:
        stmt = (
            select(Product)
            .where(Product.is_published.is_(True))
            .options(
                selectinload(Product.variants),
                selectinload(Product.images),
                selectinload(Product.category),
            )
        )
        products = session.scalars(stmt).unique().all()
        batch: list[dict] = []
        for p in products:
            batch.append(build_doc(p))
            if len(batch) >= BATCH:
                index.add_documents(batch)
                total += len(batch)
                log.info("indexed %d so far", total)
                batch = []
        if batch:
            index.add_documents(batch)
            total += len(batch)
    log.info("done — indexed %d products", total)
    return total


def main():
    argparse.ArgumentParser().parse_args()
    sync_all()


if __name__ == "__main__":
    main()
