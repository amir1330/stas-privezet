"""Resolve localized catalog strings from JSONB translations."""

from typing import Any

SUPPORTED_LOCALES = ("ru", "en", "kk")
DEFAULT_LOCALE = "ru"
FALLBACK_CHAIN = ("ru", "en", "kk")


def parse_locale(accept_language: str | None, lang_param: str | None = None) -> str:
    if lang_param and lang_param in SUPPORTED_LOCALES:
        return lang_param
    if not accept_language:
        return DEFAULT_LOCALE
    primary = accept_language.split(",")[0].strip().split("-")[0].lower()
    if primary in SUPPORTED_LOCALES:
        return primary
    return DEFAULT_LOCALE


def pick_translation(translations: dict[str, Any] | None, locale: str, field: str) -> str | None:
    if not translations:
        return None
    for loc in (locale, *FALLBACK_CHAIN):
        block = translations.get(loc)
        if isinstance(block, dict):
            val = block.get(field)
            if val:
                return str(val)
    return None


def localized_product_title(product, locale: str) -> str:
    t = pick_translation(product.translations, locale, "title")
    if t:
        return t
    return product.title_ko or product.title


def localized_product_description(product, locale: str) -> str | None:
    t = pick_translation(product.translations, locale, "description")
    if t:
        return t
    desc = product.description_ko or product.description
    return desc or None


def localized_category_name(category, locale: str) -> str:
    t = pick_translation(category.translations, locale, "name")
    if t:
        return t
    return category.name_ko or category.name


def localized_spec(spec, locale: str) -> tuple[str | None, str | None]:
    block = (spec.translations or {}).get(locale) or {}
    for loc in (locale, *FALLBACK_CHAIN):
        b = (spec.translations or {}).get(loc) or {}
        if b.get("key") and b.get("value"):
            return str(b["key"]), str(b["value"])
    return spec.key_ko or spec.key, spec.value_ko or spec.value
