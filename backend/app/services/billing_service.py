from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List

from app.models.billing import SubscriptionPlan, CompanySubscription, Invoice
from app.schemas.billing import CompanySubscriptionBase

def get_or_create_default_plans(db: Session) -> List[SubscriptionPlan]:
    plans = db.query(SubscriptionPlan).all()
    if not plans:
        basic = SubscriptionPlan(name="Basic", base_price=99.0, max_requests_per_minute=10, has_voice_transcription=False, has_advanced_lead_sources=False)
        pro = SubscriptionPlan(name="Pro", base_price=299.0, max_requests_per_minute=20, has_voice_transcription=True, has_advanced_lead_sources=True)
        custom = SubscriptionPlan(name="Custom", base_price=0.0, max_requests_per_minute=0, has_voice_transcription=False, has_advanced_lead_sources=False)
        db.add_all([basic, pro, custom])
        db.commit()
        return [basic, pro, custom]
    return plans

def subscribe_company(db: Session, company_id: int, sub_data: CompanySubscriptionBase) -> CompanySubscription:
    sub = db.query(CompanySubscription).filter(CompanySubscription.company_id == company_id).first()
    if not sub:
        sub = CompanySubscription(company_id=company_id)
        db.add(sub)

    sub.plan_id = sub_data.plan_id
    sub.custom_price = sub_data.custom_price
    sub.custom_requests_per_minute = sub_data.custom_requests_per_minute
    sub.custom_voice = sub_data.custom_voice
    sub.custom_lead_sources = sub_data.custom_lead_sources

    # Generate initial invoice
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == sub.plan_id).first()
    amount: float = sub.custom_price if sub.custom_price is not None else (plan.base_price if plan else 0.0)

    invoice = Invoice(company_id=company_id, subscription_id=sub.id, amount_due=amount, status="paid", paid_date=datetime.utcnow())
    db.add(invoice)
    db.commit()
    db.refresh(sub)
    return sub

def increment_ai_usage(db: Session, company_id: int) -> None:
    if not company_id:
        return
    sub = db.query(CompanySubscription).filter(CompanySubscription.company_id == company_id).first()
    if sub:
        sub.ai_requests_used += 1
        db.commit()

def generate_invoice(db: Session, company_id: int) -> Optional[Invoice]:
    sub = db.query(CompanySubscription).filter(CompanySubscription.company_id == company_id).first()
    if not sub:
        return None

    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == sub.plan_id).first()
    base_price: float = sub.custom_price if sub.custom_price is not None else (plan.base_price if plan else 0.0)

    # Overage: $0.05 per request over 10,000 per month
    limit = 10000
    overage_cost: float = 0.0
    if sub.ai_requests_used > limit:
        overage_cost = (sub.ai_requests_used - limit) * 0.05

    total = base_price + overage_cost

    inv = Invoice(
        company_id=company_id,
        subscription_id=sub.id,
        amount_due=total,
        status="pending"
    )
    db.add(inv)

    # Reset usage for next period
    sub.ai_requests_used = 0
    sub.current_period_start = datetime.utcnow()
    sub.current_period_end = datetime.utcnow() + timedelta(days=30)

    db.commit()
    db.refresh(inv)
    return inv
