
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.database import SessionLocal
from app.models.lead import Lead

db = SessionLocal()
total_leads = db.query(Lead).count()
print(f"Total leads in database: {total_leads}")
db.close()
