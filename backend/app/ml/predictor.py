from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.ml.lead_row import lead_to_feature_frame
from app.ml.sentiment_pipeline import sentiment_for_lead
from app.ml.sentiment_service import SentimentResult
from app.ml.trainer import CAT_COLS, load_bundle, save_bundle, train_bundle
from app.schemas.lead import LeadCreate

log = logging.getLogger(__name__)

_bundle: dict | None = None
_error: str | None = None


def artifacts_path() -> Path:
    base = Path(__file__).resolve().parent / "artifacts"
    return base / "lead_bundle.joblib"


def warm_ml_models() -> None:
    global _bundle, _error
    _error = None
    try:
        # Check if dataset exists to avoid crash during dev setup
        csv = Path(settings.MERGED_LEAD_DATASET_PATH)
        if not csv.is_file():
            log.warning("Dataset not found at %s. ML scoring will be unavailable until trained.", csv)
            _bundle = None
            return

        _bundle = _load_or_train()
        if _bundle:
            log.info(
                "Lead ML ready (rows=%s, trained_at=%s)",
                _bundle.get("n_rows"),
                _bundle.get("trained_at"),
            )
        else:
            log.warning("Lead ML bundle not available; using fallback scoring.")
    except Exception as exc: 
        _bundle = None
        _error = str(exc)
        log.error("Lead ML warmup failed: %s", exc)


def ml_status() -> dict:
    return {
        "available": _bundle is not None,
        "error": _error,
        "artifact": str(artifacts_path()) if _bundle else None,
        "rows": _bundle.get("n_rows") if _bundle else None,
        "test_rows": _bundle.get("test_rows") if _bundle else None,
        "trained_at": _bundle.get("trained_at") if _bundle else None,
        "scorer": _bundle.get("scorer") if _bundle else None,
        "accuracy_pct": _bundle.get("accuracy_pct") if _bundle else None,
        "score_rmse": _bundle.get("score_rmse") if _bundle else None,
        "score_r2": _bundle.get("score_r2") if _bundle else None,
        "segmental_metrics": _bundle.get("segmental_metrics") if _bundle else None,
        "rare_categories_grouped": {k: len(v) for k, v in (_bundle.get("rare_map") or {}).items()} if _bundle else None,
    }


def train_and_evaluate() -> dict:
    try:
        csv = Path(settings.MERGED_LEAD_DATASET_PATH)

        # Sync database leads to the training CSV file first
        from app.core.database import SessionLocal
        from app.ml.db_dataset_sync import sync_db_leads_to_csv
        db = SessionLocal()
        try:
            sync_db_leads_to_csv(db, csv)
        finally:
            db.close()

        if not csv.is_file():
            raise FileNotFoundError(f"Dataset not found at {csv}")

        bundle = train_bundle(csv, settings.ML_MAX_TRAIN_ROWS)
        save_bundle(bundle, artifacts_path())
        global _bundle
        _bundle = bundle
        return ml_status()
    except Exception as e:
        log.error("Training failed: %s", e)
        return {"error": str(e), "available": False}


def _load_or_train() -> dict | None:
    try:
        csv = Path(settings.MERGED_LEAD_DATASET_PATH)
        path = artifacts_path()
        if not settings.ML_FORCE_RETRAIN and path.exists():
            return load_bundle(path)

        # Sync database leads to the training CSV file first
        from app.core.database import SessionLocal
        from app.ml.db_dataset_sync import sync_db_leads_to_csv
        db = SessionLocal()
        try:
            sync_db_leads_to_csv(db, csv)
        finally:
            db.close()

        if not csv.is_file():
            return load_bundle(path) if path.exists() else None

        bundle = train_bundle(csv, settings.ML_MAX_TRAIN_ROWS)
        save_bundle(bundle, path)
        return bundle
    except Exception as e:
        log.error("Model load/train failed: %s", e)
        return None


def predict_with_bundle(
    lead: LeadCreate,
    sentiment: SentimentResult,
    db: Optional[Session] = None,
) -> dict | None:
    try:
        if _bundle is None:
            return None
        frame = lead_to_feature_frame(lead, sentiment, _bundle, db=db)

        # Apply rare-category grouping at inference time (mirrors training transform)
        rare_map: dict = _bundle.get("rare_map") or {}
        for col, rare_vals in rare_map.items():
            if col in frame.columns:
                frame[col] = frame[col].apply(lambda v: "__rare__" if v in rare_vals else v)

        X_t = _bundle["preprocess"].transform(frame)
        reg_score = float(_bundle["reg"].predict(X_t)[0])
        reg_score = max(0.0, min(100.0, reg_score))
        conv = float(_bundle["clf"].predict_proba(X_t)[0][1]) * 100.0
        conv = max(0.0, min(100.0, conv))
        blended = max(0.0, min(100.0, 0.62 * reg_score + 0.38 * conv))
        return {
            "ml_lead_score": reg_score,
            "conversion_probability": conv,
            "blended_score": blended,
        }
    except Exception as e:
        log.error("Prediction failed: %s", e)
        return None


def analyze_lead_ml_and_sentiment(lead: LeadCreate, db: Optional[Session] = None) -> dict:
    sentiment = sentiment_for_lead(lead.notes, lead.title)
    ml = predict_with_bundle(lead, sentiment, db=db)
    return {"sentiment": sentiment, "ml": ml}

