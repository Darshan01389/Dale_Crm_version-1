import logging
import pandas as pd
from pathlib import Path
from datetime import datetime, timezone
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.lead import Lead
from app.models.activity import Activity
from app.models.task import Task
from app.models.voice_recording import VoiceRecording
from app.models.deal import Deal
from app.models.user import User
from app.core.config import settings

log = logging.getLogger(__name__)

CSV_COLUMNS = [
    'lead_source', 'engagement_score', 'num_contacts', 'prev_outcome', 
    'occupation', 'education', 'age', 'num_prev_contacts', 
    'days_since_last_contact', 'converted', 'dataset_source', 
    'lead_source_std', 'prev_outcome_std', 'contact_intensity', 
    'recency_score', 'lead_score', 'lead_tier', 'had_prev_contact',
    'salesperson_win_rate'
]

def sync_db_leads_to_csv(db: Session, csv_path: Path) -> int:
    """
    Syncs completed/active leads from the database into the CSV training dataset.
    Extracts high-fidelity interaction features and filters out noise.
    """
    try:
        # 1. Fetch leads from database
        db_leads = db.query(Lead).all()
        if not db_leads:
            log.info("No leads found in database to sync.")
            return 0

        # Calculate global win rate fallback
        total_global = db.query(Deal).filter(Deal.outcome.in_(["won", "lost"])).count()
        won_global = db.query(Deal).filter(Deal.outcome == "won").count()
        global_win_rate = (won_global / total_global) if total_global > 0 else 0.15

        # Cache of salesperson win rates to avoid redundant queries
        rep_win_rates = {}

        # 2. Map DB leads to training features
        new_rows = []
        for lead in db_leads:
            # Noise Filtering: Skip test/dummy domains or emails
            email_lower = (lead.email or "").lower().strip()
            name_lower = (lead.title or "").lower().strip()
            notes_lower = (lead.notes or "").lower().strip()
            
            is_test_lead = (
                "test@" in email_lower or 
                "example.com" in email_lower or
                "dealcrm.com" in email_lower or
                "voiceiq.ai" in email_lower or
                "test" in name_lower or
                "demo" in name_lower or
                "example" in name_lower
            )
            if is_test_lead:
                continue

            # Calculate relational interaction metrics
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
                # Ensure datetime objects are timezone-naive to match utcnow() or make both aware
                if latest_contact.tzinfo is not None:
                    latest_contact = latest_contact.replace(tzinfo=None)
                days_since = (datetime.utcnow() - latest_contact).total_seconds() / 86400.0
                days_since_last_contact = max(0.0, float(days_since))
            else:
                days_since_last_contact = 194.0

            # Calculate secondary features
            contact_intensity = num_contacts / (days_since_last_contact + 1.0)
            recency_score = 1.0 / (days_since_last_contact + 1.0)

            # Determine conversion status (Outcome-based filtering)
            lead_deals = db.query(Deal).filter(Deal.lead_id == lead.id).all()
            has_won_deal = any(d.outcome == "won" for d in lead_deals)
            has_lost_deal = any(d.outcome == "lost" for d in lead_deals)

            if has_won_deal or lead.status == "won":
                converted_val = 1
            elif has_lost_deal or lead.status in ["lost", "junk", "unqualified"]:
                converted_val = 0
            else:
                # Open/unresolved lead
                lead_created = lead.created_at.replace(tzinfo=None) if lead.created_at.tzinfo is not None else lead.created_at
                age_days = (datetime.utcnow() - lead_created).total_seconds() / 86400.0
                if age_days < 60.0:
                    # Skip young open leads to prevent false negative label noise
                    continue
                else:
                    # Treat stale unresolved leads as not converted
                    converted_val = 0

            # Calculate salesperson historical win rate
            rep_id = lead.assigned_to or lead.owner_id
            if rep_id not in rep_win_rates:
                rep_deals = db.query(Deal).filter(Deal.owner_id == rep_id, Deal.outcome.in_(["won", "lost"])).count()
                rep_won = db.query(Deal).filter(Deal.owner_id == rep_id, Deal.outcome == "won").count()
                rep_win_rates[rep_id] = (rep_won / rep_deals) if rep_deals > 0 else global_win_rate
            
            salesperson_win_rate = rep_win_rates[rep_id]

            src = lead.source or "unknown"
            src_std = src.lower().replace(" ", "_")[:120] or "unknown"

            row = {
                "lead_source": src,
                "engagement_score": float((lead.sentiment_compound + 1.0) / 2.0) if lead.sentiment_compound is not None else 0.5,
                "num_contacts": num_contacts,
                "prev_outcome": "unknown",
                "occupation": lead.occupation or "unknown",
                "education": lead.education or "unknown",
                "age": float(lead.age if lead.age is not None else 40.0),
                "num_prev_contacts": 0.0,
                "days_since_last_contact": days_since_last_contact,
                "converted": int(converted_val),
                "dataset_source": "live_crm",
                "lead_source_std": src_std,
                "prev_outcome_std": "unknown",
                "contact_intensity": contact_intensity,
                "recency_score": recency_score,
                "lead_score": float(lead.ai_score if lead.ai_score is not None else 50.0),
                "lead_tier": lead.category or "Tier 2",
                "had_prev_contact": had_prev_contact,
                "salesperson_win_rate": salesperson_win_rate
            }
            new_rows.append(row)

        df_new = pd.DataFrame(new_rows)

        # 3. Load existing training dataset
        if csv_path.exists():
            df_old = pd.read_csv(csv_path)
            # Remove any previously synced live CRM rows to avoid duplicate accumulation
            df_old = df_old[df_old["dataset_source"] != "live_crm"]
            # Combine historical dataset with refreshed live database leads
            df_combined = pd.concat([df_old, df_new], ignore_index=True)
        else:
            df_combined = df_new

        # Ensure all required columns are present in the correct order
        for col in CSV_COLUMNS:
            if col not in df_combined.columns:
                df_combined[col] = 0.0
        
        df_combined = df_combined[CSV_COLUMNS]

        # 4. Save back to CSV
        df_combined.to_csv(csv_path, index=False)
        log.info("Successfully synced %d database leads to %s for ML training", len(new_rows), csv_path)
        return len(new_rows)

    except Exception as e:
        log.error("Failed to sync database leads to training dataset: %s", e)
        return 0
