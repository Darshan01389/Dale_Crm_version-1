from __future__ import annotations

import pandas as pd

from app.ml.sentiment_service import SentimentResult
from app.schemas.lead import LeadCreate

_DEFAULT_DAYS_SINCE = 194.0
_DEFAULT_RECENCY = 0.777268


def _digits(s: str) -> str:
    return "".join(ch for ch in s if ch.isdigit())


def lead_to_feature_frame(
    lead: LeadCreate,
    sentiment: SentimentResult,
    bundle: dict,
) -> pd.DataFrame:
    cat_cols: list[str] = bundle["cat_cols"]
    num_cols: list[str] = bundle["num_cols"]
    d: dict = bundle["defaults"]

    engagement = (sentiment.compound + 1.0) / 2.0
    if lead.email and "@" in lead.email:
        engagement = min(1.0, engagement + 0.04)
    if lead.phone and len(_digits(lead.phone or "")) >= 7:
        engagement = min(1.0, engagement + 0.04)
    engagement = max(0.0, min(1.0, float(engagement)))

    src_raw = (lead.source or "").strip() or "unknown"
    lead_source = src_raw
    lead_source_std = src_raw.lower().replace(" ", "_")[:120]
    if not lead_source_std:
        lead_source_std = "unknown"

    row = {
        "lead_source": lead_source,
        "prev_outcome": "unknown",
        "occupation": (lead.occupation or d.get("occupation", "unknown")),
        "education": (lead.education or d.get("education", "unknown")),
        "dataset_source": "live_crm",
        "lead_source_std": lead_source_std,
        "prev_outcome_std": "unknown",
        "engagement_score": engagement,
        "num_contacts": 1.0,
        "age": float(lead.age if lead.age is not None else d.get("age", 40.0)),
        "num_prev_contacts": 0.0,
        "days_since_last_contact": float(
            d.get("days_since_last_contact", _DEFAULT_DAYS_SINCE)
        ),
        "contact_intensity": float(d.get("contact_intensity", 1.0)),
        "recency_score": float(d.get("recency_score", _DEFAULT_RECENCY)),
        "had_prev_contact": 0.0,
    }

    ordered = {c: row[c] for c in cat_cols + num_cols}
    return pd.DataFrame([ordered])
