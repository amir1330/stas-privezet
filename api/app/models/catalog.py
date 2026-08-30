import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, new_uuid

if TYPE_CHECKING:
    from app.models.inquiries import Inquiry


class Category(Base, TimestampMixin):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    slug: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    name_ko: Mapped[str | None] = mapped_column(Text)
    translations: Mapped[dict | None] = mapped_column(JSONB, server_default="{}")
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True
    )

    parent: Mapped["Category | None"] = relationship(remote_side=[id])
    products: Mapped[list["Product"]] = relationship(back_populates="category")


class Product(Base, TimestampMixin):
    __tablename__ = "products"
    __table_args__ = (
        Index("ix_products_category_stock_price", "category_id", "is_in_stock", "price_krw"),
        Index("ix_products_raw_json", "raw_json", postgresql_using="gin"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    spu_id: Mapped[int] = mapped_column(BigInteger, unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    brand: Mapped[str | None] = mapped_column(Text)
    category_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id"))
    description: Mapped[str | None] = mapped_column(Text)
    style_code: Mapped[str | None] = mapped_column(Text)
    material: Mapped[str | None] = mapped_column(Text)
    release_date: Mapped[date | None] = mapped_column(Date)
    price_krw: Mapped[float | None] = mapped_column(Numeric)
    price_original_krw: Mapped[float | None] = mapped_column(Numeric)
    markup_percent: Mapped[float | None] = mapped_column(Numeric)
    discount_percent: Mapped[float | None] = mapped_column(Numeric)
    price_manual_krw: Mapped[float | None] = mapped_column(Numeric)
    title_ko: Mapped[str | None] = mapped_column(Text)
    description_ko: Mapped[str | None] = mapped_column(Text)
    translations: Mapped[dict | None] = mapped_column(JSONB, server_default="{}")
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    is_in_stock: Mapped[bool | None] = mapped_column(Boolean)
    raw_json: Mapped[dict | None] = mapped_column(JSONB)

    category: Mapped[Category | None] = relationship(back_populates="products")
    variants: Mapped[list["ProductVariant"]] = relationship(back_populates="product", cascade="all, delete-orphan")
    images: Mapped[list["ProductImage"]] = relationship(back_populates="product", cascade="all, delete-orphan")
    color_variants: Mapped[list["ColorVariant"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )
    specs: Mapped[list["ProductSpec"]] = relationship(back_populates="product", cascade="all, delete-orphan")
    inquiries: Mapped[list["Inquiry"]] = relationship(back_populates="product")


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    size: Mapped[str | None] = mapped_column(Text)
    sku_id: Mapped[int | None] = mapped_column(BigInteger)
    price_krw: Mapped[float | None] = mapped_column(Numeric)
    in_stock: Mapped[bool] = mapped_column(Boolean, default=False)

    product: Mapped[Product] = relationship(back_populates="variants")


class ProductImage(Base):
    __tablename__ = "product_images"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    cdn_url: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    source: Mapped[str | None] = mapped_column(Text)
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)

    product: Mapped[Product] = relationship(back_populates="images")


class ColorVariant(Base):
    __tablename__ = "color_variants"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    sibling_spu_id: Mapped[int | None] = mapped_column(BigInteger)
    name: Mapped[str | None] = mapped_column(Text)
    swatch_url: Mapped[str | None] = mapped_column(Text)

    product: Mapped[Product] = relationship(back_populates="color_variants")


class ProductSpec(Base):
    __tablename__ = "product_specs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    block_title: Mapped[str | None] = mapped_column(Text)
    key: Mapped[str | None] = mapped_column(Text)
    value: Mapped[str | None] = mapped_column(Text)
    key_ko: Mapped[str | None] = mapped_column(Text)
    value_ko: Mapped[str | None] = mapped_column(Text)
    translations: Mapped[dict | None] = mapped_column(JSONB, server_default="{}")

    product: Mapped[Product] = relationship(back_populates="specs")
