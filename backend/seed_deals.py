import sys
import os
import random
from datetime import datetime, timedelta

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.lead import Lead
from app.models.deal import Deal
from app.models.pipeline_stage import PipelineStage

def seed_deals():
    db = SessionLocal()
    try:
        # Get stages
        stages = db.query(PipelineStage).all()
        if not stages:
            print("No pipeline stages found. Please seed stages first.")
            return
        
        stage_map = {s.stage_key: s.id for s in stages}
        stage_keys = list(stage_map.keys())

        # Get leads
        leads = db.query(Lead).all()
        if not leads:
            print("No leads found. Run add_indian_leads.py first.")
            return

        print(f"Found {len(leads)} leads. Creating deals...")

        for lead in leads:
            # Check if deal already exists for this lead
            existing = db.query(Deal).filter(Deal.lead_id == lead.id).first()
            if existing:
                continue
            
            # Create a deal for most leads (80% chance)
            if random.random() > 0.8:
                continue

            stage_key = random.choice(stage_keys)
            amount = float(lead.deal_value or random.randint(50000, 500000))
            
            # Outcome logic
            outcome = "open"
            if stage_key == "won":
                outcome = "won"
            elif stage_key == "lost":
                outcome = "lost"

            deal = Deal(
                owner_id=lead.assigned_to or lead.owner_id,
                lead_id=lead.id,
                title=f"Deal for {lead.title}",
                stage_id=stage_map[stage_key],
                amount=amount,
                currency="INR",
                probability=random.randint(10, 90),
                expected_close_date=(datetime.utcnow() + timedelta(days=random.randint(10, 60))).date(),
                outcome=outcome,
                notes=f"Generated deal from lead {lead.email}"
            )
            db.add(deal)
        
        db.commit()
        print("Successfully seeded deals for existing leads!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding deals: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_deals()
