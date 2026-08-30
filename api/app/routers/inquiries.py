import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_session
from app.deps import get_optional_user, require_role
from app.models import Inquiry, Product, User
from app.schemas.inquiries import InquiryCreate, InquiryOut, InquiryUpdate
from app.services.audit import write_audit

router = APIRouter(prefix="/inquiries", tags=["inquiries"])


@router.post("", response_model=InquiryOut, status_code=status.HTTP_201_CREATED)
async def submit_inquiry(
    body: InquiryCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User | None, Depends(get_optional_user)] = None,
):
    product = await session.get(Product, body.product_id)
    if not product or not product.is_published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    inquiry = Inquiry(
        product_id=body.product_id,
        user_id=user.id if user else None,
        contact_name=body.contact_name,
        contact_phone=body.contact_phone,
        contact_channel=body.contact_channel,
        status="new",
    )
    session.add(inquiry)
    await session.commit()
    await session.refresh(inquiry)
    return _to_out(inquiry, product.title)


@router.get("", response_model=list[InquiryOut])
async def list_inquiries(
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(require_role("support", "admin"))],
    mine: bool = False,
):
    stmt = select(Inquiry).options(selectinload(Inquiry.product)).order_by(Inquiry.created_at.desc())

    if user.role == "support":
        if mine:
            stmt = stmt.where(Inquiry.claimed_by == user.id)
        else:
            stmt = stmt.where(or_(Inquiry.status == "new", Inquiry.claimed_by == user.id))
    elif mine:
        stmt = stmt.where(Inquiry.claimed_by == user.id)

    rows = (await session.scalars(stmt)).all()
    return [_to_out(i, i.product.title if i.product else None) for i in rows]


@router.post("/{inquiry_id}/claim", response_model=InquiryOut)
async def claim_inquiry(
    inquiry_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(require_role("support", "admin"))],
):
    inquiry = await session.get(Inquiry, inquiry_id, options=[selectinload(Inquiry.product)])
    if not inquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    if inquiry.status != "new" and inquiry.claimed_by != user.id and user.role != "admin":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already claimed")

    inquiry.status = "claimed"
    inquiry.claimed_by = user.id
    await write_audit(session, actor_id=user.id, action="claim", entity="inquiry", entity_id=inquiry.id)
    await session.commit()
    await session.refresh(inquiry)
    return _to_out(inquiry, inquiry.product.title if inquiry.product else None)


@router.patch("/{inquiry_id}", response_model=InquiryOut)
async def update_inquiry(
    inquiry_id: uuid.UUID,
    body: InquiryUpdate,
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(require_role("support", "admin"))],
):
    inquiry = await session.get(Inquiry, inquiry_id, options=[selectinload(Inquiry.product)])
    if not inquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    if user.role == "support" and inquiry.claimed_by != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your inquiry")

    diff = {}
    if body.status is not None:
        diff["status"] = {"from": inquiry.status, "to": body.status}
        inquiry.status = body.status
    if body.notes is not None:
        diff["notes"] = body.notes
        inquiry.notes = body.notes

    await write_audit(session, actor_id=user.id, action="update", entity="inquiry", entity_id=inquiry.id, diff=diff)
    await session.commit()
    await session.refresh(inquiry)
    return _to_out(inquiry, inquiry.product.title if inquiry.product else None)


def _to_out(inquiry: Inquiry, product_title: str | None) -> InquiryOut:
    return InquiryOut(
        id=inquiry.id,
        product_id=inquiry.product_id,
        product_title=product_title,
        contact_name=inquiry.contact_name,
        contact_phone=inquiry.contact_phone,
        contact_channel=inquiry.contact_channel,
        status=inquiry.status,
        claimed_by=inquiry.claimed_by,
        notes=inquiry.notes,
    )
