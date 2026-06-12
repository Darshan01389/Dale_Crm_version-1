from __future__ import annotations

from dataclasses import dataclass

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

_analyzer: SentimentIntensityAnalyzer | None = None


def _get_analyzer() -> SentimentIntensityAnalyzer:
    global _analyzer
    if _analyzer is None:
        _analyzer = SentimentIntensityAnalyzer()
    return _analyzer


@dataclass(frozen=True)
class SentimentResult:
    label: str
    compound: float
    pos: float
    neu: float
    neg: float


def analyze_text(text: str | None) -> SentimentResult:
    """
    Fast lexical sentiment (VADER). Suitable for short CRM notes / titles.
    """
    raw = (text or "").strip()
    if not raw:
        return SentimentResult(
            label="neutral",
            compound=0.0,
            pos=0.0,
            neu=1.0,
            neg=0.0,
        )

    scores = _get_analyzer().polarity_scores(raw)
    compound = float(scores["compound"])
    if compound >= 0.05:
        label = "positive"
    elif compound <= -0.05:
        label = "negative"
    else:
        label = "neutral"

    return SentimentResult(
        label=label,
        compound=compound,
        pos=float(scores["pos"]),
        neu=float(scores["neu"]),
        neg=float(scores["neg"]),
    )


def notes_sentiment(notes: str | None, title: str | None = None) -> SentimentResult:
    blob = " ".join(p for p in [title or "", notes or ""] if p).strip()
    return analyze_text(blob or None)
