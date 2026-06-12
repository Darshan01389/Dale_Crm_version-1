from __future__ import annotations

import json
import re
import urllib.error
import urllib.request

from app.core.config import settings
from app.ml.sentiment_service import SentimentResult


def sentiment_openai(notes: str | None, title: str | None) -> SentimentResult | None:
    """
    LLM (Ollama) structured sentiment; returns None on failure.
    """
    if not settings.USE_OLLAMA_FOR_ALL:
        return None

    url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/v1/chat/completions"
    model = settings.OLLAMA_MODEL

    text = " ".join(p for p in [title or "", notes or ""] if p).strip()
    if not text:
        return SentimentResult(
            label="neutral",
            compound=0.0,
            pos=0.0,
            neu=1.0,
            neg=0.0,
        )

    body = {
        "model": model,
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
        "messages": [
            {
                "role": "system",
                "content": (
                    "You classify CRM lead/note tone. Reply ONLY JSON: "
                    '{"label":"positive"|"neutral"|"negative",'
                    '"compound": number between -1 and 1 (like VADER compound),'
                    '"summary": string max 120 chars}'
                ),
            },
            {"role": "user", "content": text[:6000]},
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
        with urllib.request.urlopen(req, timeout=50) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        content = payload["choices"][0]["message"]["content"]
    except (urllib.error.URLError, TimeoutError, KeyError, IndexError, json.JSONDecodeError):
        return None

    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        m = re.search(r"\{[\s\S]*\}", content)
        if not m:
            return None
        try:
            data = json.loads(m.group())
        except json.JSONDecodeError:
            return None

    label = str(data.get("label", "neutral")).lower()
    if label not in {"positive", "neutral", "negative"}:
        label = "neutral"
    try:
        compound = float(data.get("compound", 0.0))
    except (TypeError, ValueError):
        compound = 0.0
    compound = max(-1.0, min(1.0, compound))

    if compound >= 0.05:
        label = "positive" if label == "neutral" else label
    elif compound <= -0.05:
        label = "negative" if label == "neutral" else label

    pos = max(0.0, compound) if compound > 0 else 0.0
    neg = max(0.0, -compound) if compound < 0 else 0.0
    neu = max(0.0, 1.0 - pos - neg)
    return SentimentResult(
        label=label,
        compound=compound,
        pos=pos,
        neu=neu,
        neg=neg,
    )
