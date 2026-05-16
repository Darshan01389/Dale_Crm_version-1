import json
import urllib.error
import urllib.request

from app.core.config import settings
from app.ml.sentiment_service import SentimentResult
from app.schemas.lead import LeadCreate


_key_index = 0

def _llm_request(body: dict, model_override: str = None) -> str:
    global _key_index
    if not settings.USE_OLLAMA_FOR_ALL:
        raise ValueError("Ollama is not enabled")

    # Use override, then body, then default
    model = model_override or body.get("model") or settings.OLLAMA_MODEL
    body["model"] = model

    keys = settings.nvidia_keys
    url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/v1/chat/completions"

    # Try each key until one works
    last_error = None
    for _ in range(len(keys) or 1):
        headers = {"Content-Type": "application/json"}
        if keys:
            current_key = keys[_key_index % len(keys)]
            headers["Authorization"] = f"Bearer {current_key}"
            _key_index += 1

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(body).encode("utf-8"),
                headers=headers,
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=45) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
            return payload["choices"][0]["message"]["content"].strip()
        except Exception as e:
            last_error = e
            continue
            
    if last_error:
        raise last_error
    return ""


def generate_whatsapp_message(
    lead: LeadCreate,
    sentiment: SentimentResult,
    purpose: str | None = None,
) -> str:
    if not settings.USE_OLLAMA_FOR_ALL:
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
        "model": settings.CHAT_MODEL,
        "temperature": 0.7,
        "messages": [
            {"role": "system", "content": prompt},
            {"role": "user", "content": json.dumps(user_payload)},
        ],
    }

    try:
        return _llm_request(body, model_override=settings.CHAT_MODEL)
    except (urllib.error.URLError, urllib.error.HTTPError, ValueError, KeyError):
        return (
            f"Hi {lead.title or 'there'},\n\nThanks for reaching out through {lead.source_platform or lead.source or 'your channel'}. "
            "I’m here to help you with next steps — just reply and I’ll share a tailored proposal."
        )

def generate_ai_summary(lead, activities, voice_recordings) -> str:
    if not settings.USE_OLLAMA_FOR_ALL:
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
        "model": settings.STRATEGY_MODEL,
        "temperature": 0.5,
        "messages": [
            {"role": "system", "content": prompt},
            {"role": "user", "content": json.dumps(user_payload)},
        ],
    }

    try:
        return _llm_request(body, model_override=settings.STRATEGY_MODEL)
    except Exception:
        return "Deal is progressing. Suggested next step: Follow up with prospect."

def ai_suggest_reply(lead, activities, voice_recordings, channel="whatsapp") -> dict:
    if not settings.USE_OLLAMA_FOR_ALL:
        res = {"draft": f"Hi {lead.title},\n\nFollowing up on our recent conversation via {channel}. How would you like to proceed?"}
        if channel == "email":
            res["subject"] = f"Re: Next steps for {lead.title}"
        return res

    prompt = (
        f"You are an expert sales assistant. Write a short, empathetic, and highly personalized "
        f"{channel.upper()} message to the prospect. Use the provided recent activity and call transcripts "
        "to reference their specific needs or objections. Do not include placeholders like [Your Name]. "
        "Keep it under 3 sentences and end with a clear, low-friction question."
    )
    
    if channel == "email":
        prompt += "\n\nCRITICAL: Return your response as a JSON object with two keys: 'subject' (a short, catchy email subject) and 'draft' (the email body). Do not include any other text."
    else:
        prompt += "\n\nReturn only the plain message text, no markdown or JSON."

    activities_text = "\n".join([f"- {a.activity_type} at {a.occurred_at}: {a.body or a.subject}" for a in activities[:5]])
    voice_text = "\n".join([f"- Call at {v.occurred_at}: {v.summary} (Sentiment: {v.sentiment_label})" for v in voice_recordings[:3]])

    user_payload = {
        "lead_name": lead.title,
        "lead_company": lead.company,
        "intent_level": getattr(lead, "intent_level", "Unknown"),
        "recent_activities": activities_text,
        "recent_calls": voice_text,
        "channel": channel
    }

    body = {
        "model": settings.STRATEGY_MODEL,
        "temperature": 0.7,
        "messages": [
            {"role": "system", "content": prompt},
            {"role": "user", "content": json.dumps(user_payload)},
        ],
    }

    try:
        raw_res = _llm_request(body, model_override=settings.STRATEGY_MODEL)
        if channel == "email":
            # Try to parse JSON from LLM
            try:
                # Basic cleanup if LLM added backticks
                if "```json" in raw_res:
                    raw_res = raw_res.split("```json")[1].split("```")[0].strip()
                elif "```" in raw_res:
                    raw_res = raw_res.split("```")[1].split("```")[0].strip()
                
                parsed = json.loads(raw_res)
                return {"draft": parsed.get("draft", ""), "subject": parsed.get("subject", "Following up")}
            except:
                return {"draft": raw_res, "subject": f"Re: Next steps for {lead.title}"}
        return {"draft": raw_res}
    except Exception:
        fallback = f"Hi {lead.title},\n\nJust checking in on our last conversation. Let me know if you have any questions!"
        return {"draft": fallback, "subject": "Checking in"} if channel == "email" else {"draft": fallback}
