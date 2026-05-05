from __future__ import annotations

import logging
import smtplib
from email.mime.text import MIMEText

from app.core.config import settings

log = logging.getLogger(__name__)


def send_high_score_alert(highlights: list[tuple[str, float]]) -> None:
    """Optional SMTP alert after background scoring (config-gated)."""
    if not highlights or not settings.SEND_HIGH_SCORE_ALERTS:
        return
    host = settings.SMTP_HOST
    to_addr = settings.ALERT_EMAIL_TO
    from_addr = settings.SMTP_FROM or settings.SMTP_USER
    if not host or not to_addr or not from_addr or not settings.SMTP_USER:
        log.debug("SMTP not fully configured; skip alert.")
        return

    lines = "\n".join(f"  {lid}: ai_score={score:.1f}" for lid, score in highlights)
    body = (
        f"Leads at or above {settings.HIGH_SCORE_ALERT_THRESHOLD} "
        f"(after scheduled refresh):\n{lines}"
    )
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = "DeaL CRM: high-score lead alert"
    msg["From"] = from_addr
    msg["To"] = to_addr

    try:
        with smtplib.SMTP(host, settings.SMTP_PORT, timeout=30) as smtp:
            smtp.starttls()
            if settings.SMTP_USER:
                smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD or "")
            smtp.sendmail(from_addr, [to_addr], msg.as_string())
    except Exception as exc:
        log.warning("Could not send alert email: %s", exc)
