"""
hero_banner.py

Pre-render "text behind product" hero banners for category pages and featured products.
Outputs a static PNG/WebP — zero runtime compositing cost on the frontend.
"""

from __future__ import annotations

import logging
import uuid
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("hero_banner")

BANNER_W, BANNER_H = 1600, 600
ACCENT = (46, 75, 255)  # electric cobalt #2E4BFF
BG = (242, 243, 247)    # cool gray


def generate_hero_banner(
    product_id: uuid.UUID,
    cutout_path: Path,
    cdn_meta: dict,
    *,
    title: str = "",
    brand: str = "",
    out_dir: Path | None = None,
) -> Path | None:
    out_dir = out_dir or Path("/tmp/marketplace-banners")
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{product_id}.webp"

    canvas = Image.new("RGBA", (BANNER_W, BANNER_H), BG + (255,))
    draw = ImageDraw.Draw(canvas)

    display_text = (brand or title or "NEW DROP").upper()
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 180)
    except OSError:
        font = ImageFont.load_default()

    draw.text((80, 120), display_text, fill=ACCENT + (40,), font=font)

    cutout = Image.open(cutout_path).convert("RGBA")
    cutout.thumbnail((700, 500), Image.Resampling.LANCZOS)
    cx = BANNER_W - cutout.width - 120
    cy = (BANNER_H - cutout.height) // 2
    canvas.paste(cutout, (cx, cy), cutout)

    canvas.convert("RGB").save(out_path, format="WEBP", quality=90)
    log.info("hero banner %s", out_path)
    return out_path
