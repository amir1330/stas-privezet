"""Meilisearch product index wrapper."""

from functools import lru_cache
from typing import Any

import meilisearch

from app.config import get_settings

INDEX_NAME = "products"


@lru_cache
def get_meili_client() -> meilisearch.Client:
    settings = get_settings()
    return meilisearch.Client(settings.meili_url, settings.meili_master_key)


def get_index():
    client = get_meili_client()
    try:
        return client.get_index(INDEX_NAME)
    except meilisearch.errors.MeilisearchApiError:
        client.create_index(INDEX_NAME, {"primaryKey": "id"})
        index = client.index(INDEX_NAME)
        index.update_filterable_attributes(
            ["brand", "category_slug", "is_in_stock", "price_krw"]
        )
        index.update_sortable_attributes(["price_krw", "created_at"])
        index.update_searchable_attributes(["title", "brand", "category_name", "sizes"])
        return index


def product_document(
    *,
    id: str,
    slug: str,
    title: str,
    brand: str | None,
    category_name: str | None,
    category_slug: str | None,
    price_krw: float | None,
    is_in_stock: bool | None,
    sizes: list[str],
    thumbnail_url: str | None,
    created_at: str,
) -> dict[str, Any]:
    return {
        "id": id,
        "slug": slug,
        "title": title,
        "brand": brand or "",
        "category_name": category_name or "",
        "category_slug": category_slug or "",
        "price_krw": price_krw or 0,
        "is_in_stock": is_in_stock or False,
        "sizes": " ".join(sizes),
        "thumbnail_url": thumbnail_url or "",
        "created_at": created_at,
    }


async def search_products(
    q: str = "",
    *,
    brand: str | None = None,
    category: str | None = None,
    in_stock: bool | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    offset: int = 0,
    limit: int = 48,
) -> dict[str, Any]:
    filters: list[str] = []
    if brand:
        filters.append(f'brand = "{brand}"')
    if category:
        filters.append(f'category_slug = "{category}"')
    if in_stock is not None:
        filters.append(f"is_in_stock = {'true' if in_stock else 'false'}")
    if min_price is not None:
        filters.append(f"price_krw >= {min_price}")
    if max_price is not None:
        filters.append(f"price_krw <= {max_price}")

    index = get_index()
    result = index.search(
        q,
        {
            "filter": " AND ".join(filters) if filters else None,
            "offset": offset,
            "limit": limit,
            "sort": ["created_at:desc"],
        },
    )
    return result
