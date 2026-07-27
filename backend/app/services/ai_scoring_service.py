import json

import re

import urllib.error

import urllib.request

from typing import Any



from app.core.config import settings

from app.schemas.lead import LeadCreate





def _heuristic_score(lead: LeadCreate) -> tuple[float, str]:

    score = 35.0

    parts: list[str] = []



    if lead.email and "@" in lead.email:

        score += 18

        parts.append("work email present")



    if lead.phone and len(re.sub(r"\D", "", lead.phone or "")) >= 7:

        score += 15

        parts.append("phone looks complete")



    if lead.company and len(lead.company.strip()) >= 2:

        score += 12

        parts.append("company named")



    high_intent = ("referral", "demo", "pricing", "partner", "inbound", "webinar")

    src = (lead.source or "").lower()

    if any(k in src for k in high_intent):

        score += 15

        parts.append("high-intent source signal")



    notes = (lead.notes or "").strip()

    if len(notes) >= 40:

        score += 10

        parts.append("detailed notes")



    if len(lead.title.strip()) >= 8:

        score += 5

        parts.append("clear title")



    score = max(0.0, min(100.0, round(score, 1)))

    summary = (

        "Heuristic score (no LLM key): " + "; ".join(parts)

        if parts

        else "Heuristic baseline — add contact details to improve fit."

    )

    return score, summary





def _parse_openai_content(content: str) -> tuple[float, str] | None:

    content = content.strip()

    try:

        data: Any = json.loads(content)

    except json.JSONDecodeError:

        m = re.search(r"\{[\s\S]*\}", content)

        if not m:

            return None

        try:

            data = json.loads(m.group())

        except json.JSONDecodeError:

            return None



    if not isinstance(data, dict):

        return None

    raw_score = data.get("score")

    summary = data.get("summary")

    if raw_score is None or summary is None:

        return None

    try:

        score = float(raw_score)

    except (TypeError, ValueError):

        return None

    if not isinstance(summary, str):

        summary = str(summary)

    score = max(0.0, min(100.0, round(score, 1)))

    return score, summary[:2000]





def _score_with_llm(lead: LeadCreate) -> tuple[float, str]:

    if not settings.USE_OLLAMA_FOR_ALL:

        return _heuristic_score(lead)



    url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/v1/chat/completions"

    model = settings.OLLAMA_MODEL



    user_payload = {

        "title": lead.title,

        "company": lead.company,

        "email": lead.email,

        "phone": lead.phone,

        "status": lead.status,

        "source": lead.source,

        "notes": lead.notes,

    }



    body = {

        "model": model,

        "temperature": 0.25,

        "response_format": {"type": "json_object"},

        "messages": [

            {

                "role": "system",

                "content": (

                    "You score sales leads for B2B CRM. Return ONLY JSON with keys "

                    '"score" (number 0-100, one decimal max) and "summary" '

                    "(string, max ~200 chars) explaining the main drivers."

                ),

            },

            {

                "role": "user",

                "content": json.dumps(user_payload),

            },

        ],

    }



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



    try:

        with urllib.request.urlopen(req, timeout=45) as resp:

            payload = json.loads(resp.read().decode("utf-8"))

    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):

        s, summ = _heuristic_score(lead)

        provider = "Ollama"

        return s, summ + f" ({provider} request failed; heuristic blend.)"



    try:

        content = payload["choices"][0]["message"]["content"]

    except (KeyError, IndexError, TypeError):

        s, summ = _heuristic_score(lead)

        provider = "Ollama"

        return s, summ + f" ({provider} response malformed; heuristic blend.)"



    parsed = _parse_openai_content(content)

    if parsed is None:

        s, summ = _heuristic_score(lead)

        return s, summ + " (Could not parse AI JSON; heuristic blend.)"



    return parsed





def score_new_lead(lead: LeadCreate) -> tuple[float, str]:

    """

    Runs on every new lead creation: LLM when USE_OLLAMA_FOR_ALL is set,

    otherwise a deterministic heuristic.

    """

    if settings.USE_OLLAMA_FOR_ALL:

        return _score_with_llm(lead)

    return _heuristic_score(lead)

