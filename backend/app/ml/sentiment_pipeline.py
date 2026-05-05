from __future__ import annotations

from app.core.config import settings
from app.ml.sentiment_openai import sentiment_openai
from app.ml.sentiment_service import SentimentResult, notes_sentiment


def sentiment_for_lead(notes: str | None, title: str | None) -> SentimentResult:
    """
    Prefer OpenAI (gpt-4o-mini) when configured; fall back to VADER for speed/offline.
    """
    if settings.USE_OPENAI_SENTIMENT and (settings.OPENAI_API_KEY or "").strip():
        r = sentiment_openai(notes, title)
        if r is not None:
            return r
    return notes_sentiment(notes, title)
