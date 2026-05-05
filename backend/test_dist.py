from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.lead import Lead
from app.models.user import User
from app.services.ai_distribution import AIDistributionService

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    # Get all leads
    all_leads = db.query(Lead).all()
    # Unassign all leads to test distribution
    for lead in all_leads:
        lead.assigned_to = None
    
    # Get all salespeople and reset their counts
    salespeople = db.query(User).filter(User.role == "sales").all()
    for sp in salespeople:
        sp.current_active_leads = 0
    db.commit()

    lead_ids = [str(l.id) for l in all_leads]
    
    # Get admin
    admin = db.query(User).filter(User.role == "admin").first()
    
    print("Testing distribution...")
    result = AIDistributionService.distribute_leads(db, lead_ids, str(admin.id))
    print("Result:", result)
    
finally:
    db.close()
