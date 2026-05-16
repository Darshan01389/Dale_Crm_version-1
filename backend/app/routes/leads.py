from uuid import UUID

from fastapi import APIRouter, Depends, Query, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.lead import LeadCreate, LeadResponse, LeadUpdate, LeadIngest, WhatsAppMessageRequest, WhatsAppFeedback, LeadReportResponse

from app.services import lead_service

router = APIRouter(prefix="/leads", tags=["Leads"])


@router.get("/{lead_id}/report", response_model=LeadReportResponse)
def get_lead_report(
    lead_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a comprehensive report for a lead including activities and recordings."""
    return lead_service.get_lead_report(db, lead_id, current_user)

@router.get("/{lead_id}/ai-suggest")
def suggest_reply(
    lead_id: UUID,
    channel: str = "whatsapp",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate an AI drafted response based on timeline history and channel."""
    report = lead_service.get_lead_report(db, lead_id, current_user)
    from app.services.openai_message_service import ai_suggest_reply
    result = ai_suggest_reply(report["lead"], report["activities"], report["voice_recordings"], channel)
    return result # result will be {"draft": "...", "subject": "..."}


@router.get("/{lead_id}/summary")
def get_lead_summary(
    lead_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a concise AI summary and next step for the lead."""
    report = lead_service.get_lead_report(db, lead_id, current_user)
    from app.services.openai_message_service import generate_ai_summary
    summary = generate_ai_summary(report["lead"], report["activities"], report["voice_recordings"])
    return {"summary": summary}


@router.post("/{lead_id}/assign/{user_id}")
def assign_lead(
    lead_id: UUID,
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return lead_service.assign_lead(db, lead_id, user_id, current_user.id)

@router.post("/{lead_id}/request-manager")
def request_manager(
    lead_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Called by a Sales Rep when a lead wants to talk to a Manager.
    Creates a high-priority task for the first available manager in the system.
    """
    lead = lead_service.get_lead(db, lead_id, current_user)
    
    # Find a manager (Owner / Admin or Team Lead)
    manager = db.query(User).filter(User.role.in_(["Owner / Admin", "Team Lead"]), User.is_active == True).first()
    if not manager:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="No manager found to assign this request to.")
    
    # Create a task for the manager
    from app.models.task import Task
    task = Task(
        user_id=manager.id,
        lead_id=lead.id,
        title=f"📞 Manager Intervention: {lead.title}",
        description=f"Prospect requested to speak with a manager. Lead is currently handled by {current_user.name}.",
        priority="High",
        task_type="Manager Call"
    )
    db.add(task)
    
    # Log activity
    from app.models.activity import Activity
    activity = Activity(
        lead_id=lead.id,
        activity_type="Manager Requested",
        subject="Lead requested manager interaction",
        body=f"Sales rep {current_user.name} flagged this lead for manager intervention."
    )
    db.add(activity)
    
    db.commit()
    return {"status": "success", "message": f"Manager {manager.name} has been notified."}

from app.services.ai_distribution import AIDistributionService
from pydantic import BaseModel
from typing import List

class AIDistributeRequest(BaseModel):
    lead_ids: List[UUID]

@router.post("/distribute-ai")
def distribute_leads_ai(
    body: AIDistributeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Distribute leads using AI matching and capacity management."""
    if current_user.role not in ["Owner / Admin", "Team Lead"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Only managers can distribute leads.")
    return AIDistributionService.distribute_leads(db, [str(lid) for lid in body.lead_ids], str(current_user.id))

@router.post("", response_model=LeadResponse, status_code=201)
def create_lead(
    body: LeadCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a lead. AI (or heuristic) scoring runs automatically on create."""
    return lead_service.create_lead(db, current_user, body, background_tasks)


@router.get("", response_model=list[LeadResponse])
def list_leads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    return lead_service.list_leads(db, current_user, skip=skip, limit=limit)


@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(
    lead_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return lead_service.get_lead(db, lead_id, current_user)


@router.patch("/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: UUID,
    body: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return lead_service.update_lead(db, lead_id, current_user, body)


@router.delete("/{lead_id}", status_code=204)
def delete_lead(
    lead_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead_service.delete_lead(db, lead_id, current_user)


@router.post("/ingest", response_model=LeadResponse, status_code=201)
def ingest_lead(
    body: LeadIngest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ingest a lead from raw text using AI extraction."""
    return lead_service.ingest_lead(db, current_user, body)


@router.get("/priority", response_model=list[LeadResponse])
def list_priority_leads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100),
):
    """List leads prioritized by AI score and engagement."""
    return lead_service.list_priority_leads(db, current_user, limit=limit)


@router.post("/{lead_id}/whatsapp", response_model=LeadResponse)
def send_whatsapp_message(
    lead_id: UUID,
    body: WhatsAppMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a WhatsApp message to a lead."""
    return lead_service.send_whatsapp_for_lead(
        db, lead_id, current_user, body.message, body.purpose
    )


@router.post("/{lead_id}/whatsapp/feedback", response_model=LeadResponse)
def track_whatsapp_feedback(
    lead_id: UUID,
    body: WhatsAppFeedback,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Track WhatsApp message feedback and engagement."""
    return lead_service.track_whatsapp_feedback(db, lead_id, current_user, body)
