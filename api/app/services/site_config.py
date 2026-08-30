from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.site_settings import SiteSetting
from app.schemas.site_config import HomepageSection, PricingConfig, PromoTile, SiteConfig, ThemeConfig

SITE_CONFIG_KEY = "homepage"

DEFAULT_SECTIONS: list[HomepageSection] = [
    HomepageSection(id="hero", type="hero", enabled=True, order=0),
    HomepageSection(id="guarantee", type="guarantee", enabled=True, order=1),
    HomepageSection(id="mega_categories", type="mega_categories", enabled=True, order=2),
    HomepageSection(id="brands", type="brands", enabled=True, order=3),
    HomepageSection(id="gender_tabs", type="gender_tabs", enabled=True, order=4),
    HomepageSection(id="footwear", type="footwear", enabled=True, order=5),
    HomepageSection(id="clothing", type="clothing", enabled=True, order=6),
    HomepageSection(id="lookbook", type="lookbook", enabled=False, order=7),
    HomepageSection(id="accessories", type="accessories", enabled=True, order=8),
    HomepageSection(id="curated", type="curated", enabled=False, order=9),
    HomepageSection(id="pickup", type="pickup", enabled=False, order=10),
    HomepageSection(id="gift_cert", type="gift_cert", enabled=False, order=11),
]

DEFAULT_PROMO_TILES: list[PromoTile] = [
    PromoTile(
        id="garage_sale",
        label="Garage Sale",
        sublabel="С 24 по 31 августа",
        color="#ff385c",
        href="/catalog",
        enabled=True,
        order=0,
    ),
    PromoTile(
        id="discount",
        label="Забери скидку",
        sublabel="до 31 августа",
        color="#7c3aed",
        href="/catalog",
        enabled=True,
        order=1,
    ),
    PromoTile(
        id="app",
        label="Скачай приложение",
        sublabel="Получи скидку",
        color="#222222",
        href="/catalog",
        enabled=False,
        order=2,
    ),
    PromoTile(
        id="photo_search",
        label="Найди товар по фотке",
        sublabel="Байер сервис",
        color="#222222",
        href="/search",
        enabled=False,
        order=3,
    ),
]


def default_site_config() -> SiteConfig:
    return SiteConfig(
        theme=ThemeConfig(),
        sections=DEFAULT_SECTIONS,
        tile_overrides=[],
        promo_tiles=DEFAULT_PROMO_TILES,
        pricing=PricingConfig(),
        remove_bg_default=True,
    )


async def get_site_config(session: AsyncSession) -> SiteConfig:
    row = await session.get(SiteSetting, SITE_CONFIG_KEY)
    if not row:
        return default_site_config()
    data = row.value
    base = default_site_config().model_dump()
    base.update(data)
    if not base.get("promo_tiles"):
        base["promo_tiles"] = [p.model_dump() for p in DEFAULT_PROMO_TILES]
    if not base.get("pricing"):
        base["pricing"] = PricingConfig().model_dump()
    return SiteConfig.model_validate(base)


async def save_site_config(session: AsyncSession, config: SiteConfig) -> SiteConfig:
    row = await session.get(SiteSetting, SITE_CONFIG_KEY)
    payload = config.model_dump()
    if row:
        row.value = payload
    else:
        session.add(SiteSetting(key=SITE_CONFIG_KEY, value=payload))
    await session.commit()
    return config
