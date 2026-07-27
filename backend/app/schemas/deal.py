from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DealCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    stage_key: str = Field(..., min_length=1, max_length=64)
    lead_id: UUID | None = None
    amount: float = Field(default=0.0, ge=0)
    currency: str = Field(default="USD", max_length=8)
    probability: float = Field(default=0.0, ge=0, le=100)
    expected_close_date: date | None = None
    outcome: str = Field(default="open", max_length=32)
    notes: str | None = None


class DealUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)
    stage_key: str | None = Field(None, min_length=1, max_length=64)
    lead_id: UUID | None = None
    amount: float | None = Field(None, ge=0)
    currency: str | None = Field(None, max_length=8)
    probability: float | None = Field(None, ge=0, le=100)
    expected_close_date: date | None = None
    outcome: str | None = Field(None, max_length=32)
    notes: str | None = None


class DealResponse(BaseModel):
    id: UUID
    owner_id: UUID
    lead_id: UUID | None
    title: str
    stage_id: UUID
    stage_key: str
    stage_label: str
    amount: float
    currency: str
    probability: float
    expected_close_date: date | None
    closed_at: datetime | None
    outcome: str
    notes: str | None
    created_at: datetime
    updated_at: datetime
    intent: str | None = None
    lead_name: str | None = None

    model_config = ConfigDict(from_attributes=True)
