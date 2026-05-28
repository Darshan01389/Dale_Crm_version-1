import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, Date, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class CampaignMetric(Base):
    __tablename__ = "campaign_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    campaign_id = Column(
        UUID(as_uuid=True),
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    date = Column(Date, nullable=False, index=True)
    spend = Column(Float, nullable=False, default=0.0)
    impressions = Column(Integer, nullable=False, default=0)
    clicks = Column(Integer, nullable=False, default=0)
    leads_generated = Column(Integer, nullable=False, default=0)
    conversions = Column(Integer, nullable=False, default=0)
    revenue = Column(Float, nullable=False, default=0.0)
    
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, server_default=text("now()"))
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=text("now()"),
    )

    campaign = relationship("Campaign", backref="daily_metrics")
