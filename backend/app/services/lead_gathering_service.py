import json
import urllib.error
import urllib.request

from app.core.config import settings
from app.schemas.lead import LeadCreate, LeadIngest


def _llm_request(body: dict) -> str:
    if not settings.USE_OLLAMA_FOR_ALL:
        raise ValueError("Ollama is not enabled")

    url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/v1/chat/completions"

    headers = {
        "Content-Type": "application/json",
    }
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


def _parse_extracted_lead(content: str) -> dict:
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        return {}
    if not isinstance(data, dict):
        return {}
    return {
        "title": data.get("title"),
        "company": data.get("company"),
        "email": data.get("email"),
        "phone": data.get("phone"),
        "notes": data.get("notes"),
    }


def extract_lead_from_raw_text(ingest: LeadIngest) -> LeadCreate:
    if not settings.USE_OLLAMA_FOR_ALL or not settings.ENABLE_OLLAMA_LEAD_GATHERING:
        return LeadCreate(
            title=ingest.title or ingest.source_platform,
            company=ingest.company,
            email=ingest.email,
            phone=ingest.phone,
            status="new",
            source=ingest.source_type or ingest.source_platform,
            source_platform=ingest.source_platform,
            notes=ingest.notes or ingest.raw_text,
        )

    prompt = (
        "You are a lead intake assistant. Extract lead fields from the raw incoming lead text or form data. "
        "Return ONLY valid JSON with keys: title, company, email, phone, notes. "
        "Use null if a field is not present."
    )

    user_payload = {
        "raw_text": ingest.raw_text,
        "source_platform": ingest.source_platform,
        "source_type": ingest.source_type,
        "page_url": ingest.page_url,
        "campaign_name": ingest.campaign_name,
        "provided_name": ingest.title,
        "provided_company": ingest.company,
        "provided_email": ingest.email,
        "provided_phone": ingest.phone,
    }

    body = {
        "model": settings.OLLAMA_MODEL,
        "temperature": 0.1,
        "messages": [
            {"role": "system", "content": prompt},
            {"role": "user", "content": json.dumps(user_payload)},
        ],
    }

    try:
        content = _llm_request(body)
        extracted = _parse_extracted_lead(content)
    except (urllib.error.URLError, urllib.error.HTTPError, ValueError, KeyError):
        extracted = {}

    return LeadCreate(
        title=extracted.get("title") or ingest.title or ingest.source_platform,
        company=extracted.get("company") or ingest.company,
        email=extracted.get("email") or ingest.email,
        phone=extracted.get("phone") or ingest.phone,
        status="new",
        source=ingest.source_type or ingest.source_platform,
        source_platform=ingest.source_platform,
        notes=extracted.get("notes") or ingest.notes or ingest.raw_text,
    )
