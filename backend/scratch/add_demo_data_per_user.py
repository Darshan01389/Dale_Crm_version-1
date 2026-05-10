import sys
import os
import random
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.lead import Lead
from app.models.deal import Deal
from app.models.activity import Activity
from app.models.pipeline_stage import PipelineStage

indian_names = [
    "Aarav Patel", "Vihaan Sharma", "Vivaan Singh", "Ananya Gupta", "Diya Reddy",
    "Aditya Kumar", "Arjun Verma", "Sai Krishna", "Kavya Desai", "Isha Joshi",
    "Rohan Mehta", "Neha Kapoor", "Rahul Nair", "Sneha Iyer", "Karan Das",
    "Pooja Menon", "Vikram Malhotra", "Riya Chakraborty", "Siddharth Rao", "Aarti Pillai",
    "Amitabh Bose", "Priyanka Sen", "Nikhil Dubey", "Priya Tiwari", "Ravi Pandey",
    "Vikash Jain", "Ankita Roy", "Suresh Khanna", "Deepak Chawla", "Rakesh Yadav"
]

companies = [
    "Reliance Industries", "Tata Consultancy Services", "Infosys", "Wipro", "HCL Technologies",
    "Mahindra & Mahindra", "Larsen & Toubro", "Bajaj Auto", "Bharti Airtel", "Sun Pharma",
    "ICICI Bank", "HDFC Bank", "State Bank of India", "ITC Limited", "Asian Paints"
]

def generate_phone():
    return f"+91 {random.randint(7000000000, 9999999999)}"

def generate_email(name, company):
    first = name.split()[0].lower()
    last = name.split()[-1].lower()
    domain = company.lower().replace(' ', '').replace('&', '') + ".com"
    return f"{first}.{last}@{domain}"

def add_demo_data():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        stages = db.query(PipelineStage).all()
        
        if not users or not stages:
            print("Users or Stages missing.")
            return

        total_leads = 0
        total_deals = 0
        total_activities = 0

        for user in users:
            print(f"Adding 20 leads/deals for user: {user.email} ({user.role})")
            
            for i in range(20):
                # 1. Create Lead
                name = random.choice(indian_names) + f" {i}" # Ensure unique title if needed
                company = random.choice(companies)
                
                lead = Lead(
                    owner_id=user.id,
                    assigned_to=user.id,
                    title=name,
                    lead_company_name=company,
                    email=generate_email(name, company),
                    phone=generate_phone(),
                    status="new",
                    source=random.choice(["Website", "LinkedIn", "Referral", "Cold Call"]),
                    category=random.choice(["Hot", "Warm", "Cold"]),
                    deal_value=random.randint(50000, 5000000)
                )
                db.add(lead)
                db.flush() # get lead.id

                # 2. Create Deal
                stage = random.choice(stages)
                outcome = "open"
                if stage.is_closed_won: outcome = "won"
                elif stage.is_closed_lost: outcome = "lost"

                deal = Deal(
                    owner_id=user.id,
                    lead_id=lead.id,
                    title=f"{company} - {random.choice(['Software License', 'Consulting', 'Implementation', 'Annual Support'])}",
                    stage_id=stage.id,
                    amount=lead.deal_value,
                    currency="INR",
                    probability=random.randint(10, 90),
                    expected_close_date=datetime.utcnow() + timedelta(days=random.randint(5, 90)),
                    outcome=outcome,
                    notes=f"Deal created from lead {lead.title}"
                )
                db.add(deal)
                db.flush()

                # 3. Create Activity
                activity = Activity(
                    owner_id=user.id,
                    deal_id=deal.id,
                    lead_id=lead.id,
                    activity_type=random.choice(["call", "email", "meeting"]),
                    subject=f"Initial outreach for {company}",
                    body="Discussed the requirements and sent a preliminary proposal.",
                    occurred_at=datetime.utcnow() - timedelta(days=random.randint(1, 10))
                )
                db.add(activity)

                total_leads += 1
                total_deals += 1
                total_activities += 1

        db.commit()
        print(f"Successfully added {total_leads} Leads, {total_deals} Deals, and {total_activities} Activities.")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    add_demo_data()
