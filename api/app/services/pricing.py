"""Display price calculation from base cost, markup and discount."""

from dataclasses import dataclass

from app.models.catalog import Product
from app.schemas.site_config import PricingConfig


@dataclass
class DisplayPrice:
    price_krw: float | None
    price_original_krw: float | None
    markup_percent: float
    discount_percent: float


def compute_display_price(product: Product, pricing: PricingConfig) -> DisplayPrice:
    markup = (
        float(product.markup_percent)
        if product.markup_percent is not None
        else pricing.default_markup_percent
    )
    discount = (
        float(product.discount_percent)
        if product.discount_percent is not None
        else pricing.site_discount_percent
    )

    if product.price_manual_krw is not None:
        manual = float(product.price_manual_krw)
        return DisplayPrice(
            price_krw=manual,
            price_original_krw=None,
            markup_percent=markup,
            discount_percent=discount,
        )

    base = float(product.price_original_krw or product.price_krw or 0)
    if base <= 0:
        return DisplayPrice(
            price_krw=None,
            price_original_krw=None,
            markup_percent=markup,
            discount_percent=discount,
        )

    with_markup = base * (1 + markup / 100)
    final = with_markup * (1 - discount / 100)
    original = round(with_markup) if discount > 0 else None

    return DisplayPrice(
        price_krw=round(final),
        price_original_krw=original,
        markup_percent=markup,
        discount_percent=discount,
    )
