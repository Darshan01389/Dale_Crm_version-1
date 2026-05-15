
import sys
import os
from sqlalchemy.orm import Session
from passlib.context import CryptContext

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User

# Password hashing context (same as used in the app)
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def update_demo_users():
    db = SessionLocal()
    try:
        updates = [
            {
                "email": "sales@gmail.com",
                "password": "sales@123",
                "role": "Sales Rep",
                "name": "Sales Representative"
            },
            {
                "email": "admin@gmail.com",
                "password": "admin@123",
                "role": "Owner / Admin",
                "name": "Admin User"
            },
            {
                "email": "manager@gmail.com",
                "password": "manager@123",
                "role": "Team Lead",
                "name": "Manager User"
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
            else:
                print(f"Creating new user: {data['email']}")
                import uuid
                new_user = User(
                    id=uuid.uuid4(),
                    email=data["email"],
                    password_hash=hashed_pw,
                    role=data["role"],
                    name=data["name"]
                )
                db.add(new_user)
        
        db.commit()
        print("\n[SUCCESS] All 3 demo users updated with new credentials!")
        print("-" * 50)
        print("1. Sales: sales@gmail.com / sales@123")
        print("2. Admin: admin@gmail.com / admin@123")
        print("3. Manager: manager@gmail.com / manager@123")
        print("-" * 50)

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to update users: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_demo_users()
