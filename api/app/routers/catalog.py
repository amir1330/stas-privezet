import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_session
from app.models import Category, Product, ProductImage
from app.schemas.catalog import (
    CategoryOut,
    PaginatedProducts,
    ProductDetail,
    ProductListItem,
    SearchResult,
)
from app.services.cache import (
    CATEGORIES_TTL,
    HOMEPAGE_TTL,
    cache_get,
    cache_set,
    products_cache_key,
)
from app.schemas.site_config import PricingConfig
from app.deps_locale import get_locale
from app.services.meilisearch_client import search_products
from app.services.i18n import (
    localized_category_name,
    localized_product_description,
    localized_product_title,
    localized_spec,
)
from app.services.pricing import compute_display_price
from app.services.site_config import get_site_config

router = APIRouter(prefix="/catalog", tags=["catalog"])

PAGE_SIZE = 48


@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(
    session: Annotated[AsyncSession, Depends(get_session)],
    locale: Annotated[str, Depends(get_locale)],
):
    cache_key = f"catalog:categories:{locale}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    rows = await session.scalars(select(Category).order_by(Category.name))
    result = [
        CategoryOut(
            id=c.id,
            name=localized_category_name(c, locale),
            slug=c.slug,
            parent_id=c.parent_id,
        ).model_dump()
        for c in rows.all()
    ]
    await cache_set(cache_key, result, CATEGORIES_TTL)
    return result


@router.get("/search", response_model=SearchResult)
async def search_catalog(
    session: Annotated[AsyncSession, Depends(get_session)],
    locale: Annotated[str, Depends(get_locale)],
    q: str = "",
    brand: str | None = None,
    category: str | None = None,
    in_stock: bool | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(PAGE_SIZE, ge=1, le=100),
):
    return await _search(session, q, brand, category, in_stock, min_price, max_price, offset, limit, locale)


async def _search(
    session: AsyncSession,
    q: str,
    brand: str | None,
    category: str | None,
    in_stock: bool | None,
    min_price: float | None,
    max_price: float | None,
    offset: int,
    limit: int,
    locale: str,
) -> SearchResult:
    cache_key = products_cache_key(
        search=True, q=q, brand=brand, category=category,
        in_stock=in_stock, min_price=min_price, max_price=max_price,
        offset=offset, limit=limit, lang=locale,
    )
    cached = await cache_get(cache_key)
    if cached:
        return cached

    try:
        result = await search_products(
            q,
            brand=brand,
            category=category,
            in_stock=in_stock,
            min_price=min_price,
            max_price=max_price,
            offset=offset,
            limit=limit,
        )
    except Exception:
        raise HTTPException(status_code=503, detail="Search unavailable")

    hits = result.get("hits", [])
    pricing = (await get_site_config(session)).pricing
    ids = [uuid.UUID(h["id"]) for h in hits if h.get("id")]
    product_map: dict[uuid.UUID, Product] = {}
    if ids:
        rows = await session.scalars(
            select(Product)
            .where(Product.id.in_(ids))
            .options(selectinload(Product.images), selectinload(Product.category))
        )
        product_map = {p.id: p for p in rows.unique().all()}

    items = []
    for h in hits:
        pid = uuid.UUID(h["id"])
        product = product_map.get(pid)
        if product:
            items.append(_to_list_item(product, pricing, locale))
        else:
            items.append(
                ProductListItem(
                    id=pid,
                    slug=h["slug"],
                    title=h["title"],
                    brand=h.get("brand") or None,
                    price_krw=h.get("price_krw") or None,
                    is_in_stock=h.get("is_in_stock"),
                    thumbnail_url=h.get("thumbnail_url") or None,
                    category_name=h.get("category_name") or None,
                )
            )
    out = SearchResult(
        items=items,
        total=result.get("estimatedTotalHits", len(items)),
        offset=offset,
        limit=limit,
        query=q,
    )
    await cache_set(cache_key, out.model_dump(), ttl=60)
    return out


@router.get("/products", response_model=PaginatedProducts)
async def list_products(
    session: Annotated[AsyncSession, Depends(get_session)],
    locale: Annotated[str, Depends(get_locale)],
    cursor: str | None = None,
    category: str | None = None,
    brand: str | None = None,
    in_stock: bool | None = None,
    q: str | None = None,
    limit: int = Query(PAGE_SIZE, ge=1, le=200),
):
    if q:
        result = await _search(session, q, brand, category, in_stock, None, None, 0, limit, locale)
        return PaginatedProducts(
            items=result.items,
            next_cursor=str(limit) if limit < result.total else None,
            total=result.total,
        )

    pricing = (await get_site_config(session)).pricing

    cache_key = products_cache_key(cursor=cursor, category=category, brand=brand, in_stock=in_stock, limit=limit, lang=locale)
    cached = await cache_get(cache_key)
    if cached:
        return cached

    stmt = (
        select(Product)
        .where(Product.is_published.is_(True))
        .options(selectinload(Product.images), selectinload(Product.category))
        .order_by(Product.created_at.desc(), Product.id.desc())
    )

    if category:
        stmt = stmt.join(Category).where(Category.slug == category)
    if brand:
        stmt = stmt.where(Product.brand == brand)
    if in_stock is not None:
        stmt = stmt.where(Product.is_in_stock.is_(in_stock))

    if cursor:
        try:
            cursor_id = uuid.UUID(cursor)
            cursor_product = await session.get(Product, cursor_id)
            if cursor_product:
                stmt = stmt.where(
                    or_(
                        Product.created_at < cursor_product.created_at,
                        (Product.created_at == cursor_product.created_at) & (Product.id < cursor_id),
                    )
                )
        except ValueError:
            pass

    stmt = stmt.limit(limit + 1)
    products = (await session.scalars(stmt)).unique().all()

    next_cursor = None
    if len(products) > limit:
        products = products[:limit]
        next_cursor = str(products[-1].id)

    items = [_to_list_item(p, pricing, locale) for p in products]
    out = PaginatedProducts(items=items, next_cursor=next_cursor).model_dump()
    await cache_set(cache_key, out)
    return out


@router.get("/products/{slug}", response_model=ProductDetail)
async def get_product(
    slug: str,
    session: Annotated[AsyncSession, Depends(get_session)],
    locale: Annotated[str, Depends(get_locale)],
):
    cache_key = f"catalog:product:{slug}:{locale}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    stmt = (
        select(Product)
        .where(Product.slug == slug, Product.is_published.is_(True))
        .options(
            selectinload(Product.variants),
            selectinload(Product.images),
            selectinload(Product.color_variants),
            selectinload(Product.specs),
            selectinload(Product.category),
        )
    )
    product = await session.scalar(stmt)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    pricing = (await get_site_config(session)).pricing
    display = compute_display_price(product, pricing)

    detail = ProductDetail(
        id=product.id,
        slug=product.slug,
        spu_id=product.spu_id,
        title=localized_product_title(product, locale),
        brand=product.brand,
        description=localized_product_description(product, locale),
        style_code=product.style_code,
        material=product.material,
        release_date=product.release_date,
        price_krw=display.price_krw,
        price_original_krw=display.price_original_krw,
        is_in_stock=product.is_in_stock,
        category_name=localized_category_name(product.category, locale) if product.category else None,
        category_slug=product.category.slug if product.category else None,
        variants=product.variants,
        images=sorted(product.images, key=lambda i: i.sort_order),
        colors=product.color_variants,
        specs=[
            {"block_title": s.block_title, "key": k, "value": v}
            for s in product.specs
            for k, v in [localized_spec(s, locale)]
            if k and v
        ],
    ).model_dump()
    await cache_set(cache_key, detail, HOMEPAGE_TTL)
    return detail


@router.get("/brands", response_model=list[str])
async def list_brands(session: Annotated[AsyncSession, Depends(get_session)]):
    cached = await cache_get("catalog:brands")
    if cached:
        return cached

    rows = await session.scalars(
        select(Product.brand)
        .where(Product.is_published.is_(True), Product.brand.isnot(None))
        .distinct()
        .order_by(Product.brand)
    )
    result = [b for b in rows.all() if b]
    await cache_set("catalog:brands", result, CATEGORIES_TTL)
    return result


def _first_image(images: list[ProductImage]) -> ProductImage | None:
    if not images:
        return None
    return sorted(images, key=lambda i: i.sort_order)[0]


def _to_list_item(product: Product, pricing: PricingConfig, locale: str) -> ProductListItem:
    img = _first_image(product.images)
    display = compute_display_price(product, pricing)
    return ProductListItem(
        id=product.id,
        slug=product.slug,
        title=localized_product_title(product, locale),
        brand=product.brand,
        price_krw=display.price_krw,
        price_original_krw=display.price_original_krw,
        is_in_stock=product.is_in_stock,
        thumbnail_url=img.cdn_url if img else None,
        category_name=localized_category_name(product.category, locale) if product.category else None,
        category_slug=product.category.slug if product.category else None,
    )


@router.get("/category-thumbnails")
async def category_thumbnails(session: Annotated[AsyncSession, Depends(get_session)]):
    """First published product thumbnail per category slug."""
    cached = await cache_get("catalog:category-thumbnails")
    if cached:
        return cached

    stmt = (
        select(Product)
        .where(Product.is_published.is_(True))
        .options(selectinload(Product.images), selectinload(Product.category))
        .order_by(Product.created_at.desc())
    )
    products = (await session.scalars(stmt)).unique().all()

    by_slug: dict[str, str] = {}
    for p in products:
        if not p.category or not p.images:
            continue
        slug = p.category.slug
        if slug in by_slug:
            continue
        img = _first_image(p.images)
        if img:
            by_slug[slug] = img.cdn_url

    await cache_set("catalog:category-thumbnails", by_slug, CATEGORIES_TTL)
    return by_slug
