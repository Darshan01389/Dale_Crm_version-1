"""
whatsapp_service.py
───────────────────
Sends WhatsApp messages via the Meta WhatsApp Business Cloud API
(Graph API v19.0 format).

WHATSAPP_MODE=demo  → simulates a successful send locally (no HTTP call)
WHATSAPP_MODE=live  → hits the real Meta Graph API endpoint
WHATSAPP_MODE=web   → hits the self-hosted whatsapp_gateway at port 3001
"""

import json
import urllib.error
import urllib.request
import uuid
from datetime import datetime

from app.core.config import settings
from app.models.lead import Lead


# ─────────────────────────────────────────────
#  Demo simulation helper
# ─────────────────────────────────────────────

def _demo_response(lead: Lead, message: str) -> dict:
    """
    Returns a simulated Meta WhatsApp Cloud API success response.
    Mirrors the exact structure returned by:
      POST https://graph.facebook.com/v19.0/{phone_number_id}/messages
    """
    msg_id = f"wamid.{uuid.uuid4().hex.upper()[:32]}"
    return {
        "success": True,
        "mode": "demo",
        "delivery_status": "sent",
        "response": {
            "messaging_product": "whatsapp",
            "contacts": [
                {
                    "input": lead.phone or "+919999999999",
                    "wa_id": (lead.phone or "+919999999999").replace("+", "").replace(" ", ""),
                }
            ],
            "messages": [
                {
                    "id": msg_id,
                    "message_status": "accepted",
                }
            ],
        },
        "simulated_at": datetime.utcnow().isoformat() + "Z",
        "note": (
            "Demo mode – no real request was made. "
            "Set WHATSAPP_MODE=live to send via the Meta Cloud API."
        ),
    }


# ─────────────────────────────────────────────
#  Main public function
# ─────────────────────────────────────────────

def send_whatsapp_message(lead: Lead, message: str) -> dict:
    """
    Send a WhatsApp text message to a lead.

    Returns a dict with at least:
        success (bool), delivery_status (str), response (dict)
    """
    mode = (settings.WHATSAPP_MODE or "demo").lower()

    # ── Demo / simulation mode ──────────────────────────────────────
    if mode == "demo":
        return _demo_response(lead, message)

    # ── Web / In-house mode ─────────────────────────────────────────
    if mode == "web":
        try:
            web_url = "http://localhost:3001/send-message"
            req = urllib.request.Request(
                web_url,
                data=json.dumps({"to": lead.phone, "message": message}).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=45) as resp:
                body = json.loads(resp.read().decode("utf-8"))
            return {
                "success": True,
                "mode": "web",
                "delivery_status": "sent",
                "response": body
            }
        except Exception as exc:
            return {"success": False, "mode": "web", "error": str(exc)}

    # ── Live mode – Meta API ────────────────────────────────────────
    url = settings.WHATSAPP_API_URL
    token = settings.WHATSAPP_API_TOKEN
    sender = settings.WHATSAPP_SENDER_ID

    if not url or not token or not sender:
        raise ValueError(
            "WhatsApp API is not fully configured. "
            "Set WHATSAPP_API_URL, WHATSAPP_API_TOKEN, and WHATSAPP_SENDER_ID in .env"
        )
    if not lead.phone:
        raise ValueError("Lead does not have a phone number for WhatsApp messaging.")

    # Meta Cloud API payload (text message)
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": lead.phone,
        "type": "text",
        "text": {"preview_url": False, "body": message},
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            body = json.loads(resp.read().decode("utf-8"))

        # Extract status from Meta's response structure
        messages = body.get("messages", [{}])
        delivery_status = messages[0].get("message_status", "sent") if messages else "sent"

        return {
            "success": True,
            "mode": "live",
            "delivery_status": delivery_status,
            "response": body,
        }

    except urllib.error.HTTPError as exc:
        error_body = exc.read().decode("utf-8")
        return {"success": False, "mode": "live", "error": error_body}
    except urllib.error.URLError as exc:
        return {"success": False, "mode": "live", "error": str(exc)}
