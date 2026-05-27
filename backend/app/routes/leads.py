from uuid import UUID

from fastapi import APIRouter, Depends, Query, BackgroundTasks, File, UploadFile, HTTPException
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
    return {"summary": report["ai_summary_card"]}


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


@router.post("/import")
def import_leads(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Import contacts from CSV or Excel file."""
    import io
    import pandas as pd
    
    content = file.file.read()
    try:
        if file.filename.endswith(".csv") or file.filename.endswith(".txt"):
            df = pd.read_csv(io.BytesIO(content))
        elif file.filename.endswith((".xls", ".xlsx")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Invalid file type. Only CSV and Excel files are supported.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    # Standardize column headers
    df.columns = [str(c).strip().lower() for c in df.columns]

    # Map headers to CRM schema fields
    name_col = next((c for c in df.columns if c in ['title', 'name', 'full name', 'lead name', 'contact name']), None)
    company_col = next((c for c in df.columns if c in ['company', 'organization', 'organisation', 'firm', 'company name']), None)
    email_col = next((c for c in df.columns if c in ['email', 'email address', 'mail']), None)
    phone_col = next((c for c in df.columns if c in ['phone', 'phone number', 'mobile', 'tel', 'contact', 'contact number']), None)
    status_col = next((c for c in df.columns if c in ['status', 'stage', 'lead status']), None)
    source_col = next((c for c in df.columns if c in ['source', 'origin', 'lead source']), None)
    notes_col = next((c for c in df.columns if c in ['notes', 'note', 'description', 'desc', 'comments']), None)
    occupation_col = next((c for c in df.columns if c in ['occupation', 'job', 'role', 'profession', 'job title']), None)
    education_col = next((c for c in df.columns if c in ['education', 'degree', 'qualification']), None)
    age_col = next((c for c in df.columns if c in ['age']), None)
    deal_value_col = next((c for c in df.columns if c in ['deal value', 'deal_value', 'value', 'amount', 'deal amount']), None)

    imported_count = 0
    errors = []

    for index, row in df.iterrows():
        try:
            # Name/title is required. Use "Imported Lead <Index>" if missing.
            title_val = str(row[name_col]).strip() if name_col and pd.notna(row[name_col]) else f"Imported Lead {index + 1}"
            
            company_val = str(row[company_col]).strip() if company_col and pd.notna(row[company_col]) else None
            email_val = str(row[email_col]).strip() if email_col and pd.notna(row[email_col]) else None
            phone_val = str(row[phone_col]).strip() if phone_col and pd.notna(row[phone_col]) else None
            status_val = str(row[status_col]).strip() if status_col and pd.notna(row[status_col]) else "new"
            source_val = str(row[source_col]).strip() if source_col and pd.notna(row[source_col]) else "CSV/Excel Import"
            notes_val = str(row[notes_col]).strip() if notes_col and pd.notna(row[notes_col]) else None
            occupation_val = str(row[occupation_col]).strip() if occupation_col and pd.notna(row[occupation_col]) else None
            education_val = str(row[education_col]).strip() if education_col and pd.notna(row[education_col]) else None
            
            try:
                age_val = float(row[age_col]) if age_col and pd.notna(row[age_col]) else None
            except:
                age_val = None
                
            try:
                deal_value_val = float(row[deal_value_col]) if deal_value_col and pd.notna(row[deal_value_col]) else None
            except:
                deal_value_val = None

            lead_data = LeadCreate(
                title=title_val[:500],
                company=company_val[:500] if company_val else None,
                email=email_val[:320] if email_val else None,
                phone=phone_val[:64] if phone_val else None,
                status=status_val[:64],
                source=source_val[:200],
                notes=notes_val,
                occupation=occupation_val[:120] if occupation_val else None,
                education=education_val[:120] if education_val else None,
                age=age_val,
                deal_value=deal_value_val
            )
            
            lead_service.create_lead(db, current_user, lead_data, background_tasks)
            imported_count += 1
        except Exception as row_err:
            errors.append(f"Row {index + 1}: {str(row_err)}")

    return {"status": "success", "imported": imported_count, "errors": errors}



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
