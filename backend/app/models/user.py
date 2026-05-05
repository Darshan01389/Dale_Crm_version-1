# app/models/user.py
# Python ORM representation of the 'users' table in PostgreSQL
# SQLAlchemy reads this and knows exactly how to query the table

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.core.database import Base

class User(Base):
    # This tells SQLAlchemy which table this class maps to
    __tablename__ = "users"

    # Each variable here = one column in the table
    id = Column(
        UUID(as_uuid=True),          # UUID type (unique ID)
        primary_key=True,            # it's the primary key
        default=uuid.uuid4           # auto-generate a UUID if not provided
    )
    name = Column(String, nullable=False)       # required field
    email = Column(String, unique=True, nullable=False)  # must be unique
    password_hash = Column(String, nullable=False)       # never store plain password
    role = Column(String, default="Sales Rep")  # Sales Rep / Team Lead / Owner / Admin
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    max_active_leads = Column(Integer, default=50)
    current_active_leads = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # This is just a helper so when you print a User object you see something useful
    def __repr__(self):
        return f"<User {self.email}>"