from __future__ import annotations

import json
import re
import urllib.error
import urllib.request

from app.core.config import settings
from app.ml.sentiment_service import SentimentResult


def sentiment_openai(notes: str | None, title: str | None) -> SentimentResult | None:
    """
    GPT-4o-mini (or OPENAI_MODEL) structured sentiment; returns None on failure.
    """
    key = (settings.OPENAI_API_KEY or "").strip()
    if not key:
        return None

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
        "model": settings.OPENAI_MODEL,
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

    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
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
