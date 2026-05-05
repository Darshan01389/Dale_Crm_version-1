import json
from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.lead import Lead
from app.ml.sentiment_service import SentimentResult
from app.schemas.lead import LeadCreate, LeadIngest, LeadUpdate, WhatsAppFeedback
from app.services.lead_analysis import analyze_new_lead
from app.services.lead_gathering_service import extract_lead_from_raw_text
from app.services.openai_message_service import generate_whatsapp_message
from app.services.whatsapp_service import send_whatsapp_message
from app.models.activity import Activity
from app.models.user import User

_SCORING_FIELDS = frozenset(
    {
        "notes",
        "title",
        "source",
        "occupation",
        "education",
        "age",
        "company",
        "email",
        "phone",
        "status",
    }
)


def _ensure_owner(lead: Lead | None, user: User) -> Lead:
    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )
    
    # Owner / Admin can see everything
    if user.role == "Owner / Admin":
        return lead
        
    # Team Lead can see their own + team's leads
    if user.role == "Team Lead":
        # Check if lead owner is in the same team
        lead_owner = lead.owner
        if lead_owner and lead_owner.team_id == user.team_id:
            return lead

    # Sales Rep (and fallback) can only see their own
    if lead.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to access this lead",
        )
    return lead


def _lead_row_to_create(lead: Lead) -> LeadCreate:
    return LeadCreate(
        title=lead.title,
        company=lead.company,
        email=lead.email,
        phone=lead.phone,
        status=lead.status,
        source=lead.source,
        notes=lead.notes,
        occupation=lead.occupation,
        education=lead.education,
        age=lead.age,
    )


def _apply_analysis_to_lead(lead: Lead, analysis: dict) -> None:
    lead.ai_score = analysis["ai_score"]
    lead.ai_score_summary = analysis["ai_score_summary"]
    lead.sentiment_label = analysis["sentiment_label"]
    lead.sentiment_compound = analysis["sentiment_compound"]
    lead.ml_lead_score = analysis["ml_lead_score"]
    lead.conversion_probability = analysis["conversion_probability"]


def create_lead(db: Session, user: User, data: LeadCreate) -> Lead:
    analysis = analyze_new_lead(data)
    row = Lead(
        owner_id=user.id,
        title=data.title,
        company=data.company,
        email=data.email,
        phone=data.phone,
        status=data.status,
        source=data.source,
        notes=data.notes,
        occupation=data.occupation,
        education=data.education,
        age=data.age,
    )
    _apply_analysis_to_lead(row, analysis)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def ingest_lead(db: Session, user: User, ingest: LeadIngest) -> Lead:
    lead_data = extract_lead_from_raw_text(ingest)
    analysis = analyze_new_lead(lead_data)
    row = Lead(
        owner_id=user.id,
        title=lead_data.title,
        company=lead_data.company,
        email=lead_data.email,
        phone=lead_data.phone,
        status=lead_data.status,
        source=lead_data.source,
        source_platform=lead_data.source_platform,
        notes=lead_data.notes,
        occupation=lead_data.occupation,
        education=lead_data.education,
        age=lead_data.age,
    )
    _apply_analysis_to_lead(row, analysis)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def list_priority_leads(
    db: Session,
    user: User,
    *,
    limit: int = 50,
) -> list[Lead]:
    q = db.query(Lead)
    
    if user.role == "Sales Rep":
        q = q.filter(Lead.owner_id == user.id)
    elif user.role == "Team Lead":
        # Get team member IDs
        if user.team_id:
            member_ids = db.query(User.id).filter(User.team_id == user.team_id).all()
            member_ids = [m[0] for m in member_ids]
            q = q.filter(Lead.owner_id.in_(member_ids))
        else:
            q = q.filter(Lead.owner_id == user.id)
    # Owner / Admin sees all

    q = (
        q.order_by(Lead.ai_score.desc().nullslast(), Lead.notification_attempts.asc(), Lead.updated_at.desc())
        .limit(limit)
    )
    return list(q.all())


def send_whatsapp_for_lead(
    db: Session,
    lead_id: UUID,
    user: User,
    message: str | None = None,
    purpose: str | None = None,
) -> Lead:
    lead = get_lead(db, lead_id, user)
    if not lead.phone:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Lead has no phone number for WhatsApp messaging.")

    if not message:
        sentiment = SentimentResult(
            label=lead.sentiment_label or "neutral",
            compound=float(lead.sentiment_compound or 0.0),
            pos=0.0,
            neu=1.0,
            neg=0.0,
        )
        message = generate_whatsapp_message(lead, sentiment, purpose)

    result = send_whatsapp_message(lead, message)
    lead.whatsapp_last_sent_at = datetime.utcnow()
    lead.notification_attempts = (lead.notification_attempts or 0) + 1
    lead.whatsapp_status = "sent" if result.get("success") else "failed"
    lead.whatsapp_delivery_status = result.get("delivery_status") or result.get("error")
    lead.last_contacted_at = datetime.utcnow()
    db.add(lead)
    db.commit()
    db.refresh(lead)

    activity = Activity(
        owner_id=user.id,
        lead_id=lead.id,
        activity_type="whatsapp",
        subject="WhatsApp outreach",
        body=message,
        extra_metadata=json.dumps(result),
    )
    db.add(activity)
    db.commit()
    return lead


def track_whatsapp_feedback(
    db: Session,
    lead_id: UUID,
    user: User,
    feedback: WhatsAppFeedback,
) -> Lead:
    lead = get_lead(db, lead_id, user)
    if feedback.delivery_status:
        lead.whatsapp_delivery_status = feedback.delivery_status
    if feedback.seen_status:
        lead.last_seen_status = feedback.seen_status
    if feedback.open_status:
        lead.last_open_status = feedback.open_status
    if feedback.website_visited:
        lead.website_visits = (lead.website_visits or 0) + 1
        lead.last_website_visit_at = datetime.utcnow()

    lead.last_contacted_at = datetime.utcnow()
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead

def assign_lead(db: Session, lead_id, user_id, current_user_id):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()

    if not lead:
        raise Exception("Lead not found")

    lead.assigned_to = user_id
    db.commit()
    db.refresh(lead)

    return lead

def list_leads(
    db: Session,
    user: User,
    *,
    skip: int = 0,
    limit: int = 50,
) -> list[Lead]:
    q = db.query(Lead)
    
    if user.role == "Sales Rep":
        q = q.filter(Lead.owner_id == user.id)
    elif user.role == "Team Lead":
        if user.team_id:
            member_ids = db.query(User.id).filter(User.team_id == user.team_id).all()
            member_ids = [m[0] for m in member_ids]
            q = q.filter(Lead.owner_id.in_(member_ids))
        else:
            q = q.filter(Lead.owner_id == user.id)
    # Owner / Admin sees all

    q = (
        q.order_by(Lead.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(q.all())


def get_lead(db: Session, lead_id: UUID, user: User) -> Lead:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    return _ensure_owner(lead, user)


def update_lead(
    db: Session,
    lead_id: UUID,
    user: User,
    data: LeadUpdate,
) -> Lead:
    lead = get_lead(db, lead_id, user)
    updates = data.model_dump(exclude_unset=True)
    needs_rescore = bool(_SCORING_FIELDS & updates.keys())
    for field, value in updates.items():
        setattr(lead, field, value)
    if needs_rescore:
        analysis = analyze_new_lead(_lead_row_to_create(lead))
        _apply_analysis_to_lead(lead, analysis)
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


def delete_lead(db: Session, lead_id: UUID, user: User) -> None:
    lead = get_lead(db, lead_id, user)
    db.delete(lead)
    db.commit()


def get_lead_report(db: Session, lead_id: UUID, user: User):
    lead = get_lead(db, lead_id, user)
    
    # Fetch activities
    activities = db.query(Activity).filter(Activity.lead_id == lead.id).order_by(Activity.occurred_at.desc()).all()
    
    # Fetch voice recordings
    from app.models.voice_recording import VoiceRecording
    recordings = db.query(VoiceRecording).filter(VoiceRecording.lead_id == lead.id).order_by(VoiceRecording.occurred_at.desc()).all()
    
    # Basic Risk Assessment logic
    risk_assessment = "Low Risk"
    if lead.ai_score is not None and lead.ai_score < 40:
        risk_assessment = "High Risk: Low Engagement Score"
    elif lead.sentiment_label == "negative":
        risk_assessment = "High Risk: Negative Sentiment Detected"
        
    from app.services.openai_message_service import generate_ai_summary
    
    # Generate real-time AI summary or use cached if performance is an issue
    # For MVP/Enterprise, we generate it on the fly or we could cache it in DB. Let's do on-the-fly.
    ai_summary = generate_ai_summary(lead, activities, recordings)
    
    return {
        "lead": lead,
        "activities": activities,
        "voice_recordings": recordings,
        "interaction_count": len(activities) + len(recordings),
        "ai_risk_assessment": risk_assessment,
        "ai_summary_card": ai_summary
    }


def refresh_lead_analysis(db: Session, lead: Lead) -> None:

    """Recompute ML + sentiment for a lead row (used by background jobs)."""
    analysis = analyze_new_lead(_lead_row_to_create(lead))
    _apply_analysis_to_lead(lead, analysis)
    db.add(lead)
    db.commit()
