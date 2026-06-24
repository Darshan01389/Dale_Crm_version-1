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
    invite_code: Optional[str] = None

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
    is_email_verified: bool
    team_id: Optional[UUID] = None
    company_id: Optional[int] = None
    created_at: datetime
    is_super_admin: Optional[bool] = False
    is_company_admin: Optional[bool] = False
    admin_approval_status: Optional[str] = "Approved"

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

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    whatsapp_number: Optional[str] = None
    company_email: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class GoogleLoginRequest(BaseModel):
    token: str

class RoleUpdateRequest(BaseModel):
    role: str

class EmailVerificationCodeRequest(BaseModel):
    email: EmailStr
    code: str

class ResendCodeRequest(BaseModel):
    email: EmailStr
