from __future__ import annotations

from app.ml.predictor import analyze_lead_ml_and_sentiment
from app.schemas.lead import LeadCreate
from app.services.ai_scoring_service import score_new_lead


def analyze_new_lead(lead: LeadCreate) -> dict:
    """
    XGBoost (or RF fallback) tabular scorer on the merged dataset artifact,
    plus Ollama sentiment when configured (else VADER).
    Falls back to heuristic scoring only when ML artifacts are unavailable.
    """
    out = analyze_lead_ml_and_sentiment(lead)
    sentiment = out["sentiment"]
    ml = out["ml"]

    if ml is not None:
        ml_score = round(ml["ml_lead_score"], 1)
        conv = round(ml["conversion_probability"], 1)
        blended = round(ml["blended_score"], 1)
        summary = (
            f"Trained-model lead score {ml_score:.1f}; "
            f"conversion est. {conv:.1f}%; "
            f"sentiment {sentiment.label} ({sentiment.compound:+.2f})."
        )
        return {
            "ai_score": blended,
            "ai_score_summary": summary,
            "sentiment_label": sentiment.label,
            "sentiment_compound": round(sentiment.compound, 4),
            "ml_lead_score": ml_score,
            "conversion_probability": conv,
        }

    ai_score, base_summary = score_new_lead(lead)
    summary = (
        f"{base_summary} Sentiment: {sentiment.label} ({sentiment.compound:+.2f})."
    )
    return {
        "ai_score": round(float(ai_score), 1),
        "ai_score_summary": summary,
        "sentiment_label": sentiment.label,
        "sentiment_compound": round(sentiment.compound, 4),
        "ml_lead_score": None,
        "conversion_probability": None,
    }
