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

def create_activities_for_lead(db: Session, lead, status: str, owner, created_at: datetime):
    import json
    
    def add_act(act_type: str, subject: str, body: str, direction: str, offset_hours: int):
        act = Activity(
            id=uuid.uuid4(),
            lead_id=lead.id,
            owner_id=owner.id,
            activity_type=act_type,
            subject=subject,
            body=body,
            extra_metadata=json.dumps({"direction": direction}),
            occurred_at=created_at + timedelta(hours=offset_hours)
        )
        db.add(act)
        
    # 1. New Lead initial messages (always added)
    add_act(
        "whatsapp", 
        f"Inquiry from {lead.title}", 
        f"Hi, I saw your product DalelQ and wanted to know more about the AI call recording features. Can you share some details?", 
        "inbound", 
        0
    )
    add_act(
        "whatsapp", 
        f"Reply to {lead.title}", 
        f"Hello! Thanks for reaching out. Yes, we support native WebRTC call recording and automatic AI transcriptions. I can schedule a quick 10-minute demo this week to show you how it works. Let me know what time suits you!", 
        "outbound", 
        1
    )
    
    if status == "new":
        return
        
    # 2. Discovery stage messages
    add_act(
        "whatsapp", 
        "Confirming demo call", 
        "Sure, let's connect tomorrow at 11 AM. Looking forward to it.", 
        "inbound", 
        4
    )
    add_act(
        "call", 
        "Discovery Call Summary", 
        "Discovery Call: Explored their requirements. They have 15 sales reps using Android and web apps. Need automatic AI scoring and WhatsApp automated follow-ups.", 
        "inbound",
        24
    )
    
    if status == "discovery":
        return
        
    # 3. Proposal stage messages
    add_act(
        "whatsapp", 
        "Request for pricing proposal", 
        "Thanks for the demo call. Can you send over the formal pricing proposal for 15 users?", 
        "inbound", 
        26
    )
    add_act(
        "email", 
        "Enterprise Pricing Proposal", 
        f"Hi, please find attached the customized enterprise proposal for your team. It includes 15 licenses, unlimited AI transcription, and custom CRM integration. Let me know if we can schedule a review call.", 
        "outbound", 
        28
    )
    
    if status == "proposal":
        return
        
    # 4. Negotiation stage messages
    add_act(
        "whatsapp", 
        "Pricing negotiation", 
        "We reviewed the proposal. The pricing seems slightly higher than our budget of ₹4L/year. Is there any flexibility or discount for an annual contract?", 
        "inbound", 
        48
    )
    add_act(
        "whatsapp", 
        "Discount offer", 
        "Thanks for the feedback. If we sign for a 12-month annual contract, I can offer a 15% discount, bringing the total value to ₹4.25L. Let me know if that works for you!", 
        "outbound", 
        50
    )
    
    if status == "negotiation":
        return
        
    # 5. Won or Lost outcome
    if status == "won":
        add_act(
            "whatsapp", 
            "Deal approved", 
            "This pricing works for us! Please send over the contract and billing link. We are ready to sign and get started.", 
            "inbound", 
            72
        )
        add_act(
            "whatsapp", 
            "Contract sent", 
            f"Excellent! I've sent the contract via DocuSign and the invoice link. Looking forward to partnering with {lead.lead_company_name}!", 
            "outbound", 
            73
        )
        add_act(
            "email", 
            "Agreement Signed & Paid", 
            "Contract signed and payment verified. The account has been provisioned and onboarding starts tomorrow at 10 AM.", 
            "inbound", 
            76
        )
    elif status == "lost":
        add_act(
            "whatsapp", 
            "Deal declined", 
            "Unfortunately, we went with a cheaper local vendor because of our tight budget constraints. We might re-evaluate next year.", 
            "inbound", 
            72
        )
        add_act(
            "whatsapp", 
            "Lost deal follow up", 
            "Thank you for letting us know! I completely understand. I will check back in next year to see if your requirements have changed. Wish you all the best!", 
            "outbound", 
            73
        )

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
            {"title": "Savithri Devi", "company": "Tata Consultancy Services", "status": "new", "ai_score": 92.5, "priority": 1, "intent": "High"},
            {"title": "Mohan Kumar", "company": "Reliance Industries", "status": "discovery", "ai_score": 78.0, "priority": 2, "intent": "Medium"},
            {"title": "Rahul Sharma", "company": "Infosys", "status": "proposal", "ai_score": 88.5, "priority": 1, "intent": "High"},
            {"title": "Arjun Singh", "company": "Wipro", "status": "negotiation", "ai_score": 45.0, "priority": 3, "intent": "Low"},
            {"title": "Lakshmi Prasanna", "company": "HDFC Bank", "status": "won", "ai_score": 95.0, "priority": 1, "intent": "High"},
            {"title": "Aditya Patel", "company": "ICICI Bank", "status": "lost", "ai_score": 35.0, "priority": 3, "intent": "Low"},
            {"title": "Priya Iyer", "company": "Mahindra & Mahindra", "status": "new", "ai_score": 72.5, "priority": 2, "intent": "Medium"},
            {"title": "Vikram Reddy", "company": "Larsen & Toubro", "status": "discovery", "ai_score": 83.0, "priority": 1, "intent": "High"},
            {"title": "Ananya Gupta", "company": "Bharti Airtel", "status": "proposal", "ai_score": 65.0, "priority": 3, "intent": "Medium"},
            {"title": "Amitabh Das", "company": "Sun Pharma", "status": "negotiation", "ai_score": 70.0, "priority": 2, "intent": "Medium"},
            {"title": "Siddharth Rao", "company": "Bajaj Auto", "status": "won", "ai_score": 91.0, "priority": 1, "intent": "High"},
            {"title": "Kavya Desai", "company": "Tech Mahindra", "status": "lost", "ai_score": 25.0, "priority": 3, "intent": "Low"},
            {"title": "Sai Krishna", "company": "Adani Enterprises", "status": "new", "ai_score": 86.0, "priority": 2, "intent": "High"},
            {"title": "Sneha Nair", "company": "HCL Technologies", "status": "discovery", "ai_score": 50.0, "priority": 3, "intent": "Low"},
            {"title": "Rohan Mehta", "company": "Kotak Mahindra", "status": "proposal", "ai_score": 94.0, "priority": 1, "intent": "High"},
            {"title": "Neha Kapoor", "company": "ITC Limited", "status": "negotiation", "ai_score": 80.0, "priority": 2, "intent": "Medium"},
            {"title": "Karan Johar", "company": "Dharma Productions", "status": "won", "ai_score": 85.0, "priority": 1, "intent": "High"},
            {"title": "Deepa Nair", "company": "Godrej Group", "status": "new", "ai_score": 60.0, "priority": 3, "intent": "Medium"}
        ]

        # Fetch all pipeline stages
        stages = db.query(PipelineStage).all()
        stage_map = {s.stage_key: s.id for s in stages}
        stage_id = stage_map.get("new") or (stages[0].id if stages else None)

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
            
            # Map status to stage ID
            lead_stage_id = stage_map.get(lead_data["status"]) or stage_id
            if lead_stage_id:
                outcome = "open"
                if lead_data["status"] == "won":
                    outcome = "won"
                elif lead_data["status"] == "lost":
                    outcome = "lost"

                deal = Deal(
                    id=uuid.uuid4(),
                    lead_id=lead.id,
                    owner_id=owner.id,
                    title=f"{random.choice(['Enterprise License', 'Standard Implementation', 'Cloud Migration', 'Premium Support', 'API Integration'])} - {lead.lead_company_name}",
                    amount=random.choice([150000.0, 250000.0, 500000.0, 750000.0]),
                    stage_id=lead_stage_id,
                    outcome=outcome,
                    created_at=lead.created_at + timedelta(days=1)
                )
                if outcome in ("won", "lost"):
                    deal.closed_at = deal.created_at + timedelta(days=random.randint(1, 5))
                db.add(deal)

            # Add realistic activities matching the lead status
            create_activities_for_lead(db, lead, lead_data["status"], owner, lead.created_at)

        db.commit()
        print("Demo data successfully seeded!")

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data()
