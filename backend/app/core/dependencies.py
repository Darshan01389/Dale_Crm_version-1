# app/core/dependencies.py
# These are "guards" — functions that run BEFORE your route logic
# If the token is missing or invalid, they stop the request immediately

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_token
from app.services.auth_service import get_user_by_id
from app.models.user import User

# This tells FastAPI to look for a Bearer token in the Authorization header
bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    This function runs before any protected route
    It extracts and validates the JWT token from the request header

    Usage in routes:
        @router.get("/me")
        def get_me(current_user: User = Depends(get_current_user)):
            return current_user
    """

    token = credentials.credentials  # extract just the token string

    # Verify the token and get user_id
    user_id = verify_token(token, token_type="access")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Load the user from DB
    user = get_user_by_id(db, user_id)
    return user


def get_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Only allows admin users through
    Use this on admin-only routes
    """
    if current_user.role not in ["Owner / Admin", "Sales Admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user