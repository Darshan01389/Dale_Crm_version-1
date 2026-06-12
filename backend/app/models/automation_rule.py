import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String, Boolean, JSON, text
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class AutomationRule(Base):
    """
    Stores automation triggers and actions.
    E.g. IF condition_json matches lead THEN execute action_type with action_payload
    """
    __tablename__ = "automation_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    
    is_active = Column(Boolean, default=True)
    
    # Trigger Conditions (e.g. {"field": "source", "operator": "equals", "value": "FacebookAds"})
    conditions = Column(JSON, nullable=False)
    
    # Action (e.g. 'assign_to_user', 'change_status', 'send_email')
    action_type = Column(String, nullable=False)
    
    # Payload for the action (e.g. {"user_id": "1234..."})
    action_payload = Column(JSON, nullable=False)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, server_default=text("now()"))
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=text("now()"),
    )
