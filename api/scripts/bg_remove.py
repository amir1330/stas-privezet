"""
bg_remove.py

Removes near-white/near-flat backgrounds from product photos, entirely locally.
No external API calls, no network access, no ML model download.
"""

from __future__ import annotations

import argparse
import logging
from pathlib import Path

import cv2
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("bg_remove")


def remove_background(
    image_path: Path,
    tolerance: int = 18,
    feather_px: int = 2,
) -> np.ndarray:
    bgr = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
    if bgr is None:
        raise ValueError(f"could not read image: {image_path}")

    h, w = bgr.shape[:2]
    flood_mask = np.zeros((h + 2, w + 2), np.uint8)

    # Corner + edge seeds — Poizon shots often have white/gray studio backgrounds
    seeds: list[tuple[int, int]] = [
        (0, 0),
        (w - 1, 0),
        (0, h - 1),
        (w - 1, h - 1),
    ]
    step = max(8, min(w, h) // 24)
    for x in range(0, w, step):
        seeds.append((x, 0))
        seeds.append((x, h - 1))
    for y in range(0, h, step):
        seeds.append((0, y))
        seeds.append((w - 1, y))

    work = bgr.copy()
    diff = (tolerance, tolerance, tolerance)
    for seed in seeds:
        if flood_mask[seed[1] + 1, seed[0] + 1] == 0:
            cv2.floodFill(
                work,
                flood_mask,
                seed,
                0,
                loDiff=diff,
                upDiff=diff,
                flags=cv2.FLOODFILL_FIXED_RANGE | (255 << 8),
            )

    bg_mask = flood_mask[1:-1, 1:-1]
    alpha = np.where(bg_mask > 0, 0, 255).astype(np.uint8)

    if feather_px > 0:
        alpha = cv2.GaussianBlur(alpha, (0, 0), sigmaX=feather_px)

    rgba = cv2.cvtColor(bgr, cv2.COLOR_BGR2BGRA)
    rgba[:, :, 3] = alpha
    return rgba


def looks_clean(rgba: np.ndarray, min_opaque_fraction: float = 0.04, max_opaque_fraction: float = 0.95) -> bool:
    opaque_fraction = float((rgba[:, :, 3] > 200).mean())
    return min_opaque_fraction < opaque_fraction < max_opaque_fraction


def process_one(src: Path, dst: Path, tolerance: int = 18) -> bool:
    rgba = remove_background(src, tolerance=tolerance)
    if not looks_clean(rgba):
        log.warning("SUSPECT cutout, flagging for manual review: %s", src)
        return False
    dst.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(dst), rgba)
    return True


def process_batch(in_dir: Path, out_dir: Path, tolerance: int = 18) -> None:
    images = sorted(in_dir.rglob("*.jpg")) + sorted(in_dir.rglob("*.png"))
    log.info("found %d source images", len(images))

    ok, flagged = 0, []
    for src in images:
        rel = src.relative_to(in_dir).with_suffix(".png")
        dst = out_dir / rel
        if dst.exists():
            continue
        try:
            if process_one(src, dst, tolerance=tolerance):
                ok += 1
            else:
                flagged.append(str(src))
        except Exception as e:
            log.error("FAILED %s: %s", src, e)
            flagged.append(str(src))

    log.info("done. processed=%d flagged_for_review=%d", ok, len(flagged))
    if flagged:
        review_file = out_dir / "_needs_review.txt"
        review_file.write_text("\n".join(flagged))
        log.info("review list written to %s", review_file)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--in", dest="in_dir", type=Path)
    parser.add_argument("--out", dest="out_dir", type=Path, required=True)
    parser.add_argument("--single", type=Path)
    parser.add_argument("--tolerance", type=int, default=18)
    args = parser.parse_args()

    if args.single:
        rgba = remove_background(args.single, tolerance=args.tolerance)
        args.out_dir.parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(args.out_dir), rgba)
        log.info("wrote %s (clean=%s)", args.out_dir, looks_clean(rgba))
    else:
        if not args.in_dir:
            parser.error("--in is required for batch mode")
        process_batch(args.in_dir, args.out_dir, tolerance=args.tolerance)


if __name__ == "__main__":
    main()
