import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String, Boolean, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class AIRecommendation(Base):
    """
    Stores AI-generated insights and recommendations for marketing optimization.
    """
    __tablename__ = "ai_recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    campaign_id = Column(
        UUID(as_uuid=True),
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    
    insight_type = Column(String, nullable=False) # e.g., 'PAUSE', 'SCALE', 'AUDIENCE_INSIGHT'
    message = Column(String, nullable=False)
    is_implemented = Column(Boolean, default=False)
    is_dismissed = Column(Boolean, default=False)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, server_default=text("now()"))

    campaign = relationship("Campaign", backref="ai_recommendations")
