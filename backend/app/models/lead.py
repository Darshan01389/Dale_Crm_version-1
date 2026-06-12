import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Lead(Base):
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    owner_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String, nullable=False)
    lead_company_name = Column(String, nullable=True) # legacy/initial field
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    status = Column(String, nullable=False, default="new")
    source = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    occupation = Column(String, nullable=True)
    education = Column(String, nullable=True)
    age = Column(Float, nullable=True)
    source_platform = Column(String, nullable=True)
    whatsapp_status = Column(String, nullable=True)
    whatsapp_last_sent_at = Column(DateTime, nullable=True)
    whatsapp_delivery_status = Column(String, nullable=True)
    notification_attempts = Column(Integer, nullable=False, default=0)
    website_visits = Column(Integer, nullable=False, default=0)
    last_website_visit_at = Column(DateTime, nullable=True)
    last_seen_status = Column(String, nullable=True)
    last_open_status = Column(String, nullable=True)
    last_contacted_at = Column(DateTime, nullable=True)
    priority_rank = Column(Integer, nullable=True)
    category = Column(String, nullable=True, default="Warm")
    risk_flag = Column(Boolean, nullable=False, default=False)
    intent_level = Column(String, nullable=True)
    ai_personalized_msg = Column(Text, nullable=True)
    ai_score = Column(Float, nullable=True)
    ai_score_summary = Column(Text, nullable=True)
    sentiment_label = Column(String, nullable=True)
    sentiment_compound = Column(Float, nullable=True)
    ml_lead_score = Column(Float, nullable=True)
    conversion_probability = Column(Float, nullable=True)
    deal_value = Column(Float, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, server_default=text("now()"))
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=text("now()"),
    )
    assigned_to = Column(
    UUID(as_uuid=True),
    ForeignKey("users.id"),
    nullable=True
    )

    owner = relationship("User", backref="leads", foreign_keys=[owner_id])
    assigned_user = relationship("User", foreign_keys=[assigned_to], backref="assigned_leads")
    linked_company = relationship("Company", back_populates="leads")
    
    @property
    def company(self):
        if self.linked_company:
            return self.linked_company.name
        return self.lead_company_name

    @company.setter
    def company(self, value):
        self.lead_company_name = value
