import traceback
import hmac
import hashlib
import json
from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db, SessionLocal
from app.models.lead_source import LeadSource
from app.models.webhook_log import WebhookLog
from app.models.lead import Lead
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


def process_webhook_log_sync(log_id: UUID):
    db = SessionLocal()
    try:
        log = db.query(WebhookLog).filter(WebhookLog.id == log_id).first()
        if not log:
            return
        
        source = db.query(LeadSource).filter(LeadSource.id == log.source_id).first()
        if not source:
            log.status = "Failed"
            log.error_message = "Lead source not found"
            db.commit()
            return
            
        if not source.is_active or source.status == "Disconnected":
            log.status = "Failed"
            log.error_message = "Lead source is disabled or disconnected"
            db.commit()
            return
            
        payload = log.payload or {}
        # Process the payload based on field mapping
        mapping = source.field_mapping or {}
        
        # Default extraction
        lead_data = {
            "title": "New Webhook Lead",
            "status": "new",
            "source": source.name,
            "source_platform": source.platform_type
        }
        
        # Mapping evaluation
        for external_field, internal_field in mapping.items():
            if external_field in payload:
                if internal_field in ["lead_name", "title"]:
                    lead_data["title"] = payload[external_field]
                elif internal_field == "email":
                    lead_data["email"] = payload[external_field]
                elif internal_field == "phone":
                    lead_data["phone"] = payload[external_field]
                elif internal_field == "company_name":
                    lead_data["lead_company_name"] = payload[external_field]
                    
        # Fallbacks
        if lead_data["title"] == "New Webhook Lead" and "name" in payload:
            lead_data["title"] = payload["name"]
        if "email" not in lead_data and "email" in payload:
            lead_data["email"] = payload["email"]
        if "phone" not in lead_data and "phone" in payload:
            lead_data["phone"] = payload["phone"]
                
        # Find default owner (first active manager or admin user)
        default_user = db.query(User).filter(User.role.in_(["Owner / Admin", "Manager"])).first()
        if not default_user:
            default_user = db.query(User).first()
            
        lead_data["owner_id"] = default_user.id if default_user else None
        
        # Create Lead
        new_lead = Lead(**lead_data)
        db.add(new_lead)
        
        # Mark log as processed
        log.status = "Processed"
        log.error_message = None
        db.commit()
        
    except Exception as e:
        db.rollback()
        log.status = "Failed"
        log.error_message = str(traceback.format_exc())
        db.commit()
    finally:
        db.close()


@router.get("/logs")
def get_webhook_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50,
):
    if current_user.role not in ["Owner / Admin", "Team Lead", "Manager", "Sales Admin", "admin", "admin/developers"]:
        raise HTTPException(status_code=403, detail="Only administrators or managers can view webhook logs")
        
    logs_with_source = db.query(WebhookLog, LeadSource.name.label("source_name"))\
        .outerjoin(LeadSource, WebhookLog.source_id == LeadSource.id)\
        .order_by(WebhookLog.created_at.desc())\
        .offset(skip).limit(limit).all()
        
    return [
        {
            "id": log.id,
            "source_id": log.source_id,
            "source_name": source_name or "Unknown Source",
            "payload": log.payload,
            "status": log.status,
            "error_message": log.error_message,
            "created_at": log.created_at
        }
        for log, source_name in logs_with_source
    ]


@router.post("/{source_id}", status_code=status.HTTP_202_ACCEPTED)
async def receive_webhook(
    source_id: UUID,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Universal webhook receiver for all incoming lead sources with signature verification"""
    source = db.query(LeadSource).filter(LeadSource.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Lead source not found")
        
    if not source.is_active or source.status == "Disconnected":
        raise HTTPException(status_code=400, detail="Lead source is disabled or disconnected")
    
    body_bytes = await request.body()
    
    # Try to parse payload
    try:
        payload = json.loads(body_bytes.decode('utf-8')) if body_bytes else {}
    except Exception as e:
        log = WebhookLog(source_id=source_id, payload={}, status="Failed", error_message="Invalid JSON payload")
        db.add(log)
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # Verify signature if webhook_secret is configured
    if source.auth_config and isinstance(source.auth_config, dict):
        webhook_secret = source.auth_config.get("webhook_secret")
        if webhook_secret:
            signature = (
                request.headers.get("X-Signature") or 
                request.headers.get("X-Hub-Signature-256") or 
                request.headers.get("X-Hub-Signature")
            )
            if not signature:
                log = WebhookLog(source_id=source_id, payload=payload, status="Failed", error_message="Missing signature headers")
                db.add(log)
                db.commit()
                raise HTTPException(status_code=401, detail="Authentication signature required but missing")
                
            if signature.startswith("sha256="):
                signature = signature[7:]
                
            computed = hmac.new(
                webhook_secret.encode('utf-8'),
                body_bytes,
                hashlib.sha256
            ).hexdigest()
            
            if not hmac.compare_digest(computed, signature):
                log = WebhookLog(source_id=source_id, payload=payload, status="Failed", error_message="Signature validation failed")
                db.add(log)
                db.commit()
                raise HTTPException(status_code=401, detail="Signature mismatch")
        
    # Save webhook log initially as Pending
    log = WebhookLog(source_id=source_id, payload=payload, status="Pending")
    db.add(log)
    db.commit()
    db.refresh(log)
    
    # Enqueue processing in background
    background_tasks.add_task(process_webhook_log_sync, log.id)
    
    return {"status": "success", "message": "Webhook received and queued for processing", "log_id": log.id}


@router.post("/logs/{log_id}/retry")
def retry_webhook(
    log_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually retry processing for a webhook log"""
    if current_user.role not in ["Owner / Admin", "Team Lead", "Manager", "Sales Admin", "admin", "admin/developers"]:
        raise HTTPException(status_code=403, detail="Only administrators or managers can retry webhook logs")
        
    log = db.query(WebhookLog).filter(WebhookLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Webhook log not found")
        
    log.status = "Pending"
    log.error_message = None
    db.commit()
    
    # Process synchronously to return immediate result
    process_webhook_log_sync(log.id)
    db.refresh(log)
    
    if log.status == "Failed":
        raise HTTPException(status_code=400, detail=f"Webhook retry processing failed: {log.error_message}")
        
    return {"status": "success", "message": "Webhook reprocessed successfully"}

