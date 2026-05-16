"""
backend/app/routes/whatsapp.py

API endpoints for the WhatsApp Agent:
  POST /api/whatsapp/webhook     — Receives incoming lead replies (from real WhatsApp or the Simulator)
  POST /api/whatsapp/simulate    — Simulator: send a message as if you were the lead
  GET  /api/whatsapp/history/{lead_id} — Get the full interaction chart / timeline for a lead
  PUT  /api/whatsapp/settings    — Update the current user's Company WhatsApp number
"""
import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.activity import Activity
from app.models.user import User

router = APIRouter(prefix="/api/whatsapp", tags=["WhatsApp Agent"])


# ──────────────────────────────────────────────
# Pydantic schemas
# ──────────────────────────────────────────────

class WebhookPayload(BaseModel):
    """Generic incoming webhook from a real WhatsApp provider or bridge."""
    lead_id: str
    from_number: str          # Lead's phone number
    to_number: str            # Company WhatsApp number
    message: str


class SimulateMessage(BaseModel):
    """Simulator: lets the demo user pretend to be the lead sending a message."""
    lead_id: str
    lead_message: str
    company_number: str       # 'Your' company number (pre-configured or typed live)
    lead_number: str          # Your friend's number / your own number for demo


class UpdateWhatsAppNumber(BaseModel):
    whatsapp_number: str


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────

@router.post("/webhook")
async def whatsapp_webhook(
    payload: WebhookPayload,
    db: Session = Depends(get_db),
):
    """
    Real webhook endpoint.
    In production, your WhatsApp provider (Twilio/Meta/Wati) POSTs here
    every time a lead replies.

    Finds the rep who owns the 'to_number', then triggers the AI agent.
    """
    from whatsapp_agent.agent import generate_reply

    # Find the sales rep who owns this company number
    owner = db.query(User).filter(User.whatsapp_number == payload.to_number).first()
    if not owner:
        raise HTTPException(
            status_code=404,
            detail=f"No user found with company WhatsApp number {payload.to_number}. "
                   "Please configure it in Settings."
        )

    result = generate_reply(
        db=db,
        lead_id=payload.lead_id,
        owner_id=str(owner.id),
        incoming_message=payload.message,
        company_number=payload.to_number,
        lead_number=payload.from_number,
    )
    return {"status": "ok", **result}


@router.post("/simulate")
async def simulate_whatsapp(
    payload: SimulateMessage,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    WhatsApp Simulator endpoint — for demo accounts only.
    The logged-in user sends a message AS IF they were the lead.
    The AI agent replies, and everything is saved to the DB / interaction chart.
    """
    from whatsapp_agent.agent import generate_reply

    # Only allow Sales Rep and Team Lead roles
    allowed_roles = ["Sales Rep", "Team Lead"]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="WhatsApp Simulator is only available for Sales Rep and Team Lead accounts."
        )

    result = generate_reply(
        db=db,
        lead_id=payload.lead_id,
        owner_id=str(current_user.id),
        incoming_message=payload.lead_message,
        company_number=payload.company_number,
        lead_number=payload.lead_number,
    )
    return {"status": "ok", **result}


@router.get("/history/{lead_id}")
async def get_whatsapp_history(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns the full WhatsApp interaction chart for a lead.
    The frontend Lead Profile / Interaction Timeline uses this.
    """
    activities = (
        db.query(Activity)
        .filter(
            Activity.lead_id == lead_id,
            Activity.activity_type == "whatsapp",
        )
        .order_by(Activity.occurred_at.asc())
        .all()
    )

    messages = []
    for act in activities:
        meta = json.loads(act.extra_metadata or "{}")
        messages.append({
            "id": str(act.id),
            "direction": meta.get("direction", "unknown"),
            "message": act.body,
            "timestamp": act.occurred_at.isoformat(),
            "company_number": meta.get("company_number"),
            "lead_number": meta.get("lead_number"),
        })

    return {"lead_id": lead_id, "messages": messages, "count": len(messages)}


@router.put("/settings/number")
async def update_whatsapp_number(
    payload: UpdateWhatsAppNumber,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lets Sales Reps and Team Leads update their Company WhatsApp number
    in Settings. Admin cannot set a number (they don't chat with leads).
    """
    if current_user.role not in ["Sales Rep", "Team Lead"]:
        raise HTTPException(
            status_code=403,
            detail="Only Sales Rep and Team Lead accounts can configure a Company WhatsApp number."
        )

    current_user.whatsapp_number = payload.whatsapp_number
    db.commit()
    db.refresh(current_user)

    return {
        "status": "updated",
        "whatsapp_number": current_user.whatsapp_number,
        "message": f"Company WhatsApp number updated to {payload.whatsapp_number}"
    }


@router.get("/settings/number")
async def get_whatsapp_number(
    current_user: User = Depends(get_current_user),
):
    """Returns the current user's configured Company WhatsApp number."""
    return {
        "whatsapp_number": current_user.whatsapp_number,
        "role": current_user.role,
    }
