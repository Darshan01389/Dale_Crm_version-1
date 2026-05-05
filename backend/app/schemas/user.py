# app/schemas/user.py
# Pydantic schemas = data validation
# These define exactly what shape the JSON must be in each request/response

from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime

# ── What data is needed to REGISTER ──────────────────────────────
class UserRegister(BaseModel):
    name: str
    email: EmailStr        # pydantic checks it's a valid email format
    password: str
    role: str = "Sales Rep"

    # Example of what this looks like in the API docs
    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Ram Prasanna",
                "email": "ram@dealcrm.com",
                "password": "SecurePass123",
                "role": "Sales Rep"
            }
        }
    }

# ── What data is needed to LOGIN ──────────────────────────────────
class UserLogin(BaseModel):
    email: EmailStr
    password: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "ram@dealcrm.com",
                "password": "SecurePass123"
            }
        }
    }

# ── What we send BACK after login (never send password_hash!) ─────
class UserResponse(BaseModel):
    id: UUID
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

    # This tells Pydantic to read data from SQLAlchemy objects
    # (not just plain dictionaries)
    model_config = {"from_attributes": True}

# ── Token schemas ─────────────────────────────────────────────────
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[str] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str