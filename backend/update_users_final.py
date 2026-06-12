
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password

def get_password_hash(password):
    return hash_password(password)

def update_demo_users():
    db = SessionLocal()
    try:
        from app.models.company import Company
        company = db.query(Company).first()
        if not company:
            print("Creating default company: Acme Corporation")
            company = Company(name="Acme Corporation", industry="Technology", join_code="111111")
            db.add(company)
            db.commit()
            db.refresh(company)

        updates = [
            {
                "email": "sales@gmail.com",
                "password": "sales@123",
                "role": "Sales Rep",
                "name": "Sales Representative",
                "company_id": company.id
            },
            {
                "email": "admin@gmail.com",
                "password": "admin@123",
                "role": "Owner / Admin",
                "name": "Admin User",
                "company_id": company.id
            },
            {
                "email": "manager@gmail.com",
                "password": "manager@123",
                "role": "Team Lead",
                "name": "Manager User",
                "company_id": company.id
            },
            {
                "email": "daleaicrm@gmail.com",
                "password": "Aicrm2013",
                "role": "Owner / Admin",
                "name": "Deal CRM Super Owner",
                "company_id": None
            }
        ]

        for data in updates:
            user = db.query(User).filter(User.email == data["email"]).first()
            hashed_pw = get_password_hash(data["password"])
            
            if user:
                print(f"Updating existing user: {data['email']}")
                user.password_hash = hashed_pw
                user.role = data["role"]
                user.name = data["name"]
                user.company_id = data["company_id"]
                user.is_email_verified = True
            else:
                print(f"Creating new user: {data['email']}")
                import uuid
                new_user = User(
                    id=uuid.uuid4(),
                    email=data["email"],
                    password_hash=hashed_pw,
                    role=data["role"],
                    name=data["name"],
                    company_id=data["company_id"],
                    is_email_verified=True
                )
                db.add(new_user)
        
        db.commit()
        print("\n[SUCCESS] All demo users and Super Admin updated with new credentials!")
        print("-" * 50)
        print("1. Sales: sales@gmail.com / sales@123")
        print("2. Admin: admin@gmail.com / admin@123")
        print("3. Manager: manager@gmail.com / manager@123")
        print("4. Super Admin: daleaicrm@gmail.com / Aicrm2013")
        print("-" * 50)

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to update users: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_demo_users()

