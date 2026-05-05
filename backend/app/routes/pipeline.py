from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services import deal_service

router = APIRouter(prefix="/pipeline", tags=["Pipeline"])


@router.get("/stages")
def list_stages(
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Ordered pipeline stages for deal boards and revenue tracking."""
    return deal_service.list_pipeline_stages(db)
