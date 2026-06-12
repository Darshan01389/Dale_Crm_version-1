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

class SubscriptionInitRequest(CompanySubscriptionBase):
    gateway: str # "stripe" or "razorpay"

class SubscriptionInitResponse(BaseModel):
    subscription_id: UUID
    invoice_id: UUID
    gateway: str
    amount: float
    stripe_session_id: Optional[str] = None
    stripe_checkout_url: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_key_id: Optional[str] = None

class InvoiceResponse(BaseModel):
    id: UUID
    company_id: int
    amount_due: float
    status: str
    gateway: Optional[str] = None
    gateway_order_id: Optional[str] = None
    billing_date: datetime
    paid_date: Optional[datetime]
    
    model_config = {"from_attributes": True}
