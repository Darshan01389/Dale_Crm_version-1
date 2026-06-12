from pydantic import BaseModel

class SalespersonCreate(BaseModel):
    name: str
    email: str

class SalespersonOut(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True