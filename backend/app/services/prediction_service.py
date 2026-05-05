import json
from uuid import UUID
from datetime import timedelta
from sqlalchemy.orm import Session
from app.models.deal import Deal
from app.models.activity import Activity
from app.models.lead import Lead
from app.ml.predictor import analyze_lead_ml_and_sentiment
from app.schemas.lead import LeadCreate

def predict_deal_outcome(db: Session, deal_id: UUID) -> dict:
    """
    Multi-Modal Prediction Engine core.
    Fuses Voice, WhatsApp, and base ML scores to calculate outcome probability.
    """
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        return {"error": "Deal not found"}

    reasons = []

    # 1. Base ML Score (from Lead)
    base_probability = 0.0
    if deal.lead_id:
        lead = db.query(Lead).filter(Lead.id == deal.lead_id).first()
        if lead:
            # We map DB lead to LeadCreate schema to use predictor
            lead_sch = LeadCreate(
                company_id=lead.company_id,
                name=lead.name,
                title=lead.title or "",
                email=lead.email or "",
                phone=lead.phone or "",
                lead_source=lead.lead_source or "unknown",
                industry=lead.industry or "",
                status=lead.status or "new",
                notes=lead.notes or ""
            )
            analysis = analyze_lead_ml_and_sentiment(lead_sch)
            if analysis.get("ml") and "blended_score" in analysis["ml"]:
                base_probability = analysis["ml"]["blended_score"]
                reasons.append(f"Base ML Engine calculated a {base_probability:.1f}% probability based on historical patterns.")
    
    if base_probability == 0.0:
        base_probability = deal.probability
        reasons.append(f"Using default deal probability of {deal.probability:.1f}%.")

    dynamic_prob = base_probability
    
    # Expected close date modifier
    expected_close_date = deal.expected_close_date
    date_modifier = 0

    # 2. Voice Tone Adjustments
    calls = db.query(Activity).filter(Activity.deal_id == deal_id, Activity.activity_type == 'call').all()
    if calls:
        positive_tones = 0
        negative_tones = 0
        for call in calls:
            if call.extra_metadata:
                try:
                    meta = json.loads(call.extra_metadata)
                    tone = str(meta.get("tone", "")).lower()
                    if "confident" in tone or "excited" in tone or "positive" in tone:
                        positive_tones += 1
                    elif "hesitant" in tone or "negative" in tone or "angry" in tone:
                        negative_tones += 1
                except json.JSONDecodeError:
                    pass
        
        if positive_tones > negative_tones:
            diff = positive_tones - negative_tones
            adjustment = min(diff * 5.0, 15.0)  # Max +15% from voice
            dynamic_prob += adjustment
            reasons.append(f"Voice Tone Intelligence: Detected positive language in {positive_tones} call(s). Increased probability by +{adjustment:.1f}%.")
        elif negative_tones > positive_tones:
            diff = negative_tones - positive_tones
            adjustment = min(diff * 5.0, 15.0) # Max -15% from voice
            dynamic_prob -= adjustment
            reasons.append(f"Voice Tone Intelligence: Detected hesitation/negative language in {negative_tones} call(s). Decreased probability by -{adjustment:.1f}%.")
            date_modifier += 5 # push it back by 5 days
            

    # 3. WhatsApp Messaging Signals
    wa_msgs = db.query(Activity).filter(Activity.deal_id == deal_id, Activity.activity_type == 'whatsapp_message').all()
    if wa_msgs:
        wa_count = len(wa_msgs)
        if wa_count > 5:
            dynamic_prob += 10.0
            date_modifier -= 3 # Urgency pulls date forward
            reasons.append(f"WhatsApp Intelligence: High engagement ({wa_count} messages) signals urgency. Increased probability by +10.0% and pulled expected close date closer.")
        elif wa_count > 0:
            dynamic_prob += 3.0
            reasons.append(f"WhatsApp Intelligence: Active conversation detected. Increased probability by +3.0%.")

    # Clamp the dynamic probability
    dynamic_prob = max(0.0, min(99.9, dynamic_prob))

    # Calculate new close date
    predicted_close_date = expected_close_date
    if expected_close_date and date_modifier != 0:
        predicted_close_date = expected_close_date + timedelta(days=date_modifier)

    return {
        "deal_id": deal_id,
        "base_ml_probability": round(base_probability, 2),
        "multi_modal_probability": round(dynamic_prob, 2),
        "expected_value": deal.amount,
        "original_close_date": expected_close_date,
        "predicted_close_date": predicted_close_date,
        "reasons": reasons
    }
