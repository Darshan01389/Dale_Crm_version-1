
import sys
import os
from sqlalchemy.orm import Session

# Add the backend directory to sys.path to import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User

def migrate_roles():
    db = SessionLocal()
    try:
        # Define the mapping
        mapping = {
            "sales": "Sales Rep",
            "admin": "Owner / Admin",
            "manager": "Team Lead"
        }
        
        users = db.query(User).all()
        updated_count = 0
        
        for user in users:
            if user.role in mapping:
                print(f"Updating user {user.email}: {user.role} -> {mapping[user.role]}")
                user.role = mapping[user.role]
                updated_count += 1
            elif user.role not in ["Sales Rep", "Team Lead", "Owner / Admin"]:
                # If it's something unknown, default to Sales Rep or handle it
                print(f"Unknown role for user {user.email}: {user.role}. Defaulting to Sales Rep.")
                user.role = "Sales Rep"
                updated_count += 1
        
        db.commit()
        print(f"Successfully updated {updated_count} users.")
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_roles()
