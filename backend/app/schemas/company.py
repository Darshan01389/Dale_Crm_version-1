from pydantic import BaseModel

class CompanyCreate(BaseModel):
    name: str
    industry: str
    whatsapp_number: str

class CompanyOut(BaseModel):
    id: int
    name: str
    industry: str
    whatsapp_number: str

    class Config:
        from_attributes = True