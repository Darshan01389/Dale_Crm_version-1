import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String, Float, Integer, text
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    platform = Column(String, nullable=False)
    status = Column(String, nullable=False, default="Active") # Active, Paused, Completed
    budget = Column(Float, nullable=True)
    spend = Column(Float, nullable=True, default=0.0)
    leads_generated = Column(Integer, nullable=False, default=0)
    conversions = Column(Integer, nullable=False, default=0)
    revenue_generated = Column(Float, nullable=True, default=0.0)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, server_default=text("now()"))
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=text("now()"),
    )
