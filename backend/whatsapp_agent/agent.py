"""
backend/whatsapp_agent/agent.py

Core Autonomous WhatsApp Agent powered by NVIDIA NIM Llama 3.1 70B.

Flow:
  1. Incoming lead reply arrives via the webhook endpoint.
  2. Agent fetches full conversation history from the DB (Activity records).
  3. Builds a structured prompt for Llama 3.1 with lead context + history.
  4. LLM generates an intelligent, sales-focused reply.
  5. Reply is saved to DB (Activity table) + returned to the caller.
  6. Generates a short interaction summary after each exchange.
"""
import json
import urllib.request
from datetime import datetime
from typing import Optional
import uuid

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.activity import Activity
from app.models.lead import Lead
from app.models.user import User

AGENT_SYSTEM_PROMPT = """You are an expert AI Sales Representative for DaleIQ CRM.
You are replying ON BEHALF OF the sales team to a WhatsApp message from a lead.

Your personality:
- Warm, professional, and empathetic
- Consultative — you understand their problem before pitching
- You never hard-sell. You guide the lead toward a natural next step.
- You keep messages short (2–4 sentences max) because this is WhatsApp

Your goals:
1. Acknowledge what the lead said warmly
2. Provide helpful, relevant information or ask ONE clarifying question
3. Move the conversation toward booking a call or a demo

HANDOFF RULE (VERY IMPORTANT):
- If the lead says anything like: "I need more details", "Can I speak to someone?", "Who can I call?", 
  "Can you tell me more?", "I'm very interested", "ready to proceed", "let's talk" — then you MUST 
  provide the salesperson's contact details using the following format exactly:
  
  "Great! Let me connect you with [SALESPERSON_NAME] directly who can answer all your questions:
  📞 [SALESPERSON_PHONE]
  ✉️ [SALESPERSON_EMAIL]
  They'll be happy to help you further!"

- The placeholders [SALESPERSON_NAME], [SALESPERSON_PHONE], [SALESPERSON_EMAIL] will be injected from 
  the CRM. Do NOT invent contact details. Only use what is provided in your context.

IMPORTANT: Return ONLY the WhatsApp message text. No formatting, no markdown headers, no explanations."""

SUMMARY_SYSTEM_PROMPT = """You are a CRM data assistant. Based on a WhatsApp conversation between a sales rep and a lead,
generate a concise 1-2 sentence summary that captures:
1. The current intent/interest level of the lead (Hot / Warm / Cold)
2. The next recommended action for the sales rep

Return ONLY the summary text, no extra formatting."""

HANDOFF_DETECTION_PROMPT = """Analyze this WhatsApp message from a lead. 
Reply with ONLY 'YES' if the lead is expressing strong interest, asking for more details, 
requesting to speak with someone, or is ready to proceed with a purchase/call/demo.
Reply with ONLY 'NO' if this is a casual question or the lead is not yet showing strong buying intent.
Message: """


def _llm_call(messages: list, max_tokens: int = 300) -> str:
    """Make a direct API call to NVIDIA NIM Llama 3.1 70B."""
    url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/v1/chat/completions"
    body = {
        "model": settings.OLLAMA_MODEL,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": max_tokens,
    }
    headers = {"Content-Type": "application/json"}
    if settings.NVIDIA_API_KEY:
        headers["Authorization"] = f"Bearer {settings.NVIDIA_API_KEY}"

    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=45) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    return payload["choices"][0]["message"]["content"].strip()


def get_conversation_history(db: Session, lead_id: str, limit: int = 20) -> list[Activity]:
    """Fetch the last N whatsapp activities for this lead, ordered oldest first."""
    return (
        db.query(Activity)
        .filter(
            Activity.lead_id == lead_id,
            Activity.activity_type == "whatsapp",
        )
        .order_by(Activity.occurred_at.asc())
        .limit(limit)
        .all()
    )


def save_message(
    db: Session,
    lead_id: str,
    owner_id: str,
    direction: str,  # "inbound" or "outbound"
    message: str,
    company_number: Optional[str] = None,
    lead_number: Optional[str] = None,
) -> Activity:
    """Save a WhatsApp message as an Activity record in the CRM database."""
    metadata = json.dumps({
        "direction": direction,
        "company_number": company_number,
        "lead_number": lead_number,
        "channel": "whatsapp",
    })
    activity = Activity(
        id=uuid.uuid4(),
        lead_id=lead_id,
        owner_id=owner_id,
        activity_type="whatsapp",
        subject=f"WhatsApp {'Reply' if direction == 'inbound' else 'Agent Message'}",
        body=message,
        extra_metadata=metadata,
        occurred_at=datetime.utcnow(),
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


def _detect_handoff_needed(incoming_message: str) -> bool:
    """
    Fast check: does the lead's message signal high interest / need for human contact?
    Uses a lightweight LLM call with max_tokens=3 for speed.
    """
    try:
        result = _llm_call(
            [{"role": "user", "content": HANDOFF_DETECTION_PROMPT + incoming_message}],
            max_tokens=5,
        )
        return "YES" in result.upper()
    except Exception:
        # If detection fails, default to NOT triggering handoff to avoid spam
        return False


def generate_reply(
    db: Session,
    lead_id: str,
    owner_id: str,
    incoming_message: str,
    company_number: Optional[str] = None,
    lead_number: Optional[str] = None,
) -> dict:
    """
    Main agent function:
    1. Saves the incoming lead message
    2. Detects if the lead needs a handoff to the salesperson
    3. Fetches conversation history
    4. Builds a context-aware prompt with salesperson details
    5. Calls Llama 3.1 to generate a reply (with handoff if needed)
    6. Saves the AI reply and returns summary
    """
    print(f"\n[WhatsApp Agent] Processing message from {lead_number or 'unknown'}")
    
    try:
        # --- Convert IDs to UUID objects to avoid DB type mismatches ---
        try:
            lead_uuid = uuid.UUID(lead_id) if isinstance(lead_id, str) else lead_id
            owner_uuid = uuid.UUID(owner_id) if isinstance(owner_id, str) else owner_id
        except Exception as e:
            print(f"[WhatsApp Agent] UUID Conversion Error: {e}")
            raise ValueError(f"Invalid UUID format: {e}")

        # --- Get lead + owner (salesperson) context ---
        lead = db.query(Lead).filter(Lead.id == lead_uuid).first()
        owner = db.query(User).filter(User.id == owner_uuid).first()

        lead_name = lead.title if lead else "Lead"
        lead_company = getattr(lead, "lead_company_name", "") or ""

        # Salesperson contact details for handoff
        salesperson_name = owner.name if owner else "our sales team"
        salesperson_phone = (
            owner.whatsapp_number or company_number or "our office number"
        ) if owner else "our office number"
        salesperson_email = owner.email if owner else "support@company.com"

        # --- Save incoming message to DB ---
        save_message(
            db=db,
            lead_id=lead_uuid,
            owner_id=owner_uuid,
            direction="inbound",
            message=incoming_message,
            company_number=company_number,
            lead_number=lead_number,
        )

        # --- Detect handoff need BEFORE calling LLM for reply ---
        print("[WhatsApp Agent] Detecting handoff intent...")
        handoff_triggered = _detect_handoff_needed(incoming_message)

        # --- Update Lead status if handoff triggered ---
        if handoff_triggered and lead:
            print(f"[WhatsApp Agent] Handoff triggered! Updating lead {lead_name} to HOT.")
            lead.intent_level = "HOT"
            lead.category = "Hot"
            lead.risk_flag = False
            db.commit()
            db.refresh(lead)

        # --- Build conversation history for LLM ---
        history = get_conversation_history(db, str(lead_uuid), limit=20)

        # Inject actual salesperson details into the system prompt
        agent_prompt = AGENT_SYSTEM_PROMPT.replace(
            "[SALESPERSON_NAME]", salesperson_name
        ).replace(
            "[SALESPERSON_PHONE]", salesperson_phone
        ).replace(
            "[SALESPERSON_EMAIL]", salesperson_email
        )

        messages = [{"role": "system", "content": agent_prompt}]

        # Add lead context block
        lead_context = (
            f"SALESPERSON CONTACT (for handoff):\n"
            f"Name: {salesperson_name}\n"
            f"Phone/WhatsApp: {salesperson_phone}\n"
            f"Email: {salesperson_email}\n\n"
            f"LEAD INFO:\n"
            f"Name: {lead_name}\n"
            f"Company: {lead_company}\n"
            f"Status: {lead.status if lead else 'unknown'}\n"
            f"Source: {lead.source if lead else 'WhatsApp'}\n"
            f"---\nCONVERSATION:"
        )
        messages.append({"role": "system", "content": lead_context})

        # Map stored activities to LLM roles
        for act in history[:-1]:  # Exclude the message we just saved
            meta = json.loads(act.extra_metadata or "{}")
            role = "user" if meta.get("direction") == "inbound" else "assistant"
            messages.append({"role": role, "content": act.body or ""})

        # Add the current incoming message, with handoff hint if needed
        user_msg = incoming_message
        if handoff_triggered:
            user_msg += "\n\n[SYSTEM NOTE: This lead is showing strong buying intent. Apply the HANDOFF RULE now.]"
        messages.append({"role": "user", "content": user_msg})

        # --- Generate reply ---
        print(f"[WhatsApp Agent] Calling Llama 3.1 70B (NVIDIA NIM) for reply...")
        try:
            reply_text = _llm_call(messages, max_tokens=250)
        except Exception as e:
            print(f"[WhatsApp Agent] LLM Reply Error: {e}")
            if handoff_triggered:
                reply_text = (
                    f"Great to hear your interest! Let me connect you with {salesperson_name} directly:\n"
                    f"📞 {salesperson_phone}\n"
                    f"✉️ {salesperson_email}\n"
                    f"They'll be happy to assist you! 🙏"
                )
            else:
                reply_text = "Thank you for your message! Our team will get back to you shortly. 🙏"

        # --- Save outgoing AI reply to DB ---
        save_message(
            db=db,
            lead_id=lead_uuid,
            owner_id=owner_uuid,
            direction="outbound",
            message=reply_text,
            company_number=company_number,
            lead_number=lead_number,
        )

        # --- Generate interaction summary ---
        print("[WhatsApp Agent] Generating summary...")
        all_history = get_conversation_history(db, str(lead_uuid), limit=30)
        conversation_text = "\n".join([
            f"{'Lead' if json.loads(a.extra_metadata or '{}').get('direction') == 'inbound' else 'Agent'}: {a.body}"
            for a in all_history
        ])
        try:
            summary = _llm_call(
                [
                    {"role": "system", "content": SUMMARY_SYSTEM_PROMPT},
                    {"role": "user", "content": conversation_text},
                ],
                max_tokens=100,
            )
        except Exception:
            intent = "Hot \ud83d\udd25" if handoff_triggered else "Warm"
            summary = f"WhatsApp conversation with {lead_name}. Intent: {intent}. Agent replied."

        print("[WhatsApp Agent] Successfully processed exchange.")
        return {
            "reply": reply_text,
            "summary": summary,
            "lead_id": str(lead_id),
            "lead_name": lead_name,
            "handoff_triggered": handoff_triggered,
            "salesperson_contact": {
                "name": salesperson_name,
                "phone": salesperson_phone,
                "email": salesperson_email,
            },
            "message_count": len(all_history),
        }

    except Exception as fatal_err:
        print(f"[WhatsApp Agent] FATAL ERROR: {fatal_err}")
        import traceback
        traceback.print_exc()
        return {
            "reply": "Thank you! Our sales team has been notified and will reach out to you shortly. \ud83d\ude4f",
            "summary": "Agent error occurred. Falling back to human notification.",
            "lead_id": str(lead_id),
            "handoff_triggered": False,
            "error": str(fatal_err)
        }

