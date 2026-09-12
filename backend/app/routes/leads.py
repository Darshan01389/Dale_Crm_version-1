import csv
import io
from uuid import UUID

from fastapi import APIRouter, Depends, Query, BackgroundTasks, File, UploadFile, HTTPException, Request, Form
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, check_ai_quota
from app.core.limiter import limiter
from app.models.user import User
from app.schemas.lead import LeadCreate, LeadResponse, LeadUpdate, LeadIngest, WhatsAppMessageRequest, WhatsAppFeedback, LeadReportResponse

from app.services import lead_service

router = APIRouter(prefix="/leads", tags=["Leads"])


@router.get("/export/csv")
def export_leads_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: str | None = Query(None),
    status: str | None = Query(None),
    source: str | None = Query(None),
    company_id: int | None = Query(None),
):
    """Export leads as a formatted CSV file."""
    leads = lead_service.list_leads(
        db, current_user, skip=0, limit=2000,
        search=search, status=status, source=source,
        company_id=company_id
    )
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Lead ID", "Title / Name", "Contact Person", "Phone", "Email", 
        "Company", "Status", "Deal Value (INR)", "AI Score", "ML Score", 
        "Sentiment", "Lead Source", "Created Date"
    ])
    
    for l in leads:
        writer.writerow([
            str(l.id),
            l.title or "",
            l.name or "",
            l.phone or "",
            l.email or "",
            l.company or "",
            l.status or "new",
            float(l.deal_value or 0.0),
            round(float(l.ai_score or 0.0), 1),
            round(float(l.ml_lead_score or 0.0), 1) if l.ml_lead_score is not None else "",
            l.sentiment_label or "neutral",
            l.source or "Direct",
            l.created_at.strftime("%Y-%m-%d %H:%M") if l.created_at else ""
        ])
        
    csv_bytes = output.getvalue().encode("utf-8")
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leads_export.csv"}
    )


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
    _quota: None = Depends(check_ai_quota),
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
    _quota: None = Depends(check_ai_quota),
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
    
    # Find a manager (Owner / Admin, Team Lead, Manager, or Sales Admin) in the same company first
    manager = db.query(User).filter(
        User.company_id == current_user.company_id,
        User.role.in_(["Owner / Admin", "Team Lead", "Manager", "Sales Admin"]),
        User.is_active == True
    ).first()
    
    # Fallback to any active manager in the system
    if not manager:
        manager = db.query(User).filter(
            User.role.in_(["Owner / Admin", "Team Lead", "Manager", "Sales Admin"]),
            User.is_active == True
        ).first()

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
    if current_user.role not in ["Owner / Admin", "Team Lead", "Manager", "Sales Admin", "admin", "admin/developers"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Only managers can distribute leads.")
    return AIDistributionService.distribute_leads(db, [str(lid) for lid in body.lead_ids], str(current_user.id))

@router.post("", response_model=LeadResponse, status_code=201)
@limiter.limit("30/minute")
def create_lead(
    request: Request,
    body: LeadCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _quota: None = Depends(check_ai_quota),
):
    """Create a lead. AI (or heuristic) scoring runs automatically on create."""
    return lead_service.create_lead(db, current_user, body, background_tasks)


@router.get("", response_model=list[LeadResponse])
def list_leads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: str | None = Query(None),
    status: str | None = Query(None),
    source: str | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    min_score: float | None = Query(None),
    company_id: int | None = Query(None),
):
    return lead_service.list_leads(
        db, current_user, skip=skip, limit=limit,
        search=search, status=status, source=source,
        date_from=date_from, date_to=date_to, min_score=min_score,
        company_id=company_id
    )


@router.get("/priority", response_model=list[LeadResponse])
def get_priority_leads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100),
    company_id: int | None = Query(None),
):
    """Get priority leads for today dashboard sorted by AI score and recency."""
    return lead_service.list_priority_leads(
        db, current_user, limit=limit, company_id=company_id
    )


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


def process_csv_import_task(
    file_bytes: bytes,
    filename: str,
    column_mapping: dict,
    user_id: UUID,
):
    from app.core.database import SessionLocal
    from app.models.user import User
    import io
    import pandas as pd
    import logging

    db = SessionLocal()
    try:
        if filename.endswith(".csv") or filename.endswith(".txt"):
            df = pd.read_csv(io.BytesIO(file_bytes))
        else:
            df = pd.read_excel(io.BytesIO(file_bytes))
        
        df.columns = [str(c).strip() for c in df.columns]
        
        current_user = db.query(User).filter(User.id == user_id).first()
        if not current_user:
            return
            
        for index, row in df.iterrows():
            try:
                def get_mapped_val(crm_field):
                    csv_col = next((col for col, fld in column_mapping.items() if fld == crm_field), None)
                    if csv_col and csv_col in row and pd.notna(row[csv_col]):
                        return str(row[csv_col]).strip()
                    return None

                title_val = get_mapped_val("title") or f"Imported Lead {index + 1}"
                company_val = get_mapped_val("company")
                email_val = get_mapped_val("email")
                phone_val = get_mapped_val("phone")
                status_val = get_mapped_val("status") or "new"
                source_val = get_mapped_val("source") or "CSV/Excel Import"
                notes_val = get_mapped_val("notes")
                occupation_val = get_mapped_val("occupation")
                education_val = get_mapped_val("education")
                
                age_val = None
                age_str = get_mapped_val("age")
                if age_str:
                    try:
                        age_val = float(age_str)
                    except:
                        pass
                        
                deal_value_val = None
                deal_val_str = get_mapped_val("deal_value")
                if deal_val_str:
                    try:
                        deal_value_val = float(deal_val_str)
                    except:
                        pass

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
                
                lead_service.create_lead(db, current_user, lead_data, None)
            except Exception as row_err:
                logging.getLogger("uvicorn").error(f"Row {index + 1} import error: {str(row_err)}")
                
        db.commit()
    except Exception as e:
        logging.getLogger("uvicorn").error(f"Background CSV Import failed: {str(e)}")
    finally:
        db.close()


@router.post("/import/parse")
def parse_import_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Parse CSV or Excel file to return headers and first 3 preview rows."""
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

    headers = [str(c).strip() for c in df.columns]
    preview_rows = df.head(3).where(pd.notnull(df), None).to_dict(orient="records")
    
    return {
        "headers": headers,
        "preview": preview_rows
    }


@router.post("/import")
def import_leads(
    file: UploadFile = File(...),
    mapping: str = Form("{}"),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Import contacts from CSV or Excel file asynchronously with custom column mapping."""
    import json
    try:
        column_mapping = json.loads(mapping)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid mapping JSON string")

    file_bytes = file.file.read()
    if not background_tasks:
        raise HTTPException(status_code=500, detail="Background tasks manager not available")
        
    background_tasks.add_task(
        process_csv_import_task,
        file_bytes,
        file.filename,
        column_mapping,
        current_user.id
    )

    return {"status": "success", "message": "Import started in the background. Leads are being ingested asynchronously."}



@router.get("/priority", response_model=list[LeadResponse])
def list_priority_leads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100),
    company_id: int | None = Query(None),
):
    """List leads prioritized by AI score and engagement."""
    return lead_service.list_priority_leads(db, current_user, limit=limit, company_id=company_id)


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
