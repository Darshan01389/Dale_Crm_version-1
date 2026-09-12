# app/models/user.py
# Python ORM representation of the 'users' table in PostgreSQL
# SQLAlchemy reads this and knows exactly how to query the table

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, or_, and_
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.ext.hybrid import hybrid_property
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
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    company_banned = Column(Boolean, default=False)
    banned_team_ids = Column(String, default="")
    is_active = Column(Boolean, default=True)
    is_email_verified = Column(Boolean, default=False)
    whatsapp_number = Column(String(20), nullable=True)  # Company WhatsApp number for Sales/Team Lead
    company_email = Column(String, nullable=True)        # Company Email for outreach
    max_active_leads = Column(Integer, default=50)
    current_active_leads = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    admin_approval_status = Column(String, default="Approved") # "Pending", "Approved", "Rejected"
    approval_request_time = Column(DateTime(timezone=True), nullable=True)
    verification_code = Column(String(6), nullable=True)


    @hybrid_property
    def is_super_admin(self) -> bool:
        return self.role in ["admin", "developer", "admin/developers"] or (self.role == "Owner / Admin" and self.company_id is None)

    @is_super_admin.expression
    def is_super_admin(cls):
        return or_(
            cls.role.in_(["admin", "developer", "admin/developers"]),
            and_(cls.role == "Owner / Admin", cls.company_id.is_(None))
        )

    @hybrid_property
    def is_company_admin(self) -> bool:
        return self.role in ["Owner / Admin", "Sales Admin"] and self.company_id is not None

    @is_company_admin.expression
    def is_company_admin(cls):
        return and_(cls.role.in_(["Owner / Admin", "Sales Admin"]), cls.company_id.is_not(None))

    # This is just a helper so when you print a User object you see something useful
    def __repr__(self):
        return f"<User {self.email}>"