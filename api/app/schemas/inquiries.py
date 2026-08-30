import uuid

from pydantic import BaseModel, Field


class InquiryCreate(BaseModel):
    product_id: uuid.UUID
    contact_name: str = Field(min_length=1, max_length=200)
    contact_phone: str | None = Field(default=None, max_length=50)
    contact_channel: str | None = Field(default=None, max_length=100)


class InquiryUpdate(BaseModel):
    status: str | None = None
    notes: str | None = None


class InquiryOut(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_title: str | None = None
    contact_name: str
    contact_phone: str | None
    contact_channel: str | None
    status: str
    claimed_by: uuid.UUID | None
    notes: str | None

    model_config = {"from_attributes": True}
