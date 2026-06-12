# app/services/auth_service.py
# This is where the actual logic lives
# Routes call these functions — keeps routes clean and simple

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token


def register_user(db: Session, user_data: UserRegister) -> User:
    """
    Creates a new user in the database
    Steps:
      1. Check if email already exists
      2. Hash the password
      3. Save to DB
    """

    # Step 1 — Check if email already taken
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        # 400 = Bad Request — tell the client what went wrong
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered. Please use a different email."
        )

    # Resolve invite code if present
    team_id = None
    company_id = None
    if user_data.invite_code:
        from app.models.team import Team
        from app.models.company import Company
        
        team = db.query(Team).filter(Team.join_code == user_data.invite_code).first()
        if team:
            team_id = team.id
            company_id = team.company_id
        else:
            company = db.query(Company).filter(Company.join_code == user_data.invite_code).first()
            if company:
                company_id = company.id
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid Organization or Team Join Code. Please verify your invitation."
                )

    # Step 2 — Hash the password (NEVER store plain text)
    hashed = hash_password(user_data.password)

    # Force role to "Sales Rep" if requesting elevated role
    assigned_role = user_data.role or "Sales Rep"
    if assigned_role in ["Owner / Admin", "Sales Admin", "Developer", "developer", "admin", "admin/developers"]:
        assigned_role = "Sales Rep"

    # Step 3 — Create the User object
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hashed,
        role=assigned_role,
        team_id=team_id,
        company_id=company_id
    )

    # Step 4 — Save to database
    db.add(new_user)       # stage the insert
    db.commit()            # actually write to DB
    db.refresh(new_user)   # reload from DB to get auto-generated fields (id, created_at)

    return new_user


def login_user(db: Session, user_data: UserLogin) -> dict:
    """
    Authenticates a user and returns JWT tokens
    Steps:
      1. Find user by email
      2. Verify password
      3. Create access + refresh tokens
    """

    # Step 1 — Find user by email
    user = db.query(User).filter(User.email == user_data.email).first()

    # Step 2 — Check password
    # We check BOTH at the same time to prevent timing attacks
    # (if we returned "user not found" vs "wrong password" separately,
    #  attackers could use that to enumerate valid emails)
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact your admin."
        )

    # Check if email is verified
    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address before logging in."
        )

    # Step 3 — Create tokens
    # We store user_id in the token as "sub" (standard JWT claim)
    token_data = {"sub": str(user.id)}

    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }


def get_user_by_id(db: Session, user_id: str) -> User:
    """
    Fetches a user from DB by their ID
    Used in the /me endpoint to return current user info
    """
    import uuid
    db_user_id = user_id
    if isinstance(user_id, str):
        try:
            db_user_id = uuid.UUID(user_id)
        except ValueError:
            pass
    user = db.query(User).filter(User.id == db_user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user