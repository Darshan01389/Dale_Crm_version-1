
from pydantic import BaseModel
from uuid import UUID
from typing import Optional, List

class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None

class TeamCreate(TeamBase):
    pass

class TeamResponse(TeamBase):
    id: UUID

    class Config:
        from_attributes = True

class TeamWithMembers(TeamResponse):
    members: List[UUID] = []
