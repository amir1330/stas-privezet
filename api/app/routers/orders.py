import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_session
from app.deps import get_current_user, require_role
from app.models import Order, OrderItem, Product, ProductVariant, User
from app.schemas.orders import OrderCreate, OrderOut
from app.services.audit import write_audit
from app.services.payments import get_payment_provider

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(
    body: OrderCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
):
    total = 0.0
    order = Order(user_id=user.id, inquiry_id=body.inquiry_id, status="draft", notes=body.notes)
    session.add(order)
    await session.flush()

    for item in body.items:
        product = await session.get(Product, item.product_id)
        if not product or not product.is_published:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")

        unit_price = item.unit_price_krw
        if unit_price is None and item.variant_id:
            variant = await session.get(ProductVariant, item.variant_id)
            unit_price = float(variant.price_krw) if variant and variant.price_krw else None
        if unit_price is None:
            unit_price = float(product.price_krw) if product.price_krw else 0

        total += unit_price * item.quantity
        session.add(
            OrderItem(
                order_id=order.id,
                product_id=item.product_id,
                variant_id=item.variant_id,
                size=item.size,
                quantity=item.quantity,
                unit_price_krw=unit_price,
            )
        )

    order.total_krw = total
    order.status = "pending_payment"
    provider = get_payment_provider()
    intent = await provider.create_intent(order.id, total, {"user_id": str(user.id)})
    order.notes = (order.notes or "") + f"\npayment_ref={intent.provider_ref}"

    await session.commit()
    await session.refresh(order, ["items"])
    return OrderOut.model_validate(order)


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
):
    order = await session.scalar(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if user.role == "user" and order.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your order")
    return OrderOut.model_validate(order)


@router.post("/{order_id}/confirm", response_model=OrderOut)
async def confirm_order_payment(
    order_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(require_role("admin", "support"))],
):
    order = await session.scalar(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    provider = get_payment_provider()
    ref = (order.notes or "").split("payment_ref=")[-1].strip() if order.notes else f"manual-{order_id}"
    await provider.confirm(ref)
    order.status = "paid"
    await write_audit(session, actor_id=user.id, action="confirm_payment", entity="order", entity_id=order_id)
    await session.commit()
    return OrderOut.model_validate(order)
