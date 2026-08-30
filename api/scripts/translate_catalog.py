"""
Translate catalog content from Korean source to ru, en, kk.

    python -m scripts.translate_catalog
    python -m scripts.translate_catalog --limit 20
"""

from __future__ import annotations

import argparse
import logging
import sys
import time
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db import sync_engine
from app.models import Category, Product, ProductSpec

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("translate_catalog")

TARGET_LOCALES = ("ru", "en", "kk")
SOURCE = "ko"


def _translator():
    from deep_translator import GoogleTranslator

    cache: dict[tuple[str, str, str], str] = {}

    def translate(text: str | None, target: str) -> str | None:
        if not text or not text.strip():
            return text
        key = (text.strip(), SOURCE, target)
        if key in cache:
            return cache[key]
        try:
            out = GoogleTranslator(source=SOURCE, target=target).translate(text.strip())
            cache[key] = out
            time.sleep(0.15)
            return out
        except Exception as e:
            log.warning("translate failed (%s→%s): %s", SOURCE, target, e)
            return text

    return translate


def translate_products(session: Session, translate, limit: int | None) -> int:
    stmt = select(Product).order_by(Product.spu_id)
    if limit:
        stmt = stmt.limit(limit)
    products = session.scalars(stmt).all()
    done = 0

    for p in products:
        if not p.title_ko and p.title:
            p.title_ko = p.title
        if not p.description_ko and p.description:
            p.description_ko = p.description

        translations = dict(p.translations or {})
        changed = False
        for loc in TARGET_LOCALES:
            block = dict(translations.get(loc) or {})
            new_title = translate(p.title_ko, loc)
            new_desc = translate(p.description_ko, loc) if p.description_ko else None
            if new_title and block.get("title") != new_title:
                block["title"] = new_title
                changed = True
            if new_desc and block.get("description") != new_desc:
                block["description"] = new_desc
                changed = True
            if block:
                translations[loc] = block

        if changed:
            p.translations = translations
            # Display fields use default locale (ru)
            p.title = translations.get("ru", {}).get("title") or p.title_ko
            p.description = translations.get("ru", {}).get("description") or p.description_ko
            done += 1

        if done and done % 10 == 0:
            session.commit()
            log.info("products translated: %d", done)

    session.commit()
    return done


def translate_categories(session: Session, translate) -> int:
    cats = session.scalars(select(Category)).all()
    done = 0
    for c in cats:
        if not c.name_ko:
            c.name_ko = c.name
        translations = dict(c.translations or {})
        changed = False
        for loc in TARGET_LOCALES:
            name = translate(c.name_ko, loc)
            if name and translations.get(loc, {}).get("name") != name:
                translations[loc] = {"name": name}
                changed = True
        if changed:
            c.translations = translations
            c.name = translations.get("ru", {}).get("name") or c.name_ko
            done += 1
    session.commit()
    return done


def translate_specs(session: Session, translate, limit: int | None) -> int:
    stmt = select(ProductSpec).join(Product).order_by(Product.spu_id)
    if limit:
        stmt = stmt.limit(limit * 20)
    specs = session.scalars(stmt).all()
    done = 0
    for s in specs:
        if not s.key_ko:
            s.key_ko = s.key
        if not s.value_ko:
            s.value_ko = s.value
        translations = dict(s.translations or {})
        changed = False
        for loc in TARGET_LOCALES:
            block = dict(translations.get(loc) or {})
            k = translate(s.key_ko, loc)
            v = translate(s.value_ko, loc)
            if k and block.get("key") != k:
                block["key"] = k
                changed = True
            if v and block.get("value") != v:
                block["value"] = v
                changed = True
            if block:
                translations[loc] = block
        if changed:
            s.translations = translations
            s.key = translations.get("ru", {}).get("key") or s.key_ko
            s.value = translations.get("ru", {}).get("value") or s.value_ko
            done += 1
        if done and done % 50 == 0:
            session.commit()
            log.info("specs translated: %d", done)
    session.commit()
    return done


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0, help="Max products (0 = all)")
    args = parser.parse_args()
    limit = args.limit or None

    translate = _translator()
    with Session(sync_engine) as session:
        c = translate_categories(session, translate)
        log.info("categories translated: %d", c)
        p = translate_products(session, translate, limit)
        log.info("products translated: %d", p)
        s = translate_specs(session, translate, limit)
        log.info("spec rows translated: %d", s)

    try:
        from scripts.sync_meilisearch import sync_all

        sync_all()
        log.info("meilisearch synced")
    except Exception as e:
        log.warning("meilisearch sync skipped: %s", e)


if __name__ == "__main__":
    main()
