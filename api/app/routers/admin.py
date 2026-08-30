import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_session
from app.deps import require_role
from app.models import AuditLog, Category, Product, User
from app.schemas.catalog import CategoryOut
from app.services.audit import write_audit
from app.services.cache import invalidate_catalog
from app.services.pricing import compute_display_price
from app.services.site_config import get_site_config

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_role("admin"))])


class ProductAdminOut(BaseModel):
    id: uuid.UUID
    spu_id: int
    slug: str
    title: str
    brand: str | None
    price_krw: float | None
    price_original_krw: float | None = None
    price_manual_krw: float | None = None
    markup_percent: float | None = None
    discount_percent: float | None = None
    is_published: bool
    is_in_stock: bool | None
    category_name: str | None = None

    model_config = {"from_attributes": True}


class ProductUpdate(BaseModel):
    title: str | None = None
    brand: str | None = None
    price_krw: float | None = None
    price_manual_krw: float | None = None
    markup_percent: float | None = None
    discount_percent: float | None = None
    is_published: bool | None = None
    is_in_stock: bool | None = None
    category_id: uuid.UUID | None = None


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    is_active: bool

    model_config = {"from_attributes": True}


class UserRoleUpdate(BaseModel):
    role: str


class AuditLogOut(BaseModel):
    id: uuid.UUID
    actor_id: uuid.UUID | None
    action: str
    entity: str
    entity_id: uuid.UUID | None
    diff: dict | None
    created_at: str

    model_config = {"from_attributes": True}


class CategoryCreate(BaseModel):
    name: str
    slug: str
    parent_id: uuid.UUID | None = None


@router.get("/products", response_model=list[ProductAdminOut])
async def admin_list_products(
    session: Annotated[AsyncSession, Depends(get_session)],
    q: str | None = None,
    published: bool | None = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    stmt = select(Product).options(selectinload(Product.category)).order_by(Product.updated_at.desc())
    if q:
        pattern = f"%{q}%"
        stmt = stmt.where(or_(Product.title.ilike(pattern), Product.brand.ilike(pattern)))
    if published is not None:
        stmt = stmt.where(Product.is_published.is_(published))
    stmt = stmt.offset(offset).limit(limit)
    products = (await session.scalars(stmt)).unique().all()
    pricing = (await get_site_config(session)).pricing
    return [_product_admin_out(p, pricing) for p in products]


def _product_admin_out(product: Product, pricing) -> ProductAdminOut:
    display = compute_display_price(product, pricing)
    return ProductAdminOut(
        id=product.id,
        spu_id=product.spu_id,
        slug=product.slug,
        title=product.title,
        brand=product.brand,
        price_krw=display.price_krw,
        price_original_krw=display.price_original_krw,
        price_manual_krw=float(product.price_manual_krw) if product.price_manual_krw is not None else None,
        markup_percent=float(product.markup_percent) if product.markup_percent is not None else None,
        discount_percent=float(product.discount_percent) if product.discount_percent is not None else None,
        is_published=product.is_published,
        is_in_stock=product.is_in_stock,
        category_name=product.category.name if product.category else None,
    )


@router.patch("/products/{product_id}", response_model=ProductAdminOut)
async def admin_update_product(
    product_id: uuid.UUID,
    body: ProductUpdate,
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(require_role("admin"))],
):
    product = await session.get(Product, product_id, options=[selectinload(Product.category)])
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    diff = {}
    for field, value in body.model_dump(exclude_unset=True).items():
        diff[field] = {"from": getattr(product, field), "to": value}
        setattr(product, field, value)

    await write_audit(session, actor_id=user.id, action="update", entity="product", entity_id=product_id, diff=diff)
    await session.commit()
    await invalidate_catalog()
    await session.refresh(product)
    pricing = (await get_site_config(session)).pricing
    return _product_admin_out(product, pricing)


class BulkPublishRequest(BaseModel):
    product_ids: list[uuid.UUID]
    published: bool


@router.post("/products/bulk-publish")
async def bulk_publish(
    body: BulkPublishRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(require_role("admin"))],
):
    result = await session.execute(
        select(Product).where(Product.id.in_(body.product_ids))
    )
    products = result.scalars().all()
    for p in products:
        p.is_published = body.published
    await write_audit(
        session,
        actor_id=user.id,
        action="bulk_publish" if body.published else "bulk_unpublish",
        entity="product",
        diff={"ids": [str(i) for i in body.product_ids]},
    )
    await session.commit()
    await invalidate_catalog()
    return {"updated": len(products)}


@router.get("/categories", response_model=list[CategoryOut])
async def admin_categories(session: Annotated[AsyncSession, Depends(get_session)]):
    rows = await session.scalars(select(Category).order_by(Category.name))
    return [CategoryOut.model_validate(c) for c in rows.all()]


@router.post("/categories", response_model=CategoryOut, status_code=201)
async def create_category(
    body: CategoryCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(require_role("admin"))],
):
    cat = Category(name=body.name, slug=body.slug, parent_id=body.parent_id)
    session.add(cat)
    await session.flush()
    await write_audit(session, actor_id=user.id, action="create", entity="category", entity_id=cat.id)
    await session.commit()
    await session.refresh(cat)
    await invalidate_catalog()
    return CategoryOut.model_validate(cat)


@router.get("/users", response_model=list[UserOut])
async def list_users(session: Annotated[AsyncSession, Depends(get_session)]):
    rows = await session.scalars(select(User).order_by(User.created_at.desc()))
    return [UserOut.model_validate(u) for u in rows.all()]


@router.patch("/users/{user_id}/role", response_model=UserOut)
async def update_user_role(
    user_id: uuid.UUID,
    body: UserRoleUpdate,
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(require_role("admin"))],
):
    if body.role not in ("user", "support", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role")
    target = await session.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    target.role = body.role
    await write_audit(
        session,
        actor_id=user.id,
        action="role_change",
        entity="user",
        entity_id=user_id,
        diff={"role": body.role},
    )
    await session.commit()
    return UserOut.model_validate(target)


@router.get("/audit-log", response_model=list[AuditLogOut])
async def audit_log(
    session: Annotated[AsyncSession, Depends(get_session)],
    limit: int = Query(100, ge=1, le=500),
):
    rows = await session.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit))
    return [
        AuditLogOut(
            id=r.id,
            actor_id=r.actor_id,
            action=r.action,
            entity=r.entity,
            entity_id=r.entity_id,
            diff=r.diff,
            created_at=r.created_at.isoformat(),
        )
        for r in rows.all()
    ]


@router.get("/stats")
async def admin_stats(session: Annotated[AsyncSession, Depends(get_session)]):
    total = await session.scalar(select(func.count()).select_from(Product))
    published = await session.scalar(select(func.count()).select_from(Product).where(Product.is_published.is_(True)))
    users = await session.scalar(select(func.count()).select_from(User))
    return {"products_total": total, "products_published": published, "users": users}
