from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel

class LeadSourceBase(BaseModel):
    name: str
    platform_type: str
    status: Optional[str] = "Disconnected"
    auth_config: Optional[Dict[str, Any]] = None
    field_mapping: Optional[Dict[str, str]] = None
    sync_schedule: Optional[str] = "Manual"
    is_active: Optional[bool] = True

class LeadSourceCreate(LeadSourceBase):
    pass

class LeadSourceUpdate(BaseModel):
    name: Optional[str] = None
    platform_type: Optional[str] = None
    status: Optional[str] = None
    auth_config: Optional[Dict[str, Any]] = None
    field_mapping: Optional[Dict[str, str]] = None
    sync_schedule: Optional[str] = None
    is_active: Optional[bool] = None

class LeadSourceResponse(LeadSourceBase):
    id: UUID
    last_sync_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
