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
        print("Creating tasks table...")
        
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS tasks (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
                title VARCHAR NOT NULL,
                description TEXT,
                is_completed BOOLEAN DEFAULT FALSE,
                due_date TIMESTAMP DEFAULT NOW(),
                priority VARCHAR DEFAULT 'Medium',
                task_type VARCHAR DEFAULT 'Follow-up',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """))
        
        db.commit()
        print("Migration successful! 'tasks' table created.")
    except Exception as e:
        db.rollback()
        print(f"Error during migration: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
