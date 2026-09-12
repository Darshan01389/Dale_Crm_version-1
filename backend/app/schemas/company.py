from pydantic import BaseModel, ConfigDict
from typing import Optional

class CompanyCreate(BaseModel):
    name: str
    industry: Optional[str] = None
    whatsapp_number: Optional[str] = None
    size: Optional[str] = None

class CompanyOut(BaseModel):
    id: int
    name: str
    industry: Optional[str] = None
    whatsapp_number: Optional[str] = None
    join_code: Optional[str] = None
    size: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)