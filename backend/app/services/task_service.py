import json
from datetime import datetime, timedelta
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.task import Task
from app.models.lead import Lead
from app.models.user import User
from app.services.openai_message_service import _llm_request
from app.core.config import settings

class TaskService:
    @staticmethod
    def generate_daily_tasks(db: Session, user: User) -> list[Task]:
        """
        Uses Llama 3.1 to generate 3-5 high-priority tasks for the salesperson.
        """
        # Fetch current active leads for the user
        leads = db.query(Lead).filter(Lead.owner_id == user.id, Lead.status != "closed").all()
        if not leads:
            return []

        # Prepare lead data for LLM
        leads_context = []
        for l in leads:
            leads_context.append({
                "id": str(l.id),
                "title": l.title,
                "status": l.status,
                "ai_score": l.ai_score or 0,
                "last_contacted_at": str(l.last_contacted_at) if l.last_contacted_at else "Never",
                "notes": l.notes[:100] if l.notes else ""
            })

        prompt = (
            "You are an AI Sales Manager. Analyze the following leads assigned to a salesperson "
            "and generate 3-5 specific, actionable daily tasks. Focus on high-intent leads (high ai_score) "
            "and leads that are going cold (not contacted in 7+ days). "
            "Return the tasks as a JSON array of objects with 'title', 'description', 'priority' (High/Medium/Low), "
            "and 'lead_id' (if applicable). Only return valid JSON."
        )

        body = {
            "model": settings.CHAT_MODEL,
            "messages": [
                {"role": "system", "content": prompt},
                {"role": "user", "content": json.dumps(leads_context)}
            ],
            "temperature": 0.4
        }

        try:
            raw_response = _llm_request(body, model_override=settings.CHAT_MODEL)
            # Basic cleanup if markdown is present
            if "```json" in raw_response:
                raw_response = raw_response.split("```json")[1].split("```")[0].strip()
            elif "```" in raw_response:
                raw_response = raw_response.split("```")[1].split("```")[0].strip()
            
            task_data = json.loads(raw_response)
            
            # Clear old tasks for today to avoid duplicates
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            db.query(Task).filter(Task.user_id == user.id, Task.created_at >= today_start).delete()

            new_tasks = []
            for t in task_data:
                l_id = t.get("lead_id")
                # Ensure lead_id is a valid UUID
                valid_lead_id = None
                if l_id:
                    try:
                        valid_lead_id = UUID(str(l_id))
                    except (ValueError, TypeError):
                        valid_lead_id = None

                task = Task(
                    user_id=user.id,
                    lead_id=valid_lead_id,
                    title=t.get("title", "New Task"),
                    description=t.get("description", ""),
                    priority=t.get("priority", "Medium"),
                    task_type="AI Suggestion"
                )
                db.add(task)
                new_tasks.append(task)
            
            db.commit()
            return new_tasks
        except Exception as e:
            print(f"Error generating tasks: {str(e)}")
            # Fallback for demo purposes if LLM fails
            new_tasks = []
            
            # Clear old tasks to avoid duplicates
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            db.query(Task).filter(Task.user_id == user.id, Task.created_at >= today_start).delete()
            
            if leads:
                for i, l in enumerate(leads[:3]):
                    task = Task(
                        user_id=user.id,
                        lead_id=l.id,
                        title=f"Follow up with {l.title}",
                        description="Review recent interactions and reach out to move the deal forward.",
                        priority="High" if l.ai_score and l.ai_score > 80 else "Medium",
                        task_type="AI Suggestion"
                    )
                    db.add(task)
                    new_tasks.append(task)
            else:
                task = Task(
                    user_id=user.id,
                    lead_id=None,
                    title="Prospect new leads",
                    description="No active leads found. Start prospecting.",
                    priority="Medium",
                    task_type="AI Suggestion"
                )
                db.add(task)
                new_tasks.append(task)
                
            db.commit()
            return new_tasks

    @staticmethod
    def get_today_tasks(db: Session, user: User) -> list[dict]:
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        tasks = db.query(Task).filter(Task.user_id == user.id, Task.created_at >= today_start).all()
        
        # If no tasks exist for today, generate them
        if not tasks:
            tasks = TaskService.generate_daily_tasks(db, user)
            
        # Return tasks with lead names for UI
        res = []
        for t in tasks:
            res.append({
                "id": str(t.id),
                "title": t.title,
                "description": t.description,
                "is_completed": t.is_completed,
                "priority": t.priority,
                "lead_id": str(t.lead_id) if t.lead_id else None,
                "lead_name": t.lead.title if t.lead else "General Task",
                "created_at": t.created_at.isoformat()
            })
        return res

    @staticmethod
    def complete_task_by_activity(db: Session, user_id: UUID, lead_id: UUID):
        """Automatically marks today's task for a lead as completed when an activity happens."""
        if not lead_id: return
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        task = db.query(Task).filter(
            Task.user_id == user_id,
            Task.lead_id == lead_id,
            Task.created_at >= today_start,
            Task.is_completed == False
        ).first()
        
        if task:
            task.is_completed = True
            db.commit()
