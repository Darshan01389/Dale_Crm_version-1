import os
import sys
import uuid
import random
from datetime import datetime, timedelta

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.company import Company
from app.models.user import User
from app.models.team import Team
from app.models.lead import Lead
from app.models.deal import Deal
from app.models.activity import Activity
from app.models.pipeline_stage import PipelineStage

def seed_demo_data():
    db: Session = SessionLocal()
    try:
        print("Seeding Demo Data...")
        
        # 1. Create or Find Demo Company
        demo_company = db.query(Company).filter(Company.name == "Demo Environment").first()
        if not demo_company:
            demo_company = Company(name="Demo Environment", industry="Software")
            db.add(demo_company)
            db.commit()
            db.refresh(demo_company)
            print(f"Created Demo Company: {demo_company.id}")
        else:
            print(f"Demo Company found: {demo_company.id}")

        # 2. Assign Demo Users to Demo Company
        demo_emails = ["sales@gmail.com", "manager@gmail.com", "admin@gmail.com"]
        demo_users = []
        for email in demo_emails:
            user = db.query(User).filter(User.email == email).first()
            if user:
                user.company_id = demo_company.id
                demo_users.append(user)
                print(f"Assigned {user.email} to Demo Company.")
        
        db.commit()

        if not demo_users:
            print("No demo users found! Please ensure sales/manager/admin accounts exist.")
            return

        # Use the first available demo user (e.g. sales) to own the data
        owner = next((u for u in demo_users if u.email == "sales@gmail.com"), demo_users[0])

        # 3. Clear existing demo data (Optional: to prevent duplicates on multiple runs)
        existing_leads = db.query(Lead).filter(Lead.company_id == demo_company.id).all()
        for lead in existing_leads:
            db.query(Deal).filter(Deal.lead_id == lead.id).delete()
            db.query(Activity).filter(Activity.lead_id == lead.id).delete()
        db.query(Lead).filter(Lead.company_id == demo_company.id).delete()
        db.commit()

        # 4. Generate Demo Leads
        mock_leads_data = [
            {"title": "Sarah Jenkins", "company": "TechFlow Inc", "status": "new", "ai_score": 92.5, "priority": 1, "intent": "High"},
            {"title": "Marcus Chen", "company": "Global Logistics", "status": "contacted", "ai_score": 78.0, "priority": 2, "intent": "Medium"},
            {"title": "Elena Rodriguez", "company": "HealthPlus Systems", "status": "qualified", "ai_score": 88.5, "priority": 1, "intent": "High"},
            {"title": "David Kim", "company": "Retail Innovators", "status": "new", "ai_score": 45.0, "priority": 3, "intent": "Low"}
        ]

        # Fetch a valid pipeline stage
        stage = db.query(PipelineStage).first()
        stage_id = stage.id if stage else None

        now = datetime.utcnow()
        for lead_data in mock_leads_data:
            lead = Lead(
                id=uuid.uuid4(),
                owner_id=owner.id,
                company_id=demo_company.id,
                title=lead_data["title"],
                lead_company_name=lead_data["company"],
                status=lead_data["status"],
                ai_score=lead_data["ai_score"],
                priority_rank=lead_data["priority"],
                intent_level=lead_data["intent"],
                created_at=now - timedelta(days=random.randint(1, 14))
            )
            db.add(lead)
            
            # Add a Deal for qualified leads
            if lead.status == "qualified" and stage_id:
                deal = Deal(
                    id=uuid.uuid4(),
                    lead_id=lead.id,
                    owner_id=owner.id,
                    title=f"Enterprise License - {lead.lead_company_name}",
                    amount=random.choice([15000.0, 25000.0, 50000.0]),
                    stage_id=stage_id,
                    outcome="open",
                    created_at=lead.created_at + timedelta(days=1)
                )
                db.add(deal)

            # Add an Activity
            activity = Activity(
                id=uuid.uuid4(),
                lead_id=lead.id,
                owner_id=owner.id,
                activity_type="call",
                subject=f"Discovery call with {lead.title}",
                occurred_at=lead.created_at + timedelta(hours=2)
            )
            db.add(activity)

        db.commit()
        print("Demo data successfully seeded!")

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data()
