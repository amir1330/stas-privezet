"""
admin_products.py

Manual "add product by hand" flow. When an admin uploads raw photos, this
automatically runs the SAME pipeline the scraper's imports go through —
background removal, resizing, hero-banner generation, CDN upload — so
there's no separate manual step and no way for a hand-added product to
skip processing that a scraped one gets.
"""

import uuid
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import SyncSessionLocal, get_session
from app.deps import require_role
from app.models import Product, ProductImage, User
from app.services.audit import write_audit
from app.services.cache import invalidate_catalog

router = APIRouter(
    prefix="/admin/products",
    tags=["admin"],
    dependencies=[Depends(require_role("admin"))],
)

UPLOAD_TMP = Path("/tmp/admin-uploads")


@router.post("/{product_id}/images")
async def upload_product_images(
    product_id: uuid.UUID,
    files: list[UploadFile],
    background_tasks: BackgroundTasks,
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(require_role("admin"))],
):
    product = await session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    saved_paths: list[Path] = []
    for f in files:
        dest = UPLOAD_TMP / str(product_id) / (f.filename or "upload.jpg")
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(await f.read())
        saved_paths.append(dest)

    product.is_published = False
    await write_audit(
        session,
        actor_id=user.id,
        action="upload_images",
        entity="product",
        entity_id=product_id,
        diff={"image_count": len(saved_paths)},
    )
    await session.commit()

    background_tasks.add_task(process_and_publish, product_id, saved_paths)
    return {"status": "processing", "image_count": len(saved_paths)}


@router.patch("/{product_id}/publish")
async def toggle_publish(
    product_id: uuid.UUID,
    published: bool,
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(require_role("admin"))],
):
    product = await session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    product.is_published = published
    await write_audit(
        session,
        actor_id=user.id,
        action="publish" if published else "unpublish",
        entity="product",
        entity_id=product_id,
    )
    await session.commit()
    await invalidate_catalog()
    return {"id": product_id, "is_published": published}


def process_and_publish(product_id: uuid.UUID, raw_paths: list[Path]) -> None:
    """Runs in background worker — same pipeline as scraped imports."""
    from scripts.bg_remove import process_one
    from scripts.hero_banner import generate_hero_banner
    from scripts.image_pipeline import make_web_variants, upload_to_cdn

    cutouts: list[Path] = []
    flagged: list[Path] = []

    for raw in raw_paths:
        cutout_path = raw.with_suffix(".png")
        try:
            ok = process_one(raw, cutout_path)
            if ok:
                cutouts.append(cutout_path)
            else:
                flagged.append(raw)
        except Exception:
            flagged.append(raw)

    if not cutouts:
        _notify_admin_review_needed(product_id, flagged)
        return

    cdn_urls = []
    for cutout in cutouts:
        variants = make_web_variants(cutout)
        cdn_urls.append(upload_to_cdn(variants))

    generate_hero_banner(product_id, cutouts[0], cdn_urls[0])
    _save_images_and_publish(product_id, cdn_urls, flagged)


def _save_images_and_publish(product_id: uuid.UUID, cdn_urls: list[dict], flagged: list[Path]) -> None:
    with SyncSessionLocal() as session:
        product = session.get(Product, product_id)
        if not product:
            return

        session.query(ProductImage).filter_by(product_id=product_id).delete()
        for idx, cdn in enumerate(cdn_urls):
            session.add(
                ProductImage(
                    product_id=product_id,
                    cdn_url=cdn["url"],
                    width=cdn.get("width"),
                    height=cdn.get("height"),
                    sort_order=idx,
                    source="admin_upload",
                )
            )

        product.is_published = len(flagged) == 0
        session.commit()

    from app.services.cache import invalidate_catalog_sync
    invalidate_catalog_sync()


def _notify_admin_review_needed(product_id: uuid.UUID, flagged_files: list[Path]) -> None:
    review_file = UPLOAD_TMP / str(product_id) / "_needs_review.txt"
    review_file.write_text("\n".join(str(p) for p in flagged_files))
