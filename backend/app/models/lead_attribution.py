import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String, Float, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class LeadAttribution(Base):
    """
    Stores attribution data for a lead, calculating which sources contributed
    to their eventual conversion based on various models (First-Touch, Last-Touch, Linear).
    """
    __tablename__ = "lead_attributions"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    lead_id = Column(
        UUID(as_uuid=True),
        ForeignKey("leads.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    
    # First-Touch (How they originally found us)
    ft_source = Column(String, nullable=True)
    ft_campaign = Column(String, nullable=True)
    
    # Last-Touch (What finally converted them)
    lt_source = Column(String, nullable=True)
    lt_campaign = Column(String, nullable=True)

    # Attribution Weighting (For Multi-touch models, storing calculated revenue credit)
    revenue_credit = Column(Float, nullable=False, default=0.0)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, server_default=text("now()"))
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=text("now()"),
    )

    lead = relationship("Lead", backref="attribution")
