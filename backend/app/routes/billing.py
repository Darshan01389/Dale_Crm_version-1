from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from uuid import UUID
import uuid
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.billing import SubscriptionPlan, CompanySubscription, Invoice
from app.schemas.billing import (
    SubscriptionPlanResponse, CompanySubscriptionBase, CompanySubscriptionResponse,
    InvoiceResponse, SubscriptionInitRequest, SubscriptionInitResponse
)
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

class SimulateWebhookRequest(BaseModel):
    gateway: str
    gateway_order_id: str

@router.post("/subscribe", response_model=SubscriptionInitResponse)
def subscribe(data: SubscriptionInitRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User is not part of a company.")
    if current_user.role not in ["Owner / Admin", "admin", "developer"]:
        raise HTTPException(status_code=403, detail="Not authorized to purchase subscriptions.")
        
    res = billing_service.subscribe_company_gateway(db, current_user.company_id, data, data.gateway)
    return res

@router.post("/webhook/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    from app.core.config import settings
    import json
    
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    if not settings.STRIPE_WEBHOOK_SECRET:
        # Sandbox signature fallback
        if sig_header == "sandbox_signature":
            data = json.loads(payload)
            session_id = data.get("session_id")
            billing_service.process_successful_payment(db, "stripe", session_id, "mock_stripe_pay_id")
            return {"status": "success"}
        raise HTTPException(status_code=400, detail="Stripe webhook secret is not configured.")
        
    try:
        import stripe
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        session_id = session["id"]
        payment_intent_id = session.get("payment_intent")
        billing_service.process_successful_payment(db, "stripe", session_id, payment_intent_id or "stripe_pay_id")
        
    return {"status": "success"}

@router.post("/webhook/razorpay")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    from app.core.config import settings
    import json
    
    payload = await request.body()
    sig = request.headers.get("x-razorpay-signature")
    
    if not settings.RAZORPAY_KEY_SECRET:
        if sig == "sandbox_signature":
            data = json.loads(payload)
            order_id = data.get("order_id")
            payment_id = data.get("payment_id")
            billing_service.process_successful_payment(db, "razorpay", order_id, payment_id)
            return {"status": "success"}
        raise HTTPException(status_code=400, detail="Razorpay webhook secret is not configured.")
        
    import hmac
    import hashlib
    expected_signature = hmac.new(
        key=settings.RAZORPAY_KEY_SECRET.encode('utf-8'),
        msg=payload,
        digestmod=hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(expected_signature, sig):
        raise HTTPException(status_code=400, detail="Invalid signature")
        
    data = json.loads(payload)
    event = data.get("event")
    if event == "payment.captured":
        payment = data["payload"]["payment"]["entity"]
        order_id = payment.get("order_id")
        payment_id = payment.get("id")
        billing_service.process_successful_payment(db, "razorpay", order_id, payment_id)
        
    return {"status": "success"}

@router.get("/upi-config")
def get_upi_config():
    from app.core.config import settings
    return {"upi_id": settings.RAZORPAY_UPI_VPA or ""}

@router.post("/webhook/simulate")
def simulate_webhook(
    data: SimulateWebhookRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.config import settings
    if not settings.DEBUG:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Simulation mode is disabled in production."
        )
    if current_user.role not in ["Owner / Admin", "admin", "developer", "Developer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to simulate webhooks."
        )
    success = billing_service.process_successful_payment(
        db,
        data.gateway,
        data.gateway_order_id,
        f"simulated_pay_{uuid.uuid4().hex[:8]}"
    )
    if not success:
        raise HTTPException(status_code=400, detail="Simulated payment failed: Invoice order ID not found.")
    return {"status": "success", "message": f"Simulated payment succeeded for {data.gateway}."}

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


from fastapi.responses import FileResponse
import os

@router.get("/invoices/{invoice_id}/download")
def download_invoice(
    invoice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Retrieve invoice
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    # Check authorization (only users from same company can download)
    if invoice.company_id != current_user.company_id and not current_user.is_super_admin:
        raise HTTPException(status_code=403, detail="Not authorized to download this invoice")
        
    pdf_path = billing_service.compile_invoice_pdf(db, invoice)
    
    if not pdf_path or not os.path.exists(pdf_path):
        raise HTTPException(status_code=500, detail="Failed to compile invoice PDF")
        
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"invoice_{invoice.id.hex[:6]}_{invoice.billing_date.strftime('%Y%m%d')}.pdf"
    )

