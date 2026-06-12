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


def _lead_source_pull_job() -> None:
    import urllib.request
    import urllib.parse
    import json
    from datetime import datetime
    from sqlalchemy import create_engine, text
    from app.models.lead_source import LeadSource
    from app.models.lead import Lead
    from app.services import lead_service
    from app.schemas.lead import LeadCreate
    from app.models.user import User

    db = SessionLocal()
    try:
        active_sources = db.query(LeadSource).filter(
            LeadSource.is_active == True,
            LeadSource.platform_type.in_(["REST API", "Database API"])
        ).all()

        for source in active_sources:
            try:
                # Decrypted credentials from auth_config are handled transparently by EncryptedJSON
                config = source.auth_config or {}
                mapping = source.field_mapping or {}
                
                new_leads_data = []
                sync_time = datetime.utcnow()

                # Find default owner (first active manager or admin user)
                default_user = db.query(User).filter(User.role.in_(["Owner / Admin", "Manager"])).first()
                if not default_user:
                    default_user = db.query(User).first()
                owner_id = default_user.id if default_user else None

                if source.platform_type == "REST API":
                    api_url = config.get("api_url")
                    if not api_url:
                        continue
                    
                    # Add query parameter for incremental sync if timestamp parameter configured
                    since_param = config.get("since_param_name")
                    if since_param and source.last_sync_at:
                        parsed_url = urllib.parse.urlparse(api_url)
                        query_params = urllib.parse.parse_qs(parsed_url.query)
                        query_params[since_param] = [source.last_sync_at.isoformat()]
                        new_query = urllib.parse.urlencode(query_params, doseq=True)
                        api_url = urllib.parse.urlunparse((
                            parsed_url.scheme, parsed_url.netloc, parsed_url.path,
                            parsed_url.params, new_query, parsed_url.fragment
                        ))

                    headers = config.get("headers") or {}
                    headers = {str(k): str(v) for k, v in headers.items()}
                    
                    req = urllib.request.Request(api_url, headers=headers, method="GET")
                    try:
                        with urllib.request.urlopen(req, timeout=15) as resp:
                            body = resp.read().decode("utf-8")
                            res_json = json.loads(body)
                            
                            # Extract list of leads from JSON
                            lead_list = []
                            payload_field = config.get("payload_field")
                            if payload_field and isinstance(res_json, dict) and payload_field in res_json:
                                lead_list = res_json[payload_field]
                            elif isinstance(res_json, list):
                                lead_list = res_json
                            elif isinstance(res_json, dict):
                                # Fallback: search for first list value in dict
                                for val in res_json.values():
                                    if isinstance(val, list):
                                        lead_list = val
                                        break
                                else:
                                    lead_list = [res_json]
                            else:
                                lead_list = []

                            if not isinstance(lead_list, list):
                                lead_list = [lead_list]

                            for item in lead_list:
                                if not isinstance(item, dict):
                                    continue
                                new_leads_data.append(item)
                    except Exception as http_err:
                        log.error("REST API pull error for source %s: %s", source.id, http_err)
                        continue

                elif source.platform_type == "Database API":
                    conn_str = config.get("connection_string")
                    query_sql = config.get("query")
                    if not conn_str or not query_sql:
                        continue

                    # Execute query on external database
                    ext_engine = None
                    try:
                        ext_engine = create_engine(conn_str)
                        with ext_engine.connect() as conn:
                            params = {}
                            if ":last_sync" in query_sql or "last_sync" in query_sql:
                                params["last_sync"] = source.last_sync_at or datetime(2000, 1, 1)
                            
                            result = conn.execute(text(query_sql), params)
                            columns = result.keys()
                            for row in result.fetchall():
                                row_dict = dict(zip(columns, row))
                                new_leads_data.append(row_dict)
                    except Exception as db_err:
                        log.error("Database API pull error for source %s: %s", source.id, db_err)
                        continue
                    finally:
                        if ext_engine:
                            ext_engine.dispose()

                # Process pulled data and insert leads
                imported_count = 0
                for item in new_leads_data:
                    try:
                        def get_mapped_field(crm_field):
                            csv_col = next((col for col, fld in mapping.items() if fld == crm_field), None)
                            if csv_col and csv_col in item and item[csv_col] is not None:
                                return str(item[csv_col]).strip()
                            return None

                        title_val = get_mapped_field("title") or get_mapped_field("lead_name") or item.get("name") or item.get("title")
                        if not title_val:
                            continue
                            
                        email_val = get_mapped_field("email") or item.get("email")
                        phone_val = get_mapped_field("phone") or item.get("phone")
                        
                        # De-duplicate check
                        if email_val:
                            dup = db.query(Lead).filter(Lead.email == email_val).first()
                            if dup:
                                continue
                        if phone_val:
                            dup = db.query(Lead).filter(Lead.phone == phone_val).first()
                            if dup:
                                continue
                        if title_val:
                            dup = db.query(Lead).filter(Lead.title == title_val, Lead.source == source.name).first()
                            if dup:
                                continue

                        company_val = get_mapped_field("company") or item.get("company")
                        status_val = get_mapped_field("status") or item.get("status") or "new"
                        notes_val = get_mapped_field("notes") or item.get("notes") or item.get("description")
                        occupation_val = get_mapped_field("occupation") or item.get("occupation")
                        education_val = get_mapped_field("education") or item.get("education")
                        
                        age_val = None
                        age_str = get_mapped_field("age") or item.get("age")
                        if age_str:
                            try:
                                age_val = float(age_str)
                            except:
                                pass
                                
                        deal_value_val = None
                        deal_val_str = get_mapped_field("deal_value") or item.get("deal_value")
                        if deal_val_str:
                            try:
                                deal_value_val = float(deal_val_str)
                            except:
                                pass

                        lead_create = LeadCreate(
                            title=title_val[:500],
                            company=company_val[:500] if company_val else None,
                            email=email_val[:320] if email_val else None,
                            phone=phone_val[:64] if phone_val else None,
                            status=status_val[:64],
                            source=source.name,
                            notes=notes_val,
                            occupation=occupation_val[:120] if occupation_val else None,
                            education=education_val[:120] if education_val else None,
                            age=age_val,
                            deal_value=deal_value_val
                        )

                        lead_service.create_lead(db, default_user, lead_create, None)
                        imported_count += 1
                    except Exception as lead_err:
                        log.warning("Failed to map lead item %s for source %s: %s", item, source.id, lead_err)

                # Update sync log
                source.last_sync_at = sync_time
                source.status = "Connected"
                db.commit()
                if imported_count > 0:
                    log.info("Successfully pulled and imported %s leads from source: %s", imported_count, source.name)
            except Exception as source_err:
                db.rollback()
                log.error("Error running sync for source %s: %s", source.id, source_err)
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
    sched.add_job(
        _lead_source_pull_job,
        "interval",
        minutes=15,
        id="lead_source_pull_sync",
        replace_existing=True,
    )
    # Automatically retrain the ML model daily to absorb new database leads
    from app.ml.predictor import train_and_evaluate
    sched.add_job(
        train_and_evaluate,
        "cron",
        hour=2,
        id="ml_model_daily_retrain",
        replace_existing=True,
    )
    sched.start()
    log.info(
        "Background scheduler started (score refresh every %s min, pull sync every 15 min, ML retrain daily at 2:00 AM)",
        settings.SCORE_REFRESH_MINUTES,
    )
    _scheduler = sched
    return sched



def shutdown_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
