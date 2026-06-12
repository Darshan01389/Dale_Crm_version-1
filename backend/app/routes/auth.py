# app/routes/auth.py
# These are the actual API endpoints the frontend will call
# Each route is thin — it just calls the service and returns the result

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.limiter import limiter
from app.core.dependencies import get_current_user
from app.core.security import verify_token, create_access_token
from app.schemas.user import (
    UserRegister, UserLogin, UserResponse, Token, RefreshTokenRequest,
    ForgotPasswordRequest, ResetPasswordRequest, UserProfileUpdate, ChangePasswordRequest
)
from app.services.auth_service import register_user, login_user, get_user_by_id
from app.models.user import User

# APIRouter groups related routes together
# prefix means all routes here start with /auth
router = APIRouter(prefix="/auth", tags=["Authentication"])

def send_verification_bg(email: str, user_id: str):
    from app.core.security import create_verification_token
    from app.services.email_service import send_verification_email
    from app.core.config import settings
    
    token = create_verification_token({"sub": str(user_id)})
    verification_link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    send_verification_email(email, verification_link)

@router.post("/register", response_model=UserResponse, status_code=201)
@limiter.limit("10/minute")
def register(
    request: Request,
    user_data: UserRegister,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Create a new user account
    
    - Takes: name, email, password
    - Returns: the created user (without password)
    - Fails if: email already exists
    """
    new_user = register_user(db, user_data)
    background_tasks.add_task(send_verification_bg, new_user.email, new_user.id)
    return new_user


# ── LOGIN ─────────────────────────────────────────────────────────
@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(
    request: Request,
    user_data: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Login and get JWT tokens
    
    - Takes: email, password
    - Returns: access_token + refresh_token
    - Fails if: wrong credentials
    
    The frontend should:
      1. Store access_token in memory (not localStorage)
      2. Store refresh_token in an httpOnly cookie
      3. Send access_token in every API header:
         Authorization: Bearer <access_token>
    """
    result = login_user(db, user_data)

    return {
        "access_token": result["access_token"],
        "refresh_token": result["refresh_token"],
        "token_type": "bearer"
    }


# ── REFRESH TOKEN ─────────────────────────────────────────────────
@router.post("/refresh", response_model=Token)
def refresh_token(body: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    Get a new access token using your refresh token
    
    Called automatically by the frontend when access token expires
    So the user doesn't have to log in again every 30 minutes
    """

    # Verify the refresh token (not access token)
    user_id = verify_token(body.refresh_token, token_type="refresh")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token. Please login again."
        )

    # Make sure user still exists and is active
    user = get_user_by_id(db, user_id)
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account deactivated"
        )

    # Issue brand new tokens
    token_data = {"sub": str(user.id)}
    new_access_token = create_access_token(token_data)

    # We also issue a new refresh token (token rotation — more secure)
    from app.core.security import create_refresh_token
    new_refresh_token = create_refresh_token(token_data)

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


# ── GET CURRENT USER ──────────────────────────────────────────────
@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Get the currently logged-in user's info
    
    This is a protected route — requires valid JWT token
    The frontend calls this on app load to check who's logged in
    """
    return current_user


# ── LOGOUT ────────────────────────────────────────────────────────
@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """
    Logout endpoint
    
    With JWT, logout is mostly handled client-side
    (frontend just deletes the stored tokens)
    In production you'd add token blacklisting here
    """
    return {
        "message": f"Goodbye {current_user.name}! Logged out successfully."
    }

# ── FORGOT PASSWORD ───────────────────────────────────────────────
@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Initiates the forgot-password flow.
    Generates a secure token, saves the hash to DB, and emails the reset link.
    """
    import secrets
    import hashlib
    from datetime import datetime, timedelta
    from app.models.password_reset import PasswordResetToken
    from app.services.email_service import send_password_reset_email
    from app.core.config import settings

    user = db.query(User).filter(User.email == body.email).first()
    if user and user.is_active:
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        expires_at = datetime.utcnow() + timedelta(hours=1)

        reset_token = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at
        )
        db.add(reset_token)
        db.commit()

        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        send_password_reset_email(user.email, reset_link)

    return {"message": "If the email is registered, a password reset link has been sent."}

# ── RESET PASSWORD ────────────────────────────────────────────────
@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Completes the password reset flow.
    Verifies the token, updates the password, and invalidates the token.
    """
    import hashlib
    from datetime import datetime
    from app.models.password_reset import PasswordResetToken
    from app.core.security import hash_password

    token_hash = hashlib.sha256(body.token.encode()).hexdigest()
    reset_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.expires_at > datetime.utcnow(),
        PasswordResetToken.used == False
    ).first()

    if not reset_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token."
        )

    user = db.query(User).filter(User.id == reset_record.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Associated user account is inactive or not found."
        )

    user.password_hash = hash_password(body.new_password)
    reset_record.used = True
    db.commit()

    return {"message": "Password has been reset successfully."}

from pydantic import BaseModel

class VerifyEmailRequest(BaseModel):
    token: str

@router.post("/verify-email")
def verify_email(body: VerifyEmailRequest, db: Session = Depends(get_db)):
    """
    Verifies a user email using verification token.
    """
    user_id = verify_token(body.token, token_type="verification")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token."
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    if user.is_email_verified:
        return {"message": "Email is already verified."}
        
    user.is_email_verified = True
    db.commit()
    return {"message": "Email verified successfully."}


@router.patch("/me", response_model=UserResponse)
def update_profile(
    body: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current user's profile information."""
    if body.name is not None:
        current_user.name = body.name
    if body.whatsapp_number is not None:
        current_user.whatsapp_number = body.whatsapp_number
    if body.company_email is not None:
        current_user.company_email = body.company_email
        
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password")
def change_password(
    body: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Change current user's password."""
    from app.core.security import verify_password, hash_password
    
    if not verify_password(body.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password."
        )
        
    current_user.password_hash = hash_password(body.new_password)
    db.commit()
    return {"message": "Password changed successfully."}