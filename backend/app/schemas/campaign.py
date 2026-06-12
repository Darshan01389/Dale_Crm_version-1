from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel

class CampaignBase(BaseModel):
    name: str
    platform: str
    status: Optional[str] = "Active"
    budget: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class CampaignCreate(CampaignBase):
    pass

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    platform: Optional[str] = None
    status: Optional[str] = None
    budget: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class CampaignResponse(CampaignBase):
    id: UUID
    spend: float
    leads_generated: int
    conversions: int
    revenue_generated: float
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
