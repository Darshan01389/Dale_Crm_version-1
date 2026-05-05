# app/routes/auth.py
# These are the actual API endpoints the frontend will call
# Each route is thin — it just calls the service and returns the result

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import verify_token, create_access_token
from app.schemas.user import UserRegister, UserLogin, UserResponse, Token, RefreshTokenRequest
from app.services.auth_service import register_user, login_user, get_user_by_id
from app.models.user import User

# APIRouter groups related routes together
# prefix means all routes here start with /auth
router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── REGISTER ─────────────────────────────────────────────────────
@router.post("/register", response_model=UserResponse, status_code=201)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Create a new user account
    
    - Takes: name, email, password
    - Returns: the created user (without password)
    - Fails if: email already exists
    """
    new_user = register_user(db, user_data)
    return new_user


# ── LOGIN ─────────────────────────────────────────────────────────
@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
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