import json
from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status, BackgroundTasks
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
    
    # 1. Admin/Developers (global super-admins) can see everything
    if user.role in ["admin", "developer", "admin/developers", "Developer"] or (user.role == "Owner / Admin" and user.company_id is None):
        return lead
        
    # 2. Company Accounts can see leads strictly belonging to their company
    if user.role in ["Owner / Admin", "Sales Admin", "Company"] and user.company_id is not None:
        if lead.company_id == user.company_id:
            return lead
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to access leads outside your company",
        )
        
    # 3. Managers/Team Leads can see their own + team's leads inside their company
    if user.role in ["Team Lead", "Manager"]:
        if user.team_id:
            lead_owner = lead.owner
            if lead_owner and lead_owner.team_id == user.team_id:
                return lead
        elif user.company_id and lead.company_id == user.company_id:
            return lead

    # 4. Salespersons (Sales Reps) can only see their own assigned leads
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


def create_lead(db: Session, user: User, data: LeadCreate, background_tasks: BackgroundTasks = None) -> Lead:
    # 1. Create lead immediately with basic data
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
    # Set default values for analysis fields to avoid null issues in UI
    row.ai_score = None
    row.ai_score_summary = "AI analysis in progress..."
    
    db.add(row)
    db.commit()
    db.refresh(row)

    # 2. Schedule heavy AI work in background (Analysis + WhatsApp)
    if background_tasks:
        background_tasks.add_task(_async_lead_ai_processing, row.id, user.id, data)
    
    return row

def _async_lead_ai_processing(lead_id: UUID, user_id: UUID, data: LeadCreate):
    from app.core.database import SessionLocal
    from app.models.lead import Lead
    from app.models.user import User
    
    db = SessionLocal()
    try:
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        user = db.query(User).filter(User.id == user_id).first()
        if not lead or not user:
            print(f"[Background Task] Error: Lead {lead_id} or User {user_id} not found.")
            return
            
        print(f"[Background Task] Starting AI processing for lead: {lead.title}")
        
        # 1. Run heavy analysis (LLM Call)
        try:
            analysis = analyze_new_lead(data)
            _apply_analysis_to_lead(lead, analysis)
            db.commit()
            print(f"[Background Task] AI Analysis complete for lead: {lead.title}")
        except Exception as e:
            print(f"[Background Task] AI Analysis failed: {e}")
            # Continue to WhatsApp even if analysis fails
        
        # 2. Auto-send initial WhatsApp outreach (LLM + External API)
        if lead.phone:
            try:
                _auto_send_initial_whatsapp(db, lead, user)
                # _auto_send_initial_whatsapp now handles its own commit
                print(f"[Background Task] Auto-WhatsApp complete for lead: {lead.title}")
            except Exception as exc:
                print(f"[Background Task] Auto-WhatsApp failed: {exc}")
    except Exception as general_exc:
        print(f"[Background Task] General failure: {general_exc}")
    finally:
        db.close()


def _auto_send_initial_whatsapp(db: Session, lead: Lead, user: User) -> None:
    """
    Automatically generates and sends the first WhatsApp outreach message
    to a new lead using Llama 3.1 (via openai_message_service).
    Saves the message to the activities table so it appears on the interaction chart.
    Works in both demo mode and live mode.
    """
    sentiment = SentimentResult(
        label=lead.sentiment_label or "neutral",
        compound=float(lead.sentiment_compound or 0.0),
        pos=0.0,
        neu=1.0,
        neg=0.0,
    )
    message = generate_whatsapp_message(lead, sentiment, purpose="initial outreach")
    result = send_whatsapp_message(lead, message)

    lead.whatsapp_last_sent_at = datetime.utcnow()
    lead.notification_attempts = 1
    lead.whatsapp_status = "sent" if result.get("success") else "failed"
    lead.whatsapp_delivery_status = result.get("delivery_status") or result.get("error")
    lead.last_contacted_at = datetime.utcnow()
    db.add(lead)

    activity = Activity(
        owner_id=user.id,
        lead_id=lead.id,
        activity_type="whatsapp",
        subject="Initial WhatsApp Outreach (Auto-sent)",
        body=message,
        extra_metadata=json.dumps({
            **result,
            "direction": "outbound",
            "auto_sent": True,
            "company_number": user.whatsapp_number,
            "lead_number": lead.phone,
        }),
    )
    db.add(activity)
    db.commit()
    print(f"[WhatsApp Auto-Send] ✅ Sent and logged activity for lead '{lead.title}'")


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

    # Auto-send initial WhatsApp for ingested leads from any platform
    if row.phone:
        try:
            _auto_send_initial_whatsapp(db, row, user)
        except Exception as exc:
            print(f"[WhatsApp Auto-Send] Failed for ingested lead {row.id}: {exc}")

    return row


def list_priority_leads(
    db: Session,
    user: User,
    *,
    limit: int = 50,
) -> list[Lead]:
    q = db.query(Lead)
    
    # 1. Salespersons (Sales Reps) can only list their own leads
    if user.role in ["Sales Rep", "Sales"]:
        q = q.filter(Lead.owner_id == user.id)
        
    # 2. Managers/Team Leads can see leads of their team members (or fall back to company scope)
    elif user.role in ["Team Lead", "Manager"]:
        if user.team_id:
            member_ids = db.query(User.id).filter(User.team_id == user.team_id).all()
            member_ids = [m[0] for m in member_ids]
            q = q.filter(Lead.owner_id.in_(member_ids))
        elif user.company_id:
            company_user_ids = db.query(User.id).filter(User.company_id == user.company_id).all()
            company_user_ids = [u[0] for u in company_user_ids]
            q = q.filter(Lead.owner_id.in_(company_user_ids))
        else:
            q = q.filter(Lead.owner_id == user.id)
            
    # 3. Company Accounts can see leads strictly belonging to their company
    elif user.role in ["Owner / Admin", "Sales Admin", "Company"] and user.company_id is not None:
        company_user_ids = db.query(User.id).filter(User.company_id == user.company_id).all()
        company_user_ids = [u[0] for u in company_user_ids]
        q = q.filter(Lead.owner_id.in_(company_user_ids))
        
    # 4. Admin/Developers (global super-admins) see all leads without any filtering

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
        raise HTTPException(status_code=404, detail="Lead not found")

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
    
    # 1. Salespersons (Sales Reps) can only list their officially assigned leads
    if user.role in ["Sales Rep", "Sales"]:
        q = q.filter(Lead.assigned_to == user.id)
        
    # 2. Managers/Team Leads can see leads of their team members (or fall back to company scope)
    elif user.role in ["Team Lead", "Manager"]:
        if user.team_id:
            member_ids = db.query(User.id).filter(User.team_id == user.team_id).all()
            member_ids = [m[0] for m in member_ids]
            q = q.filter(Lead.owner_id.in_(member_ids))
        elif user.company_id:
            company_user_ids = db.query(User.id).filter(User.company_id == user.company_id).all()
            company_user_ids = [u[0] for u in company_user_ids]
            q = q.filter(Lead.owner_id.in_(company_user_ids))
        else:
            q = q.filter(Lead.owner_id == user.id)
            
    # 3. Company Accounts can see leads strictly belonging to their company
    elif user.role in ["Owner / Admin", "Sales Admin", "Company"] and user.company_id is not None:
        company_user_ids = db.query(User.id).filter(User.company_id == user.company_id).all()
        company_user_ids = [u[0] for u in company_user_ids]
        q = q.filter(Lead.owner_id.in_(company_user_ids))
        
    # 4. Admin/Developers (global super-admins) see all leads without any filtering

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


_AI_SUMMARY_CACHE = {}


def get_lead_report(db: Session, lead_id: UUID, user: User, use_strategy: bool = True):
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
        
    # In-memory cache key incorporating lead state, activity counts, and strategy toggle
    cache_key = (
        str(lead.id),
        lead.updated_at.isoformat() if lead.updated_at else "",
        len(activities),
        len(recordings),
        use_strategy
    )
    
    if cache_key in _AI_SUMMARY_CACHE:
        ai_summary = _AI_SUMMARY_CACHE[cache_key]
        print(f"[AI Summary Cache] HIT (strategy={use_strategy}) for lead {lead.title}")
    else:
        print(f"[AI Summary Cache] MISS (strategy={use_strategy}) for lead {lead.title} - Generating new AI summary...")
        from app.services.openai_message_service import generate_ai_summary
        ai_summary = generate_ai_summary(lead, activities, recordings, use_strategy=use_strategy)
        _AI_SUMMARY_CACHE[cache_key] = ai_summary
    
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
