import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String, Boolean, JSON, text
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class LeadSource(Base):
    __tablename__ = "lead_sources"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    platform_type = Column(String, nullable=False)  # 'Website', 'Facebook Ads', 'Custom Webhook', 'CSV'
    status = Column(String, nullable=False, default="Disconnected")
    auth_config = Column(JSON, nullable=True) # Store OAuth tokens or API keys encrypted or standard
    field_mapping = Column(JSON, nullable=True) # Mapping external fields to CRM lead fields
    sync_schedule = Column(String, nullable=True, default="Manual") # Real-time, Hourly, Daily, Manual
    last_sync_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, server_default=text("now()"))
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=text("now()"),
    )
