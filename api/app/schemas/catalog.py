import uuid
from datetime import date

from pydantic import BaseModel


class ProductListItem(BaseModel):
    id: uuid.UUID
    slug: str
    title: str
    brand: str | None
    price_krw: float | None
    price_original_krw: float | None = None
    is_in_stock: bool | None
    thumbnail_url: str | None
    category_name: str | None = None
    category_slug: str | None = None

    model_config = {"from_attributes": True}


class ProductVariantOut(BaseModel):
    id: uuid.UUID
    size: str | None
    price_krw: float | None
    in_stock: bool

    model_config = {"from_attributes": True}


class ProductImageOut(BaseModel):
    cdn_url: str
    width: int | None
    height: int | None
    source: str | None
    sort_order: int

    model_config = {"from_attributes": True}


class ProductSpecOut(BaseModel):
    block_title: str | None
    key: str | None
    value: str | None

    model_config = {"from_attributes": True}


class ColorVariantOut(BaseModel):
    sibling_spu_id: int | None
    name: str | None
    swatch_url: str | None

    model_config = {"from_attributes": True}


class ProductDetail(BaseModel):
    id: uuid.UUID
    slug: str
    spu_id: int
    title: str
    brand: str | None
    description: str | None
    style_code: str | None
    material: str | None
    release_date: date | None
    price_krw: float | None
    price_original_krw: float | None
    is_in_stock: bool | None
    category_name: str | None = None
    category_slug: str | None = None
    variants: list[ProductVariantOut]
    images: list[ProductImageOut]
    colors: list[ColorVariantOut]
    specs: list[ProductSpecOut]


class CategoryOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    parent_id: uuid.UUID | None

    model_config = {"from_attributes": True}


class PaginatedProducts(BaseModel):
    items: list[ProductListItem]
    next_cursor: str | None
    total: int | None = None


class SearchResult(BaseModel):
    items: list[ProductListItem]
    total: int
    offset: int
    limit: int
    query: str
