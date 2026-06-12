import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class UTMTracking(Base):
    __tablename__ = "utm_tracking"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    lead_id = Column(
        UUID(as_uuid=True),
        ForeignKey("leads.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    session_id = Column(String, nullable=True, index=True) # Used if lead is not yet captured
    
    utm_source = Column(String, nullable=True)
    utm_medium = Column(String, nullable=True)
    utm_campaign = Column(String, nullable=True)
    utm_term = Column(String, nullable=True)
    utm_content = Column(String, nullable=True)
    
    referrer_url = Column(String, nullable=True)
    landing_page = Column(String, nullable=True)
    
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, server_default=text("now()"))

    lead = relationship("Lead", backref="utm_tags")
