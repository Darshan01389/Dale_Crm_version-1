# app/schemas/salesperson.py
from pydantic import BaseModel, EmailStr

class SalespersonCreate(BaseModel):
    name: str
    email: EmailStr

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "John Doe",
                "email": "john@example.com"
            }
        }
    }

class SalespersonOut(BaseModel):
    id: int
    name: str
    email: str