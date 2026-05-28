import traceback
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.models.lead_source import LeadSource
from app.models.webhook_log import WebhookLog
from app.models.lead import Lead

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

@router.post("/{source_id}")
async def receive_webhook(
    source_id: UUID,
    request: Request,
    db: Session = Depends(get_db)
):
    """Universal webhook receiver for all incoming lead sources"""
    source = db.query(LeadSource).filter(LeadSource.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Lead source not found")
        
    if not source.is_active or source.status == "Disconnected":
        raise HTTPException(status_code=400, detail="Lead source is disabled or disconnected")
    
    # Try to parse payload
    try:
        payload = await request.json()
    except Exception as e:
        log = WebhookLog(source_id=source_id, payload={}, status="Failed", error_message="Invalid JSON payload")
        db.add(log)
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
        
    # Save webhook log initially as Pending
    log = WebhookLog(source_id=source_id, payload=payload, status="Pending")
    db.add(log)
    db.commit()
    db.refresh(log)
    
    try:
        # Process the payload based on field mapping
        mapping = source.field_mapping or {}
        
        # Example naive extraction based on mapping or fallback to common fields
        lead_data = {
            "title": "New Webhook Lead",
            "status": "new",
            "source": source.name,
            "source_platform": source.platform_type
        }
        
        # Mapping evaluation
        for external_field, internal_field in mapping.items():
            if external_field in payload:
                # E.g. full_name -> title
                if internal_field == "lead_name" or internal_field == "title":
                    lead_data["title"] = payload[external_field]
                elif internal_field == "email":
                    lead_data["email"] = payload[external_field]
                elif internal_field == "phone":
                    lead_data["phone"] = payload[external_field]
                elif internal_field == "company_name":
                    lead_data["lead_company_name"] = payload[external_field]
                    
        # Fallbacks if mapping is not configured but payload has obvious fields
        if "title" == "New Webhook Lead" and "email" not in lead_data:
            if "name" in payload:
                lead_data["title"] = payload["name"]
            if "email" in payload:
                lead_data["email"] = payload["email"]
                
        # To create a Lead we need an owner. For webhook, we can either:
        # 1. Round-robin assign
        # 2. Assign to admin/owner
        # For MVP, let's just pick the first admin user, or we'd need to store default_owner in LeadSource
        from app.models.user import User
        default_user = db.query(User).filter(User.role.in_(["Owner / Admin", "Manager"])).first()
        if not default_user:
            default_user = db.query(User).first()
            
        lead_data["owner_id"] = default_user.id if default_user else None
        
        # Create Lead
        new_lead = Lead(**lead_data)
        db.add(new_lead)
        
        # Mark log as processed
        log.status = "Processed"
        db.commit()
        
        return {"status": "success", "lead_id": new_lead.id}
        
    except Exception as e:
        log.status = "Failed"
        log.error_message = str(traceback.format_exc())
        db.commit()
        raise HTTPException(status_code=500, detail="Error processing webhook payload")
