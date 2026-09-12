
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from typing import Optional, List

class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None

class TeamCreate(TeamBase):
    pass

class TeamResponse(TeamBase):
    id: UUID
    join_code: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class TeamWithMembers(TeamResponse):
    members: List[UUID] = []
