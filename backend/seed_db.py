import sys
import uuid
import random
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.core.security import hash_password

from app.models.user import User
from app.models.lead import Lead
from app.models.company import Company
from app.models.deal import Deal
from app.models.activity import Activity
from app.models.pipeline_stage import PipelineStage
from app.models.team import Team
from app.models.voice_recording import VoiceRecording

def seed_database():
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # 1. Admin User
        admin_email = "admin@voiceiq.ai"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            print(f"[+] Creating admin user: {admin_email}")
            admin = User(
                name="VoiceIQ Admin",
                email=admin_email,
                password_hash=hash_password("admin123"),
                role="admin",
                is_active=True
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print("    Admin user created.")
        else:
            print("[=] Admin user already exists.")

        # 2. Salesperson Users
        salesperson_data = [
            {"name": "Arjun Mehta",  "email": "arjun@voiceiq.ai"},
            {"name": "Priya Sharma", "email": "priya@voiceiq.ai"},
            {"name": "Rahul Gupta",  "email": "rahul@voiceiq.ai"},
            {"name": "Neha Kapoor",  "email": "neha@voiceiq.ai"},
            {"name": "Vikram Singh", "email": "vikram@voiceiq.ai"},
        ]
        sp_users = []
        for sp in salesperson_data:
            u = db.query(User).filter(User.email == sp["email"]).first()
            if not u:
                print(f"[+] Creating salesperson: {sp['name']}")
                u = User(
                    name=sp["name"],
                    email=sp["email"],
                    password_hash=hash_password("sales123"),
                    role="sales",
                    is_active=True
                )
                db.add(u)
            sp_users.append(u)
        db.commit()
        for u in sp_users:
            try:
                db.refresh(u)
            except Exception:
                pass

        # 3. Pipeline Stages
        default_stages = [
            ("New Lead",      "lead",        10),
            ("Qualified",     "qualified",   20),
            ("Proposal Sent", "proposal",    30),
            ("Negotiation",   "negotiation", 40),
            ("Won",           "won",         50),
            ("Lost",          "lost",        60),
        ]
        for label, key, order in default_stages:
            if not db.query(PipelineStage).filter(PipelineStage.stage_key == key).first():
                print(f"[+] Adding pipeline stage: {label}")
                db.add(PipelineStage(label=label, stage_key=key, sort_order=order))
        db.commit()

        # 4. Companies
        company_names = [
            "TechFlow Inc.", "Global Logistics", "Nexus Retail", "Aurora Health",
            "FinTech Solutions", "Apex Consultants", "Brightwave Media", "ClearPath Analytics",
        ]
        companies = []
        for name in company_names:
            c = db.query(Company).filter(Company.name == name).first()
            if not c:
                print(f"[+] Adding company: {name}")
                c = Company(name=name)
                db.add(c)
            companies.append(c)
        db.commit()
        for c in companies:
            try:
                db.refresh(c)
            except Exception:
                pass

        # 5. Leads — uses correct model fields: title, owner_id
        lead_data = [
            ("Sarah Jenkins",  "+91 98765 43210", "sarah@techflow.in",   92, "Interested"),
            ("Michael Chen",   "+91 91234 56789", "mchen@globlog.com",   88, "Negotiating"),
            ("David Miller",   "+91 90000 11111", "david@nexus.in",      84, "Proposal Sent"),
            ("Emily Davis",    "+91 88888 22222", "emily@aurora.in",     45, "Cold"),
            ("James Wilson",   "+91 77777 33333", "james@fintech.in",    76, "Meeting Set"),
            ("Radhika Iyer",   "+91 99001 23456", "radhika@apex.co.in",  81, "Interested"),
            ("Karan Malhotra", "+91 88001 34567", "karan@bright.in",     67, "Contacted"),
            ("Sunita Nair",    "+91 77001 45678", "sunita@clear.ai",     91, "Proposal Sent"),
            ("Vivek Reddy",    "+91 66001 56789", "vivek@digi.io",       55, "Cold"),
            ("Ananya Gupta",   "+91 55001 67890", "ananya@easy.in",      79, "Meeting Set"),
        ]

        existing_lead_count = db.query(Lead).count()
        if existing_lead_count < 5:
            print(f"[+] Seeding {len(lead_data)} leads...")
            for name, phone, email, score, status in lead_data:
                lead = Lead(
                    title=name,
                    owner_id=admin.id,
                    phone=phone,
                    email=email,
                    ai_score=float(score),
                    status=status,
                    assigned_to=random.choice(sp_users).id if sp_users else None,
                    created_at=datetime.utcnow() - timedelta(days=random.randint(0, 60)),
                )
                if companies:
                    lead.company_id = random.choice(companies).id
                db.add(lead)
            db.commit()
            print(f"    {len(lead_data)} leads seeded.")
        else:
            print(f"[=] {existing_lead_count} leads already exist, skipping.")

        print("\n[OK] Database seeded successfully!")
        print("   Admin: admin@voiceiq.ai / admin123")
        print("   Sales: arjun@voiceiq.ai / sales123  (and 4 others)")

    except Exception as e:
        print(f"\n[ERROR] Error seeding database: {e}")
        import traceback; traceback.print_exc()
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
