"""
import_products.py

Imports the canonical scraped catalog (data/products/{spu_id}.json) into Postgres.

Source of truth: data/products/*.json
NOT imported:     data/scraper_state.db (crawl queue only)
NOT imported:     data/catalog.csv      (derived export, not authoritative)

Run:
    python -m scripts.import_products --data-dir /path/to/data --cdn-map ./cdn_url_map.json
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from datetime import date, datetime
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

# Allow running as module from api/
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db import sync_engine
from app.models import (
    Category,
    ColorVariant,
    Product,
    ProductImage,
    ProductSpec,
    ProductVariant,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("import")


def validate_product(data: dict) -> tuple[bool, list[str]]:
    problems = []
    if not data.get("title"):
        problems.append("missing title")
    if not data.get("brand"):
        problems.append("missing brand")
    sizes = data.get("sizes", {})
    if not sizes.get("in_stock") and not sizes.get("out_of_stock"):
        problems.append("no sizes")
    if not data.get("images"):
        problems.append("no images")
    hard_fail = any(p in ("missing title", "no images") for p in problems)
    return (not hard_fail), problems


def slugify(title: str, spu_id: int) -> str:
    base = "".join(c.lower() if c.isalnum() else "-" for c in title).strip("-")
    while "--" in base:
        base = base.replace("--", "-")
    return f"{base}-{spu_id}"


def parse_release_date(value: str | None) -> date | None:
    if not value:
        return None
    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%Y"):
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    return None


def get_or_create_category(session: Session, name: str | None) -> Category | None:
    if not name:
        return None
    cat = session.execute(select(Category).where(Category.name == name)).scalar_one_or_none()
    if not cat:
        cat = Category(name=name, name_ko=name, slug=name.lower().replace(" ", "-"))
        session.add(cat)
        session.flush()
    return cat


def _to_numeric(val):
    try:
        return float(val) if val not in (None, "") else None
    except (TypeError, ValueError):
        return None


def _replace_variants(session: Session, product_id, per_size: list[dict]) -> None:
    session.query(ProductVariant).filter_by(product_id=product_id).delete()
    for row in per_size:
        session.add(
            ProductVariant(
                product_id=product_id,
                size=row.get("size"),
                sku_id=row.get("sku_id"),
                price_krw=_to_numeric(row.get("price_krw")),
                in_stock=bool(row.get("in_stock")),
            )
        )


def _replace_images(session: Session, product_id, spu_id: int, images: list[dict], cdn_map: dict) -> None:
    session.query(ProductImage).filter_by(product_id=product_id).delete()
    for idx, img in enumerate(images):
        key = f"{spu_id}_{idx:02d}"
        cdn = cdn_map.get(key)
        if not cdn:
            log.warning("no CDN entry for %s — run image_pipeline.py first, skipping image", key)
            continue
        session.add(
            ProductImage(
                product_id=product_id,
                cdn_url=cdn["url"],
                width=cdn.get("width"),
                height=cdn.get("height"),
                sort_order=idx,
                source=img.get("source"),
            )
        )


def _replace_colors(session: Session, product_id, variants: list[dict]) -> None:
    session.query(ColorVariant).filter_by(product_id=product_id).delete()
    for v in variants:
        session.add(
            ColorVariant(
                product_id=product_id,
                sibling_spu_id=v.get("spu_id"),
                name=v.get("name"),
                swatch_url=v.get("swatch_url"),
            )
        )


def _replace_specs(session: Session, product_id, blocks: list[dict]) -> None:
    session.query(ProductSpec).filter_by(product_id=product_id).delete()
    for block in blocks:
        for prop in block.get("properties", []):
            session.add(
                ProductSpec(
                    product_id=product_id,
                    block_title=block.get("title"),
                    key=prop.get("name"),
                    value=prop.get("value"),
                    key_ko=prop.get("name"),
                    value_ko=prop.get("value"),
                )
            )


def upsert_product(session: Session, data: dict, cdn_map: dict) -> None:
    spu_id = data["spu_id"]
    category = get_or_create_category(session, data.get("category"))

    price = data.get("price", {})
    values = dict(
        spu_id=spu_id,
        slug=slugify(data["title"], spu_id),
        title=data["title"],
        title_ko=data["title"],
        brand=data.get("brand"),
        category_id=category.id if category else None,
        description=data.get("description"),
        description_ko=data.get("description"),
        style_code=data.get("specs", {}).get("style_code"),
        material=data.get("specs", {}).get("material"),
        release_date=parse_release_date(data.get("specs", {}).get("release_date")),
        price_krw=_to_numeric(price.get("min_krw")),
        price_original_krw=_to_numeric(price.get("original_krw")),
        is_in_stock=bool(data.get("sizes", {}).get("in_stock")),
        raw_json=data,
        updated_at=datetime.utcnow(),
    )

    stmt = pg_insert(Product).values(**values, is_published=False)
    stmt = stmt.on_conflict_do_update(
        index_elements=["spu_id"],
        set_={k: v for k, v in values.items()},
    ).returning(Product.id)
    product_id = session.execute(stmt).scalar_one()

    _replace_variants(session, product_id, price.get("per_size", []))
    _replace_images(session, product_id, spu_id, data.get("images", []), cdn_map)
    _replace_colors(session, product_id, data.get("colors", {}).get("variants", []))
    _replace_specs(session, product_id, data.get("specs", {}).get("property_blocks", []))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--cdn-map", required=True)
    parser.add_argument("--batch-size", type=int, default=200)
    parser.add_argument("--limit", type=int, default=0, help="Max products to import (0 = all)")
    parser.add_argument("--sync-meili", action="store_true", help="Sync to Meilisearch after import")
    args = parser.parse_args()

    cdn_map = json.loads(Path(args.cdn_map).read_text())
    products_dir = Path(args.data_dir) / "products"
    files = sorted(products_dir.glob("*.json"))
    if args.limit:
        files = files[: args.limit]
    log.info("found %d product records", len(files))

    imported, skipped = 0, 0
    with Session(sync_engine) as session:
        for i, path in enumerate(files, 1):
            data = json.loads(path.read_text())
            ok, problems = validate_product(data)
            if not ok:
                log.warning("SKIP %s — %s", path.name, ", ".join(problems))
                skipped += 1
                continue

            upsert_product(session, data, cdn_map)
            imported += 1

            if i % args.batch_size == 0:
                session.commit()
                log.info("committed batch, %d imported so far", imported)

        session.commit()

    log.info("done. imported=%d skipped=%d", imported, skipped)

    if args.sync_meili:
        from scripts.sync_meilisearch import sync_all
        sync_all()


if __name__ == "__main__":
    main()
