import sys
import os
from sqlalchemy import text
from dotenv import load_dotenv

# Add current directory to path
sys.path.append(os.getcwd())
load_dotenv(".env")

from app.core.database import SessionLocal

def migrate():
    db = SessionLocal()
    try:
        print("Migrating database schema (adding company_email)...")
        
        # Add company_email to users
        print("Checking users table...")
        db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS company_email VARCHAR"))
        
        db.commit()
        print("Database migration successful! 'company_email' column added.")
    except Exception as e:
        db.rollback()
        print(f"Error during migration: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
