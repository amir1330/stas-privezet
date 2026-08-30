import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class OrderItemCreate(BaseModel):
    product_id: uuid.UUID
    variant_id: uuid.UUID | None = None
    size: str | None = None
    quantity: int = Field(default=1, ge=1, le=99)
    unit_price_krw: float | None = None


class OrderCreate(BaseModel):
    inquiry_id: uuid.UUID | None = None
    items: list[OrderItemCreate] = Field(min_length=1)
    notes: str | None = None


class OrderItemOut(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    size: str | None
    quantity: int
    unit_price_krw: float | None

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: uuid.UUID
    status: str
    total_krw: float | None
    notes: str | None
    items: list[OrderItemOut]
    created_at: datetime

    model_config = {"from_attributes": True}
