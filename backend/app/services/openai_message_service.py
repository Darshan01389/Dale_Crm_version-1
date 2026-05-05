import json
import urllib.error
import urllib.request

from app.core.config import settings
from app.ml.sentiment_service import SentimentResult
from app.schemas.lead import LeadCreate


def _llm_request(body: dict) -> str:
    is_groq = settings.USE_GROQ_FOR_ALL and (settings.GROQ_API_KEY or "").strip()
    key = (settings.GROQ_API_KEY if is_groq else settings.OPENAI_API_KEY or "").strip()
    
    if not key:
        raise ValueError("AI API key is not configured")

    url = "https://api.groq.com/openai/v1/chat/completions" if is_groq else "https://api.openai.com/v1/chat/completions"

    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=45) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    return payload["choices"][0]["message"]["content"].strip()


def generate_whatsapp_message(
    lead: LeadCreate,
    sentiment: SentimentResult,
    purpose: str | None = None,
) -> str:
    is_groq = settings.USE_GROQ_FOR_ALL and (settings.GROQ_API_KEY or "").strip()
    if not is_groq and not (settings.OPENAI_API_KEY or "").strip():
        greeting = lead.title or "Hello"
        return (
            f"Hi {greeting},\n\nI noticed your interest from {lead.source or 'your recent inquiry'}. "
            "I’d love to help you move forward and share the best solution for your business. "
            "Can I send over a quick follow-up?"
        )

    prompt = (
        "You are an AI assistant writing a short, emotionally engaging WhatsApp follow-up message for a sales lead. "
        "Use the lead details provided. Keep the tone friendly, confident, and focused on helping. "
        "If this is a re-engagement follow-up, mention the previous contact gently and invite them back. "
        "Return only the plain message text, no markdown or JSON."
    )

    user_payload = {
        "name": lead.title,
        "company": lead.company,
        "email": lead.email,
        "phone": lead.phone,
        "source": lead.source,
        "source_platform": getattr(lead, "source_platform", None),
        "notes": lead.notes,
        "sentiment": sentiment.label,
        "sentiment_score": sentiment.compound,
        "purpose": purpose or "initial outreach",
    }

    body = {
        "model": settings.GROQ_MODEL if is_groq else settings.OPENAI_MODEL,
        "temperature": 0.7,
        "messages": [
            {"role": "system", "content": prompt},
            {"role": "user", "content": json.dumps(user_payload)},
        ],
    }

    try:
        return _llm_request(body)
    except (urllib.error.URLError, urllib.error.HTTPError, ValueError, KeyError):
        return (
            f"Hi {lead.title or 'there'},\n\nThanks for reaching out through {lead.source_platform or lead.source or 'your channel'}. "
            "I’m here to help you with next steps — just reply and I’ll share a tailored proposal."
        )

def generate_ai_summary(lead, activities, voice_recordings) -> str:
    is_groq = settings.USE_GROQ_FOR_ALL and (settings.GROQ_API_KEY or "").strip()
    if not is_groq and not (settings.OPENAI_API_KEY or "").strip():
        return "Deal is progressing. Suggested next step: Follow up with prospect."

    prompt = (
        "You are an AI sales assistant. Analyze the following lead details, recent activities (emails, whatsapp), "
        "and voice recording summaries. Provide a concise 'AI Summary Card' containing exactly two sentences: "
        "1) The one-line state of the deal. "
        "2) The suggested next step for the sales rep. "
        "Do not include any other text."
    )

    activities_text = ", ".join([f"{a.activity_type}: {a.subject} ({a.body})" for a in activities[:3]])
    voice_text = ", ".join([f"Call: {v.summary}" for v in voice_recordings[:2]])

    user_payload = {
        "lead_name": lead.title,
        "lead_status": lead.status,
        "intent_level": getattr(lead, "intent_level", "Unknown"),
        "recent_activities": activities_text,
        "recent_calls": voice_text
    }

    body = {
        "model": settings.GROQ_MODEL if is_groq else settings.OPENAI_MODEL,
        "temperature": 0.5,
        "messages": [
            {"role": "system", "content": prompt},
            {"role": "user", "content": json.dumps(user_payload)},
        ],
    }

    try:
        return _llm_request(body)
    except Exception:
        return "Deal is progressing. Suggested next step: Follow up with prospect."

def ai_suggest_reply(lead, activities, voice_recordings) -> str:
    is_groq = settings.USE_GROQ_FOR_ALL and (settings.GROQ_API_KEY or "").strip()
    if not is_groq and not (settings.OPENAI_API_KEY or "").strip():
        return f"Hi {lead.title},\n\nFollowing up on our recent conversation. How would you like to proceed?"

    prompt = (
        "You are an expert sales assistant. Write a short, empathetic, and highly personalized "
        "WhatsApp/Email message to the prospect. Use the provided recent activity and call transcripts "
        "to reference their specific needs or objections. Do not include placeholders like [Your Name]. "
        "Keep it under 3 sentences and end with a clear, low-friction question."
    )

    activities_text = "\n".join([f"- {a.activity_type} at {a.occurred_at}: {a.body or a.subject}" for a in activities[:5]])
    voice_text = "\n".join([f"- Call at {v.occurred_at}: {v.summary} (Sentiment: {v.sentiment_label})" for v in voice_recordings[:3]])

    user_payload = {
        "lead_name": lead.title,
        "lead_company": lead.company,
        "intent_level": getattr(lead, "intent_level", "Unknown"),
        "recent_activities": activities_text,
        "recent_calls": voice_text
    }

    body = {
        "model": settings.GROQ_MODEL if is_groq else settings.OPENAI_MODEL,
        "temperature": 0.7,
        "messages": [
            {"role": "system", "content": prompt},
            {"role": "user", "content": json.dumps(user_payload)},
        ],
    }

    try:
        return _llm_request(body)
    except Exception:
        return f"Hi {lead.title},\n\nJust checking in on our last conversation. Let me know if you have any questions!"
