import os
from sqlalchemy import text
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import sys

# Add the current directory to sys.path to import app modules
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_dir)
load_dotenv(os.path.join(backend_dir, ".env"))

from app.core.database import SessionLocal, engine

def make_leads_hot():
    db = SessionLocal()
    try:
        print("Updating all leads to 'Hot' status...")
        
        # Update all leads to high AI score and positive sentiment
        result = db.execute(text("""
            UPDATE leads 
            SET ai_score = 95.0, 
                sentiment_label = 'positive',
                ai_score_summary = 'High intent signal detected from recent interactions. Lead is ready for immediate follow-up.',
                intent_level = 'high',
                category = 'Hot'
        """))
        
        db.commit()
        print(f"Successfully updated {result.rowcount} leads to Hot status.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    make_leads_hot()
