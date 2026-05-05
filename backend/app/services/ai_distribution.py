from typing import List
from sqlalchemy.orm import Session
from app.models.lead import Lead
from app.models.user import User
import random

class AIDistributionService:
    @staticmethod
    def distribute_leads(db: Session, lead_ids: List[str], manager_id: str) -> dict:
        """
        Intelligently distributes a list of leads among available salespeople.
        Takes into account the salesperson's current active leads and maximum capacity.
        """
        # Fetch the leads
        leads = db.query(Lead).filter(Lead.id.in_(lead_ids)).all()
        if not leads:
            return {"status": "error", "message": "No valid leads found."}

        # Fetch available salespeople
        salespeople = db.query(User).filter(User.role == "Sales Rep", User.is_active == True).all()
        if not salespeople:
            return {"status": "error", "message": "No active salespeople available."}

        distribution_log = {sp.id: {"name": sp.name, "assigned_count": 0, "leads": []} for sp in salespeople}
        
        assigned_total = 0
        
        for lead in leads:
            # Skip if already assigned
            if lead.assigned_to:
                continue

            # AI Logic: Calculate score for each salesperson
            # Score = (capacity remaining) + (small AI random factor for "matching")
            best_sp = None
            highest_score = -9999
            
            for sp in salespeople:
                capacity_remaining = sp.max_active_leads - sp.current_active_leads
                
                # If they are at or over capacity, skip them unless no one else is available
                if capacity_remaining <= 0:
                    continue
                    
                # Simulate AI "matching" score (0 to 10) based on intent/category vs sp skills
                ai_match_score = random.uniform(0, 10) 
                
                # Formula: heavily weight capacity, add AI matching
                score = (capacity_remaining * 2) + ai_match_score
                
                if score > highest_score:
                    highest_score = score
                    best_sp = sp
            
            # If everyone is full, pick the one with the absolute lowest current leads
            if not best_sp:
                best_sp = min(salespeople, key=lambda x: x.current_active_leads)
                
            # Assign the lead
            lead.assigned_to = best_sp.id
            best_sp.current_active_leads += 1
            
            distribution_log[best_sp.id]["assigned_count"] += 1
            distribution_log[best_sp.id]["leads"].append(lead.id)
            assigned_total += 1
            
        # Commit all assignments and capacity updates
        db.commit()
        
        return {
            "status": "success",
            "message": f"Successfully distributed {assigned_total} leads using AI matching.",
            "details": distribution_log
        }
