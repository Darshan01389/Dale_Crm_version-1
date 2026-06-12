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
        print("Migrating database schema...")
        
        # Add whatsapp_number to users
        print("Checking users table...")
        db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20)"))
        
        # Ensure lead columns for whatsapp are present
        print("Checking leads table...")
        db.execute(text("ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp_status VARCHAR"))
        db.execute(text("ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp_last_sent_at TIMESTAMP WITHOUT TIME ZONE"))
        db.execute(text("ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp_delivery_status VARCHAR"))
        
        db.commit()
        print("Database migration successful! 'whatsapp_number' column added.")
    except Exception as e:
        db.rollback()
        print(f"Error during migration: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
