import os
import sys
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Add the current directory to sys.path to import app modules
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_dir)
load_dotenv(os.path.join(backend_dir, ".env"))

from app.core.database import SessionLocal
from app.models.lead import Lead
from app.services.ai_distribution import AIDistributionService

def distribute_all_leads():
    db = SessionLocal()
    try:
        print("Distributing all unassigned leads using AI matching...")
        
        # Get all leads that are not assigned
        leads = db.query(Lead).filter(Lead.assigned_to == None).all()
        lead_ids = [str(l.id) for l in leads]
        
        if not lead_ids:
            print("No unassigned leads found.")
            return

        # Use a dummy manager_id (the first admin or manager found)
        from app.models.user import User
        manager = db.query(User).filter(User.role.in_(["Owner / Admin", "Team Lead", "Manager"])).first()
        manager_id = str(manager.id) if manager else "00000000-0000-0000-0000-000000000000"

        result = AIDistributionService.distribute_leads(db, lead_ids, manager_id)
        
        if result["status"] == "success":
            print(f"Successfully {result['message']}")
        else:
            print(f"Error: {result['message']}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    distribute_all_leads()
