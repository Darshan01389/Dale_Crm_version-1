import os
import sys
import uuid
import random
from datetime import datetime, timedelta

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.lead_source import LeadSource
from app.models.automation_rule import AutomationRule
from app.models.webhook_log import WebhookLog
from app.models.user import User

def seed_lead_sources():
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(LeadSource).count() > 0:
            print("Lead sources already exist. Deleting existing records to start fresh...")
            db.query(WebhookLog).delete()
            db.query(LeadSource).delete()
            db.query(AutomationRule).delete()
            db.commit()

        print("Seeding Lead Sources...")
        
        # 1. Lead Sources
        source1 = LeadSource(
            id=uuid.uuid4(),
            name="Main Website Form",
            platform_type="Website",
            status="Connected",
            sync_schedule="Real-time",
            last_sync_at=datetime.utcnow() - timedelta(minutes=5),
            is_active=True
        )
        source2 = LeadSource(
            id=uuid.uuid4(),
            name="Facebook Lead Ads",
            platform_type="Facebook Ads",
            status="Connected",
            sync_schedule="Hourly",
            last_sync_at=datetime.utcnow() - timedelta(hours=1),
            is_active=True
        )
        source3 = LeadSource(
            id=uuid.uuid4(),
            name="Zapier Catch Hook",
            platform_type="Custom Webhook",
            status="Disconnected",
            sync_schedule="Manual",
            is_active=False
        )
        
        db.add_all([source1, source2, source3])
        db.commit()

        # 2. Automation Rules
        # Fetch the admin user to assign leads to
        admin = db.query(User).filter(User.email == "admin@gmail.com").first()
        admin_id = str(admin.id) if admin else str(uuid.uuid4())

        rule1 = AutomationRule(
            id=uuid.uuid4(),
            name="Route High Intent to Admin",
            description="Automatically assign leads with high intent to the Admin.",
            is_active=True,
            conditions={"field": "intent", "operator": "equals", "value": "High"},
            action_type="assign_to_user",
            action_payload={"user_id": admin_id}
        )
        rule2 = AutomationRule(
            id=uuid.uuid4(),
            name="Facebook Leads to Demo Team",
            description="Route all incoming Facebook Leads to the demo team.",
            is_active=True,
            conditions={"field": "source", "operator": "equals", "value": "Facebook Ads"},
            action_type="assign_to_user",
            action_payload={"user_id": admin_id}
        )
        
        db.add_all([rule1, rule2])
        db.commit()

        # 3. Webhook Logs (simulate traffic for source1 and source2)
        print("Seeding Webhook Logs...")
        logs = []
        for i in range(15):
            src = source1 if i % 2 == 0 else source2
            status = "Processed" if random.random() > 0.2 else "Failed"
            msg = None if status == "Processed" else "Missing required field: email"
            
            log = WebhookLog(
                id=uuid.uuid4(),
                source_id=src.id,
                payload={"first_name": "Demo", "last_name": f"User_{i}", "email": f"demo{i}@test.com"},
                status=status,
                error_message=msg,
                created_at=datetime.utcnow() - timedelta(minutes=random.randint(1, 1440))
            )
            logs.append(log)
            
        db.add_all(logs)
        db.commit()

        print("Lead Sources, Automation Rules, and Webhook Logs seeded successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_lead_sources()
