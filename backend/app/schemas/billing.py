from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel

class SubscriptionPlanBase(BaseModel):
    name: str
    base_price: float
    max_requests_per_minute: int
    has_voice_transcription: bool
    has_advanced_lead_sources: bool

class SubscriptionPlanResponse(SubscriptionPlanBase):
    id: UUID
    model_config = {"from_attributes": True}

class CompanySubscriptionBase(BaseModel):
    plan_id: UUID
    custom_price: Optional[float] = None
    custom_requests_per_minute: Optional[int] = None
    custom_voice: Optional[bool] = None
    custom_lead_sources: Optional[bool] = None

class CompanySubscriptionResponse(BaseModel):
    id: UUID
    company_id: int
    plan: SubscriptionPlanResponse
    status: str
    current_period_start: datetime
    current_period_end: datetime
    ai_requests_used: int
    custom_price: Optional[float]
    custom_requests_per_minute: Optional[int]
    custom_voice: Optional[bool]
    custom_lead_sources: Optional[bool]

    model_config = {"from_attributes": True}

class InvoiceResponse(BaseModel):
    id: UUID
    company_id: int
    amount_due: float
    status: str
    billing_date: datetime
    paid_date: Optional[datetime]
    
    model_config = {"from_attributes": True}
