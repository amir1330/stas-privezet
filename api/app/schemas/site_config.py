from pydantic import BaseModel, Field


class PricingConfig(BaseModel):
    default_markup_percent: float = 0
    site_discount_percent: float = 0


class ThemeConfig(BaseModel):
    accent: str = "#7C3AED"
    accent_dark: str = "#5B21B6"
    accent_light: str = "#EDE9FE"
    cart_button: str = "#7C3AED"
    hero_yellow: str = "#EDE9FE"


class TileOverride(BaseModel):
    id: str
    label: str
    image_url: str | None = None
    category_slug: str | None = None
    keywords: list[str] = Field(default_factory=list)


class HomepageSection(BaseModel):
    id: str
    type: str
    enabled: bool = True
    order: int = 0
    title: str | None = None


class PromoTile(BaseModel):
    id: str
    label: str
    sublabel: str | None = None
    color: str = "#222222"
    href: str = "/catalog"
    enabled: bool = True
    order: int = 0


class SiteConfig(BaseModel):
    theme: ThemeConfig = Field(default_factory=ThemeConfig)
    sections: list[HomepageSection] = Field(default_factory=list)
    tile_overrides: list[TileOverride] = Field(default_factory=list)
    promo_tiles: list[PromoTile] = Field(default_factory=list)
    pricing: PricingConfig = Field(default_factory=PricingConfig)
    remove_bg_default: bool = True


class SiteConfigUpdate(BaseModel):
    theme: ThemeConfig | None = None
    sections: list[HomepageSection] | None = None
    tile_overrides: list[TileOverride] | None = None
    promo_tiles: list[PromoTile] | None = None
    pricing: PricingConfig | None = None
    remove_bg_default: bool | None = None
