from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime

from app.models.lead import Lead
from app.models.utm_tracking import UTMTracking
from app.models.lead_attribution import LeadAttribution

def calculate_lead_attribution(db: Session, lead_id: UUID) -> LeadAttribution:
    """
    Calculates and stores the First-Touch and Last-Touch attribution for a lead.
    """
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        return None

    # Get all UTM tracking for this lead, ordered by time
    utms = db.query(UTMTracking).filter(UTMTracking.lead_id == lead_id).order_by(UTMTracking.created_at.asc()).all()

    attribution = db.query(LeadAttribution).filter(LeadAttribution.lead_id == lead_id).first()
    if not attribution:
        attribution = LeadAttribution(lead_id=lead_id)
        db.add(attribution)

    if utms:
        # First touch is the earliest UTM
        first_touch = utms[0]
        attribution.ft_source = first_touch.utm_source or first_touch.referrer_url or 'Direct'
        attribution.ft_campaign = first_touch.utm_campaign
        
        # Last touch is the latest UTM before conversion
        last_touch = utms[-1]
        attribution.lt_source = last_touch.utm_source or last_touch.referrer_url or 'Direct'
        attribution.lt_campaign = last_touch.utm_campaign

    # If the lead has deal value, assign it as revenue credit
    attribution.revenue_credit = lead.deal_value or 0.0

    db.commit()
    db.refresh(attribution)
    return attribution
