import uuid
from datetime import datetime, timedelta

from sqlalchemy import Column, DateTime, String, Boolean, Float, Integer, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    name = Column(String, nullable=False, unique=True) # Basic, Pro, Custom
    base_price = Column(Float, nullable=False, default=0.0)
    
    max_requests_per_minute = Column(Integer, nullable=False, default=10)
    has_voice_transcription = Column(Boolean, default=False)
    has_advanced_lead_sources = Column(Boolean, default=False)
    
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, server_default=text("now()"))

class CompanySubscription(Base):
    __tablename__ = "company_subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, unique=True)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("subscription_plans.id", ondelete="RESTRICT"), nullable=False)
    
    status = Column(String, default="active") # active, past_due, canceled
    
    current_period_start = Column(DateTime, nullable=False, default=datetime.utcnow)
    current_period_end = Column(DateTime, nullable=False, default=lambda: datetime.utcnow() + timedelta(days=30))
    
    # Custom plan overrides
    custom_price = Column(Float, nullable=True)
    custom_requests_per_minute = Column(Integer, nullable=True)
    custom_voice = Column(Boolean, nullable=True)
    custom_lead_sources = Column(Boolean, nullable=True)

    # Usage tracking for the current period
    ai_requests_used = Column(Integer, default=0)

    company = relationship("Company", backref="subscription")
    plan = relationship("SubscriptionPlan")

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("company_subscriptions.id", ondelete="SET NULL"), nullable=True)
    
    amount_due = Column(Float, nullable=False)
    status = Column(String, default="pending") # pending, paid
    
    billing_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    paid_date = Column(DateTime, nullable=True)
    
    download_url = Column(String, nullable=True)

    company = relationship("Company", backref="invoices")
