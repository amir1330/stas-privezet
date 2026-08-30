from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.deps import require_role
from app.schemas.site_config import SiteConfig, SiteConfigUpdate
from app.services.cache import invalidate_catalog
from app.services.site_config import default_site_config, get_site_config, save_site_config

router = APIRouter(tags=["site"])


@router.get("/site/config", response_model=SiteConfig)
async def read_site_config(session: Annotated[AsyncSession, Depends(get_session)]):
    try:
        return await get_site_config(session)
    except Exception:
        return default_site_config()


@router.put(
    "/admin/site-config",
    response_model=SiteConfig,
    dependencies=[Depends(require_role("admin"))],
)
async def update_site_config(
    body: SiteConfigUpdate,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    current = await get_site_config(session)
    data = current.model_dump()
    updates = body.model_dump(exclude_unset=True)
    data.update(updates)
    config = SiteConfig.model_validate(data)
    saved = await save_site_config(session, config)
    await invalidate_catalog()
    return saved


@router.post(
    "/admin/site-config/reset",
    response_model=SiteConfig,
    dependencies=[Depends(require_role("admin"))],
)
async def reset_site_config(session: Annotated[AsyncSession, Depends(get_session)]):
    config = default_site_config()
    return await save_site_config(session, config)
