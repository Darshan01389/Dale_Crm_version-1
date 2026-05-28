from datetime import datetime
from typing import Optional, Dict, Any, List
from uuid import UUID
from pydantic import BaseModel

class AutomationRuleBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    conditions: List[Dict[str, Any]]
    action_type: str
    action_payload: Dict[str, Any]

class AutomationRuleCreate(AutomationRuleBase):
    pass

class AutomationRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    conditions: Optional[List[Dict[str, Any]]] = None
    action_type: Optional[str] = None
    action_payload: Optional[Dict[str, Any]] = None

class AutomationRuleResponse(AutomationRuleBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
