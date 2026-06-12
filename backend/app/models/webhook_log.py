import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String, JSON, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class WebhookLog(Base):
    __tablename__ = "webhook_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    source_id = Column(
        UUID(as_uuid=True),
        ForeignKey("lead_sources.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    payload = Column(JSON, nullable=False)
    status = Column(String, nullable=False) # 'Processed', 'Failed', 'Pending'
    error_message = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, server_default=text("now()"))
