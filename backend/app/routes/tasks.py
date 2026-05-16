from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.core.database import get_db
from app.models.user import User
from app.core.dependencies import get_current_user
from app.services.task_service import TaskService
from app.services.stagnation_service import StagnationService
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/tasks", tags=["Tasks"])

class TaskUpdateSchema(BaseModel):
    is_completed: bool

@router.get("/today")
def get_today_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch AI-generated tasks for today."""
    return TaskService.get_today_tasks(db, current_user)

@router.post("/sync")
def sync_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Force regenerate AI tasks."""
    return TaskService.generate_daily_tasks(db, current_user)

@router.patch("/{task_id}")
def update_task(
    task_id: UUID,
    update: TaskUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a task as completed."""
    from app.models.task import Task
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.is_completed = update.is_completed
    db.commit()
    return {"status": "success"}

@router.post("/reassign-stagnant")
def trigger_stagnation_check(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually trigger the stagnation check and auto-reassignment."""
    if current_user.role not in ["Owner / Admin", "Team Lead"]:
        raise HTTPException(status_code=403, detail="Only managers can trigger stagnation checks.")
    
    return StagnationService.auto_reassign_stagnant_leads(db)
