# app/core/security.py
# Two jobs:
#   1. Hash passwords (so we never store plain text)
#   2. Create and verify JWT tokens

from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from app.core.config import settings

# ── PASSWORD HASHING ──────────────────────────────────────────────
# Use pbkdf2_sha256 for broad compatibility across environments.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def hash_password(plain_password: str) -> str:
    """
    Converts 'mypassword123' → '$2b$12$abc...xyz' (unreadable hash)
    We store the hash, never the original password
    """
    return pwd_context.hash(plain_password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Checks if 'mypassword123' matches the stored hash
    Returns True if correct, False if wrong
    """
    return pwd_context.verify(plain_password, hashed_password)


# ── JWT TOKEN CREATION ────────────────────────────────────────────
def create_access_token(data: dict) -> str:
    """
    Creates a short-lived token (30 mins by default)
    The frontend sends this in every API request header
    """
    to_encode = data.copy()

    # Token expires in 30 minutes
    expire = datetime.utcnow() + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire, "type": "access"})

    # Sign the token with our secret key
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """
    Creates a long-lived token (7 days by default)
    Used to get a new access token without re-logging in
    """
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    to_encode.update({"exp": expire, "type": "refresh"})

    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(token: str, token_type: str = "access") -> Optional[str]:
    """
    Checks if a token is valid and not expired
    Returns the user_id if valid, None if invalid
    """
    try:
        # Decode the token using our secret key
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        # Check it's the right type of token
        if payload.get("type") != token_type:
            return None

        # Extract the user_id we stored in the token
        user_id: str = payload.get("sub")
        return user_id

    except JWTError:
        # Token is invalid, expired, or tampered with
        return None