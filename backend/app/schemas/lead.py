from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class LeadCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    company: str | None = Field(None, max_length=500)
    email: str | None = Field(None, max_length=320)
    phone: str | None = Field(None, max_length=64)
    status: str = Field(default="new", max_length=64)
    source: str | None = Field(None, max_length=200)
    source_platform: str | None = Field(None, max_length=120)
    notes: str | None = None
    occupation: str | None = Field(None, max_length=120)
    education: str | None = Field(None, max_length=120)
    age: float | None = Field(None, ge=0, le=120)
    deal_value: float | None = Field(None, ge=0)


class LeadResponse(BaseModel):
    id: UUID
    owner_id: UUID
    title: str
    company: str | None = None
    email: str | None = None
    phone: str | None = None
    status: str
    source: str | None = None
    source_platform: str | None = None
    whatsapp_status: str | None = None
    whatsapp_last_sent_at: datetime | None = None
    whatsapp_delivery_status: str | None = None
    notification_attempts: int | None = None
    website_visits: int | None = None
    last_website_visit_at: datetime | None = None
    last_seen_status: str | None = None
    last_open_status: str | None = None
    last_contacted_at: datetime | None = None
    priority_rank: int | None = None
    notes: str | None = None
    occupation: str | None = None
    education: str | None = None
    age: float | None = None
    ai_score: float | None = None
    ai_score_summary: str | None = None
    sentiment_label: str | None = None
    sentiment_compound: float | None = None
    ml_lead_score: float | None = None
    conversion_probability: float | None = None
    deal_value: float | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeadUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)
    company: str | None = Field(None, max_length=500)
    email: str | None = Field(None, max_length=320)
    phone: str | None = Field(None, max_length=64)
    status: str | None = Field(None, max_length=64)
    source: str | None = Field(None, max_length=200)
    source_platform: str | None = Field(None, max_length=120)
    notes: str | None = None
    occupation: str | None = Field(None, max_length=120)
    education: str | None = Field(None, max_length=120)
    age: float | None = Field(None, ge=0, le=120)


class LeadIngest(BaseModel):
    raw_text: str = Field(..., min_length=1)
    source_platform: str = Field(..., max_length=120)
    source_type: str | None = Field(None, max_length=120)
    page_url: str | None = Field(None, max_length=1024)
    campaign_name: str | None = Field(None, max_length=120)
    email: str | None = Field(None, max_length=320)
    phone: str | None = Field(None, max_length=64)
    company: str | None = Field(None, max_length=500)
    title: str | None = Field(None, max_length=500)
    notes: str | None = None


class WhatsAppMessageRequest(BaseModel):
    message: str | None = Field(None, max_length=2000)
    purpose: str | None = Field(None, max_length=120)


class WhatsAppFeedback(BaseModel):
    delivery_status: str | None = Field(None, max_length=120)
    seen_status: str | None = Field(None, max_length=120)
    open_status: str | None = Field(None, max_length=120)
    website_visited: bool | None = None


class ActivityResponse(BaseModel):
    id: UUID
    activity_type: str
    subject: str | None = None
    body: str | None = None
    occurred_at: datetime
    model_config = ConfigDict(from_attributes=True)


class VoiceRecordingResponse(BaseModel):
    id: UUID
    filename: str
    duration_seconds: float | None = None
    transcript: str | None = None
    summary: str | None = None
    sentiment_label: str | None = None
    sentiment_score: float | None = None
    occurred_at: datetime
    model_config = ConfigDict(from_attributes=True)


class LeadReportResponse(BaseModel):
    lead: LeadResponse
    activities: list[ActivityResponse]
    voice_recordings: list[VoiceRecordingResponse]
    interaction_count: int
    ai_risk_assessment: str | None = None
    ai_summary_card: str | None = None
