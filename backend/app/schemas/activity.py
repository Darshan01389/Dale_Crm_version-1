from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ActivityCreate(BaseModel):
    activity_type: Literal["call", "email", "whatsapp", "note"]
    deal_id: UUID | None = None
    lead_id: UUID | None = None
    subject: str | None = Field(None, max_length=500)
    body: str | None = None
    extra_metadata: str | None = None
    occurred_at: datetime | None = None

    @model_validator(mode="after")
    def need_link(self):
        if not self.deal_id and not self.lead_id:
            raise ValueError("Provide deal_id and/or lead_id")
        return self


class ActivityResponse(BaseModel):
    id: UUID
    owner_id: UUID
    deal_id: UUID | None
    lead_id: UUID | None
    activity_type: str
    subject: str | None
    body: str | None
    extra_metadata: str | None
    occurred_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
