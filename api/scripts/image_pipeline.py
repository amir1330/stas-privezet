"""
image_pipeline.py

Batch image processing: resize to web variants (WebP/AVIF), upload to S3/R2,
produce cdn_url_map.json for import_products.py.

Dev mode (no S3 creds): writes to local output dir and uses file:// URLs.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
from io import BytesIO
from pathlib import Path

from PIL import Image

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("image_pipeline")

SIZES = {
    "thumb": 400,
    "card": 800,
    "full": 1200,
}


def make_web_variants(src: Path | str, formats: tuple[str, ...] = ("webp",)) -> dict:
    """Generate resized variants; returns metadata for the largest size."""
    src = Path(src)
    img = Image.open(src).convert("RGBA")
    w, h = img.size

    out: dict = {"source": str(src), "variants": []}
    longest = max(w, h)
    target = SIZES["full"]
    if longest > target:
        scale = target / longest
        img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
        w, h = img.size

    for fmt in formats:
        buf = BytesIO()
        if fmt == "webp":
            img.save(buf, format="WEBP", quality=85)
        elif fmt == "avif":
            img.save(buf, format="AVIF", quality=80)
        else:
            img.save(buf, format="PNG")
        out["variants"].append({"format": fmt, "data": buf.getvalue(), "width": w, "height": h})

    out["width"] = w
    out["height"] = h
    return out


def upload_to_cdn(variant_bundle: dict, key_prefix: str = "") -> dict:
    """Upload to S3/R2 or write locally in dev mode."""
    endpoint = os.environ.get("S3_ENDPOINT", "")
    bucket = os.environ.get("S3_BUCKET", "")
    cdn_base = os.environ.get("CDN_BASE_URL", "http://localhost:8000/static")
    local_out = os.environ.get("IMAGE_PIPELINE_LOCAL_OUT", "")

    best = variant_bundle["variants"][0]
    ext = best["format"]
    filename = f"{key_prefix or Path(variant_bundle['source']).stem}.{ext}"

    if not endpoint or not os.environ.get("S3_ACCESS_KEY"):
        out_dir = Path(local_out or "/tmp/marketplace-images")
        out_dir.mkdir(parents=True, exist_ok=True)
        dest = out_dir / filename
        dest.write_bytes(best["data"])
        url = f"{cdn_base.rstrip('/')}/{filename}"
        log.debug("local write %s -> %s", dest, url)
        return {"url": url, "width": variant_bundle["width"], "height": variant_bundle["height"]}

    import boto3

    client = boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=os.environ["S3_ACCESS_KEY"],
        aws_secret_access_key=os.environ["S3_SECRET_KEY"],
    )
    client.put_object(
        Bucket=bucket,
        Key=filename,
        Body=best["data"],
        ContentType=f"image/{ext}",
        CacheControl="public, max-age=31536000, immutable",
    )
    url = f"{cdn_base.rstrip('/')}/{filename}"
    return {"url": url, "width": variant_bundle["width"], "height": variant_bundle["height"]}


def process_directory(
    images_dir: Path,
    transparent_dir: Path | None,
    out_map_path: Path,
) -> None:
    """Process all product images and write cdn_url_map.json."""
    cdn_map: dict = {}

    sources = sorted(images_dir.rglob("*.jpg")) + sorted(images_dir.rglob("*.png"))
    if transparent_dir and transparent_dir.exists():
        sources = sorted(transparent_dir.rglob("*.png"))

    for src in sources:
        spu_dir = src.parent.name
        stem = src.stem
        # Match keys like 64712040_01 from filename 64712040_01.jpg
        if "_" in stem:
            parts = stem.rsplit("_", 1)
            if len(parts) == 2 and parts[1].isdigit():
                key = f"{parts[0]}_{parts[1]}"
            else:
                key = f"{spu_dir}_{stem.split('_')[-1]}"
        else:
            key = f"{spu_dir}_00"

        try:
            bundle = make_web_variants(src)
            cdn_map[key] = upload_to_cdn(bundle, key_prefix=key)
        except Exception as e:
            log.error("failed %s: %s", src, e)

    out_map_path.write_text(json.dumps(cdn_map, indent=2))
    log.info("wrote %d entries to %s", len(cdn_map), out_map_path)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--images-dir", type=Path, required=True)
    parser.add_argument("--transparent-dir", type=Path, default=None)
    parser.add_argument("--out-map", type=Path, default=Path("cdn_url_map.json"))
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    process_directory(args.images_dir, args.transparent_dir, args.out_map)


if __name__ == "__main__":
    main()
