"""
seed_sample.py — import N products from stas-poison into Postgres and publish.

Uses local images when available; falls back to Poizon CDN URLs from JSON.

    python -m scripts.seed_sample --limit 150
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from io import BytesIO
from pathlib import Path

import cv2
from PIL import Image
from sqlalchemy import text
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db import sync_engine
from scripts.bg_remove import looks_clean, remove_background
from scripts.import_products import upsert_product, validate_product

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("seed_sample")

DATA_ROOT = Path("/home/amir1330/projects/stas-poison/data")
LOCAL_IMG_OUT = Path("/tmp/marketplace-images")
BG_TOLERANCE = 28


def _pick_source_image(folder: Path) -> Path | None:
    if not folder.is_dir():
        return None
    for pattern in ("*_00.jpg", "*_00.png", "*_01.jpg", "*_01.png", "*.jpg", "*.png", "*.webp"):
        files = sorted(folder.glob(pattern))
        if files:
            return files[0]
    return None


def _process_local_thumb(spu_id: int, images_dir: Path, *, cutout: bool = True) -> dict | None:
    folder = images_dir / str(spu_id)
    src = _pick_source_image(folder)
    if not src:
        return None

    if cutout:
        try:
            rgba = remove_background(src, tolerance=BG_TOLERANCE)
            if not looks_clean(rgba):
                log.warning("bg cutout suspect for spu %s — using original", spu_id)
                img = Image.open(src).convert("RGBA")
            else:
                img = Image.fromarray(cv2.cvtColor(rgba, cv2.COLOR_BGRA2RGBA))
        except Exception as e:
            log.warning("bg remove failed for spu %s: %s — using original", spu_id, e)
            img = Image.open(src).convert("RGBA")
    else:
        img = Image.open(src).convert("RGBA")

    w, h = img.size
    longest = max(w, h)
    if longest > 800:
        scale = 800 / longest
        img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
        w, h = img.size

    LOCAL_IMG_OUT.mkdir(parents=True, exist_ok=True)
    key = f"{spu_id}_00"
    dest = LOCAL_IMG_OUT / f"{key}.webp"
    buf = BytesIO()
    img.save(buf, format="WEBP", quality=90, method=6)
    dest.write_bytes(buf.getvalue())
    return {"url": f"http://localhost:8000/static/{key}.webp", "width": w, "height": h}


def _cdn_from_json(data: dict, spu_id: int, idx: int = 0) -> dict | None:
    images = data.get("images") or []
    if idx >= len(images):
        return None
    url = images[idx].get("url")
    if not url:
        return None
    return {"url": url, "width": 800, "height": 800}


def build_cdn_map(data: dict, spu_id: int, images_dir: Path) -> dict:
    cdn_map: dict = {}
    local = _process_local_thumb(spu_id, images_dir)
    if local:
        cdn_map[f"{spu_id}_00"] = local

    for idx, _ in enumerate(data.get("images", [])):
        key = f"{spu_id}_{idx:02d}"
        if key in cdn_map:
            continue
        entry = _cdn_from_json(data, spu_id, idx)
        if entry:
            cdn_map[key] = entry
    return cdn_map


def reset_catalog(session: Session) -> None:
    """Remove all products and related catalog rows."""
    session.execute(
        text(
            """
            TRUNCATE TABLE
                product_specs,
                product_images,
                product_variants,
                products
            RESTART IDENTITY CASCADE
            """
        )
    )
    session.commit()
    log.info("catalog truncated")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", type=Path, default=DATA_ROOT)
    parser.add_argument("--limit", type=int, default=150)
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Truncate existing products before import",
    )
    parser.add_argument(
        "--reprocess-images",
        action="store_true",
        help="Re-run bg removal on already-imported products (no re-import)",
    )
    args = parser.parse_args()

    products_dir = args.data_dir / "products"
    images_dir = args.data_dir / "images"

    if args.reset:
        with Session(sync_engine) as session:
            reset_catalog(session)

    if args.reprocess_images:
        with Session(sync_engine) as session:
            rows = session.execute(text("SELECT spu_id FROM products ORDER BY spu_id")).fetchall()
        ok = 0
        for (spu_id,) in rows:
            if _process_local_thumb(spu_id, images_dir):
                ok += 1
        log.info("reprocessed %d / %d product images with bg cutout", ok, len(rows))
        return

    files = sorted(products_dir.glob("*.json"))

    imported = 0
    spu_ids: list[int] = []

    with Session(sync_engine) as session:
        for path in files:
            if imported >= args.limit:
                break
            data = json.loads(path.read_text())
            ok, problems = validate_product(data)
            if not ok:
                continue

            spu_id = data["spu_id"]
            cdn_map = build_cdn_map(data, spu_id, images_dir)
            if not cdn_map:
                continue

            upsert_product(session, data, cdn_map)
            spu_ids.append(spu_id)
            imported += 1

            if imported % 50 == 0:
                session.commit()
                log.info("committed %d", imported)

        session.commit()

        # Publish all seeded products
        if spu_ids:
            session.execute(
                text("UPDATE products SET is_published = true WHERE spu_id = ANY(:ids)"),
                {"ids": spu_ids},
            )
            session.commit()

    log.info("done — imported & published %d products", imported)

    try:
        from scripts.sync_meilisearch import sync_all
        sync_all()
        log.info("meilisearch synced")
    except Exception as e:
        log.warning("meilisearch sync skipped: %s", e)


if __name__ == "__main__":
    main()
