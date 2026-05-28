from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel

class WebhookLogBase(BaseModel):
    source_id: UUID
    payload: Dict[str, Any]
    status: str
    error_message: Optional[str] = None

class WebhookLogCreate(WebhookLogBase):
    pass

class WebhookLogResponse(WebhookLogBase):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}
