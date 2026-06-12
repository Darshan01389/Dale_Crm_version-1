from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel

# Lead Attribution
class LeadAttributionBase(BaseModel):
    lead_id: UUID
    ft_source: Optional[str] = None
    ft_campaign: Optional[str] = None
    lt_source: Optional[str] = None
    lt_campaign: Optional[str] = None
    revenue_credit: float = 0.0

class LeadAttributionCreate(LeadAttributionBase):
    pass

class LeadAttributionResponse(LeadAttributionBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

# AI Recommendation
class AIRecommendationBase(BaseModel):
    campaign_id: Optional[UUID] = None
    insight_type: str
    message: str
    is_implemented: bool = False
    is_dismissed: bool = False

class AIRecommendationCreate(AIRecommendationBase):
    pass

class AIRecommendationResponse(AIRecommendationBase):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}
