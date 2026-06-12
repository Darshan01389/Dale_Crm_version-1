import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String, JSON, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class WebsiteEvent(Base):
    __tablename__ = "website_events"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    session_id = Column(String, nullable=False, index=True)
    lead_id = Column(
        UUID(as_uuid=True),
        ForeignKey("leads.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    
    event_type = Column(String, nullable=False) # e.g. 'pageview', 'click', 'form_submit'
    page_url = Column(String, nullable=True)
    element_id = Column(String, nullable=True)
    metadata_json = Column(JSON, nullable=True) # Any additional context
    
    device_type = Column(String, nullable=True)
    browser = Column(String, nullable=True)
    
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, server_default=text("now()"))

    lead = relationship("Lead", backref="website_events")
