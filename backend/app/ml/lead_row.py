from __future__ import annotations

from datetime import datetime
from typing import Optional

import pandas as pd
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.ml.sentiment_service import SentimentResult
from app.schemas.lead import LeadCreate

_DEFAULT_DAYS_SINCE = 194.0
_DEFAULT_RECENCY = 0.777268


def _digits(s: str) -> str:
    return "".join(ch for ch in s if ch.isdigit())


def _get_live_features(lead_email: Optional[str], db: Optional[Session]) -> dict:
    """
    Query the live DB for interaction features of a lead matching lead_email.
    Returns a dict of interaction features, or defaults if no DB session is given.
    """
    defaults = {
        "num_contacts": 1.0,
        "had_prev_contact": 0.0,
        "num_prev_contacts": 0.0,
        "days_since_last_contact": _DEFAULT_DAYS_SINCE,
        "contact_intensity": 1.0 / (_DEFAULT_DAYS_SINCE + 1.0),
        "recency_score": _DEFAULT_RECENCY,
    }

    if db is None or not lead_email:
        return defaults

    try:
        from app.models.lead import Lead
        from app.models.activity import Activity
        from app.models.task import Task
        from app.models.voice_recording import VoiceRecording

        # Find the lead by email to get interaction counts
        lead = db.query(Lead).filter(Lead.email == lead_email).first()
        if lead is None:
            return defaults

        act_count = db.query(Activity).filter(Activity.lead_id == lead.id).count()
        task_count = db.query(Task).filter(Task.lead_id == lead.id).count()
        rec_count = db.query(VoiceRecording).filter(VoiceRecording.lead_id == lead.id).count()

        num_contacts = float(act_count + task_count + rec_count + (lead.website_visits or 0))
        had_prev_contact = 1.0 if (act_count + task_count + rec_count) > 0 else 0.0

        # Calculate days since last contact
        latest_act = db.query(func.max(Activity.occurred_at)).filter(Activity.lead_id == lead.id).scalar()
        latest_rec = db.query(func.max(VoiceRecording.occurred_at)).filter(VoiceRecording.lead_id == lead.id).scalar()

        timestamps = [lead.last_contacted_at, lead.updated_at]
        if latest_act:
            timestamps.append(latest_act)
        if latest_rec:
            timestamps.append(latest_rec)

        valid_ts = [ts for ts in timestamps if ts is not None]
        if valid_ts:
            latest_contact = max(valid_ts)
            if latest_contact.tzinfo is not None:
                latest_contact = latest_contact.replace(tzinfo=None)
            days_since = (datetime.utcnow() - latest_contact).total_seconds() / 86400.0
            days_since = max(0.0, float(days_since))
        else:
            days_since = _DEFAULT_DAYS_SINCE

        contact_intensity = num_contacts / (days_since + 1.0)
        recency_score = 1.0 / (days_since + 1.0)

        return {
            "num_contacts": num_contacts,
            "had_prev_contact": had_prev_contact,
            "num_prev_contacts": float(act_count + rec_count),
            "days_since_last_contact": days_since,
            "contact_intensity": contact_intensity,
            "recency_score": recency_score,
        }
    except Exception:
        return defaults


def lead_to_feature_frame(
    lead: LeadCreate,
    sentiment: SentimentResult,
    bundle: dict,
    db: Optional[Session] = None,
) -> pd.DataFrame:
    cat_cols: list[str] = bundle["cat_cols"]
    num_cols: list[str] = bundle["num_cols"]
    d: dict = bundle["defaults"]

    # Derive engagement from sentiment + contact signals
    engagement = (sentiment.compound + 1.0) / 2.0
    if lead.email and "@" in lead.email:
        engagement = min(1.0, engagement + 0.04)
    if lead.phone and len(_digits(lead.phone or "")) >= 7:
        engagement = min(1.0, engagement + 0.04)
    engagement = max(0.0, min(1.0, float(engagement)))

    src_raw = (lead.source or "").strip() or "unknown"
    lead_source = src_raw
    lead_source_std = src_raw.lower().replace(" ", "_")[:120] or "unknown"

    # Query live DB for interaction-derived features
    live = _get_live_features(lead.email, db)

    row = {
        "lead_source": lead_source,
        "prev_outcome": "unknown",
        "occupation": (lead.occupation or d.get("occupation", "unknown")),
        "education": (lead.education or d.get("education", "unknown")),
        "dataset_source": "live_crm",
        "lead_source_std": lead_source_std,
        "prev_outcome_std": "unknown",
        "engagement_score": engagement,
        "num_contacts": live["num_contacts"],
        "age": float(lead.age if lead.age is not None else d.get("age", 40.0)),
        "num_prev_contacts": live["num_prev_contacts"],
        "days_since_last_contact": live["days_since_last_contact"],
        "contact_intensity": live["contact_intensity"],
        "recency_score": live["recency_score"],
        "had_prev_contact": live["had_prev_contact"],
    }

    ordered = {c: row[c] for c in cat_cols + num_cols}
    return pd.DataFrame([ordered])
