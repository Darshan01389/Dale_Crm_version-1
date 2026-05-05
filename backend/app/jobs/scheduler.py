from __future__ import annotations

import logging

from apscheduler.schedulers.background import BackgroundScheduler

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.lead import Lead
from app.services import lead_service
from app.services.notification_service import send_high_score_alert

log = logging.getLogger(__name__)

_scheduler: BackgroundScheduler | None = None


def _score_refresh_job() -> None:
    db = SessionLocal()
    highlights: list[tuple[str, float]] = []
    try:
        id_rows = (
            db.query(Lead.id)
            .order_by(Lead.updated_at.asc())
            .limit(settings.SCORE_REFRESH_BATCH_SIZE)
            .all()
        )
        for (lid,) in id_rows:
            lead = db.query(Lead).filter(Lead.id == lid).first()
            if lead is None:
                continue
            before = lead.ai_score
            try:
                lead_service.refresh_lead_analysis(db, lead)
            except Exception as exc:
                log.warning("Score refresh failed for lead %s: %s", lid, exc)
                db.rollback()
                continue
            if (
                lead.ai_score is not None
                and lead.ai_score >= settings.HIGH_SCORE_ALERT_THRESHOLD
                and (before is None or lead.ai_score > before)
            ):
                highlights.append((str(lead.id), float(lead.ai_score)))
        send_high_score_alert(highlights)
    finally:
        db.close()


def start_scheduler() -> BackgroundScheduler | None:
    global _scheduler
    if _scheduler is not None:
        return _scheduler
    if settings.SCORE_REFRESH_MINUTES <= 0:
        log.info("Background score refresh disabled (SCORE_REFRESH_MINUTES=0).")
        return None
    sched = BackgroundScheduler()
    sched.add_job(
        _score_refresh_job,
        "interval",
        minutes=settings.SCORE_REFRESH_MINUTES,
        id="lead_score_refresh",
        replace_existing=True,
    )
    sched.start()
    log.info(
        "Background scheduler started (score refresh every %s min, batch=%s)",
        settings.SCORE_REFRESH_MINUTES,
        settings.SCORE_REFRESH_BATCH_SIZE,
    )
    _scheduler = sched
    return sched


def shutdown_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
