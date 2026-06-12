from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class CalendarEventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    start_time: datetime
    end_time: datetime
    event_type: str = Field(default="meeting", max_length=50)  # "call", "meeting", "followup"
    attendees: str | None = None  # JSON-encoded list or comma-separated string
    is_all_day: bool = False
    lead_id: UUID | None = None

class CalendarEventUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    event_type: str | None = Field(None, max_length=50)
    attendees: str | None = None
    is_all_day: bool | None = None
    lead_id: UUID | None = None

class CalendarEventResponse(BaseModel):
    id: UUID
    owner_id: UUID
    lead_id: UUID | None = None
    title: str
    description: str | None = None
    start_time: datetime
    end_time: datetime
    event_type: str
    attendees: str | None = None
    is_all_day: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
