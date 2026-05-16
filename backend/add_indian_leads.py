import sys
import os
import random
from datetime import datetime

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.lead import Lead

indian_names = [
    "Aarav Patel", "Vihaan Sharma", "Vivaan Singh", "Ananya Gupta", "Diya Reddy",
    "Aditya Kumar", "Arjun Verma", "Sai Krishna", "Kavya Desai", "Isha Joshi",
    "Rohan Mehta", "Neha Kapoor", "Rahul Nair", "Sneha Iyer", "Karan Das",
    "Pooja Menon", "Vikram Malhotra", "Riya Chakraborty", "Siddharth Rao", "Aarti Pillai",
    "Amitabh Bose", "Priyanka Sen", "Nikhil Dubey", "Priya Tiwari", "Ravi Pandey"
]

companies = [
    "Reliance Industries", "Tata Consultancy Services", "Infosys", "Wipro", "HCL Technologies",
    "Mahindra & Mahindra", "Larsen & Toubro", "Bajaj Auto", "Bharti Airtel", "Sun Pharma"
]

def add_leads():
    db = SessionLocal()
    try:
        # Get users to assign leads to (Sales Reps)
        users = db.query(User).all()
        if not users:
            print("No users found in the database. Please create a user first.")
            return

        # Find an owner (can be an admin or any user, let's pick the first one)
        owner = users[0]
        
        for user in users:
            names_to_add = random.choices(indian_names, k=20)
            for name in names_to_add:
                company = random.choice(companies)
                first_name = name.split()[0].lower()
                last_name = name.split()[-1].lower()
                email = f"{first_name}.{last_name}@{company.lower().replace(' ', '').replace('&', '')}.com"
                phone = f"+91 {random.randint(7000000000, 9999999999)}"
                
                lead = Lead(
                    owner_id=user.id,
                    title=name,
                    lead_company_name=company,
                    email=email,
                    phone=phone,
                    status=random.choice(["new", "contacted", "qualified", "proposal", "negotiation"]),
                    source=random.choice(["Website", "LinkedIn", "Referral", "Cold Call"]),
                    category=random.choice(["Hot", "Warm", "Cold"]),
                    deal_value=random.randint(10000, 500000),
                    assigned_to=user.id
                )
                db.add(lead)
            
        db.commit()
        print(f"Successfully added 20 leads with Indian names!")
        
    except Exception as e:
        db.rollback()
        print(f"Error adding leads: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    add_leads()
