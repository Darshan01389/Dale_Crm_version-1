from datetime import datetime, date
from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel

# UTM Tracking
class UTMTrackingBase(BaseModel):
    session_id: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_term: Optional[str] = None
    utm_content: Optional[str] = None
    referrer_url: Optional[str] = None
    landing_page: Optional[str] = None

class UTMTrackingCreate(UTMTrackingBase):
    lead_id: Optional[UUID] = None

class UTMTrackingResponse(UTMTrackingBase):
    id: UUID
    lead_id: Optional[UUID] = None
    created_at: datetime
    
    model_config = {"from_attributes": True}

# Website Event
class WebsiteEventBase(BaseModel):
    session_id: str
    event_type: str
    page_url: Optional[str] = None
    element_id: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    device_type: Optional[str] = None
    browser: Optional[str] = None

class WebsiteEventCreate(WebsiteEventBase):
    lead_id: Optional[UUID] = None

class WebsiteEventResponse(WebsiteEventBase):
    id: UUID
    lead_id: Optional[UUID] = None
    created_at: datetime

    model_config = {"from_attributes": True}

# Campaign Metric
class CampaignMetricBase(BaseModel):
    campaign_id: UUID
    date: date
    spend: float = 0.0
    impressions: int = 0
    clicks: int = 0
    leads_generated: int = 0
    conversions: int = 0
    revenue: float = 0.0

class CampaignMetricCreate(CampaignMetricBase):
    pass

class CampaignMetricResponse(CampaignMetricBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
