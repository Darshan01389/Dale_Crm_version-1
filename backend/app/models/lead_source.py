import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String, Boolean, JSON, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.types import TypeDecorator

from app.core.database import Base


class EncryptedJSON(TypeDecorator):
    impl = JSON
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None and isinstance(value, dict):
            from app.core.crypt import encrypt_value
            return {
                k: encrypt_value(v) if isinstance(v, str) else v
                for k, v in value.items()
            }
        return value

    def process_result_value(self, value, dialect):
        if value is not None and isinstance(value, dict):
            from app.core.crypt import decrypt_value
            return {
                k: decrypt_value(v) if isinstance(v, str) else v
                for k, v in value.items()
            }
        return value


class LeadSource(Base):
    __tablename__ = "lead_sources"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    platform_type = Column(String, nullable=False)  # 'Website', 'Facebook Ads', 'Custom Webhook', 'CSV'
    status = Column(String, nullable=False, default="Disconnected")
    auth_config = Column(EncryptedJSON, nullable=True) # Store OAuth tokens or API keys encrypted or standard
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

