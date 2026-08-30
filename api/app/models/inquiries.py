import uuid
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, new_uuid

if TYPE_CHECKING:
    from app.models.catalog import Product
    from app.models.users import User


class Inquiry(Base, TimestampMixin):
    __tablename__ = "inquiries"
    __table_args__ = (
        CheckConstraint(
            "status IN ('new', 'claimed', 'in_progress', 'closed')",
            name="inquiries_status_check",
        ),
        Index("ix_inquiries_status_claimed_by", "status", "claimed_by"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    contact_name: Mapped[str] = mapped_column(Text, nullable=False)
    contact_phone: Mapped[str | None] = mapped_column(Text)
    contact_channel: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="new")
    claimed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    notes: Mapped[str | None] = mapped_column(Text)

    product: Mapped["Product"] = relationship(back_populates="inquiries")
    claimed_by_user: Mapped["User | None"] = relationship(
        foreign_keys=[claimed_by], back_populates="inquiries_claimed"
    )
