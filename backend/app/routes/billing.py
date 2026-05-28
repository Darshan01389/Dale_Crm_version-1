from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.billing import SubscriptionPlan, CompanySubscription, Invoice
from app.schemas.billing import SubscriptionPlanResponse, CompanySubscriptionBase, CompanySubscriptionResponse, InvoiceResponse
from app.services import billing_service

router = APIRouter(prefix="/billing", tags=["Billing"])

@router.get("/plans", response_model=List[SubscriptionPlanResponse])
def get_plans(db: Session = Depends(get_db)):
    return billing_service.get_or_create_default_plans(db)

@router.get("/status", response_model=CompanySubscriptionResponse)
def get_status(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User is not part of a company.")
        
    sub = db.query(CompanySubscription).filter(CompanySubscription.company_id == current_user.company_id).first()
    if not sub:
        # Default to a mock plan for demo if not subscribed
        billing_service.get_or_create_default_plans(db)
        plans = db.query(SubscriptionPlan).all()
        # Mock active status
        return {
            "id": "00000000-0000-0000-0000-000000000000",
            "company_id": current_user.company_id,
            "plan": plans[0],
            "status": "pending",
            "current_period_start": "2026-05-01T00:00:00Z",
            "current_period_end": "2026-06-01T00:00:00Z",
            "ai_requests_used": 0,
            "custom_price": None,
            "custom_requests_per_minute": None,
            "custom_voice": None,
            "custom_lead_sources": None
        }
    return sub

@router.post("/subscribe", response_model=CompanySubscriptionResponse)
def subscribe(data: CompanySubscriptionBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User is not part of a company.")
    if current_user.role not in ["Owner / Admin", "admin", "developer"]:
        raise HTTPException(status_code=403, detail="Not authorized to purchase subscriptions.")
        
    sub = billing_service.subscribe_company(db, current_user.company_id, data)
    return sub

@router.get("/invoices", response_model=List[InvoiceResponse])
def get_invoices(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.company_id:
        return []
    invoices = db.query(Invoice).filter(Invoice.company_id == current_user.company_id).order_by(Invoice.billing_date.desc()).all()
    return invoices

@router.post("/generate-invoice")
def trigger_invoice(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User is not part of a company.")
    inv = billing_service.generate_invoice(db, current_user.company_id)
    if not inv:
        raise HTTPException(status_code=400, detail="No active subscription found.")
    return {"status": "success", "invoice_id": inv.id}
