from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.lead import Lead
from app.models.user import User
from app.models.task import Task
from app.models.activity import Activity

class StagnationService:
    @staticmethod
    def auto_reassign_stagnant_leads(db: Session, team_id: str = None) -> dict:
        """
        Detects leads with no activity for 7+ days and reassigns them to 
        available salespeople who have completed their daily work.
        """
        # Threshold: 7 days of inactivity
        stagnant_threshold = datetime.utcnow() - timedelta(days=7)
        
        # Find leads with no activity or contact in 7 days
        # We check both updated_at and last_contacted_at
        stagnant_leads = db.query(Lead).filter(
            Lead.status != "closed",
            (Lead.last_contacted_at < stagnant_threshold) | (Lead.last_contacted_at == None),
            Lead.updated_at < stagnant_threshold
        ).all()

        if not stagnant_leads:
            return {"status": "success", "message": "No stagnant leads found.", "reassigned_count": 0}

        reassigned_log = []
        
        # Find high-performing available salespeople
        # Criteria: 
        # 1. Active Sales Rep in the same team
        # 2. Capacity > 0
        # 3. Work Progress: Completed 80% of tasks today or has < 2 pending tasks
        
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        potential_reassignees = []
        all_salespeople = db.query(User).filter(User.role == "Sales Rep", User.is_active == True).all()
        
        for sp in all_salespeople:
            # Check capacity
            if sp.current_active_leads >= sp.max_active_leads:
                continue
                
            # Check daily task progress
            tasks = db.query(Task).filter(Task.user_id == sp.id, Task.created_at >= today_start).all()
            if not tasks:
                # If they have no tasks, they are fresh and can take leads
                potential_reassignees.append(sp)
                continue
                
            completed_tasks = [t for t in tasks if t.is_completed]
            pending_tasks = [t for t in tasks if not t.is_completed]
            
            # If they are "almost complete" (e.g., 1 or 0 pending tasks)
            if len(pending_tasks) <= 1:
                potential_reassignees.append(sp)

        if not potential_reassignees:
            return {"status": "warning", "message": "Stagnant leads found but no available high-performers for reassignment.", "reassigned_count": 0}

        # Sort reassignees by least current leads to keep it balanced
        potential_reassignees.sort(key=lambda x: x.current_active_leads)

        assigned_idx = 0
        for lead in stagnant_leads:
            # Reassign to the next available salesperson in a round-robin/balanced fashion
            old_owner_id = lead.owner_id
            new_owner = potential_reassignees[assigned_idx % len(potential_reassignees)]
            
            # Skip if it's already assigned to the best candidate
            if old_owner_id == new_owner.id:
                continue

            # Update lead
            lead.owner_id = new_owner.id
            lead.updated_at = datetime.utcnow()
            
            # Log reassignment as an activity
            activity = Activity(
                lead_id=lead.id,
                activity_type="System Reassignment",
                subject="Auto-Reassigned due to stagnation",
                body=f"Lead was stagnant for 7+ days. Reassigned from salesperson to {new_owner.name}."
            )
            db.add(activity)
            
            reassigned_log.append({
                "lead_id": str(lead.id),
                "from": str(old_owner_id),
                "to": str(new_owner.id)
            })
            
            assigned_idx += 1

        db.commit()
        return {
            "status": "success", 
            "message": f"Successfully reassigned {len(reassigned_log)} stagnant leads.",
            "reassigned_count": len(reassigned_log),
            "details": reassigned_log
        }
