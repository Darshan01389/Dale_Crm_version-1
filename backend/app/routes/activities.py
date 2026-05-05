from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.activity import ActivityCreate, ActivityResponse
from app.services import activity_service

router = APIRouter(prefix="/activities", tags=["Activities"])


@router.post("", response_model=ActivityResponse, status_code=201)
def create_activity(
    body: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return activity_service.create_activity(db, current_user.id, body)


@router.get("", response_model=list[ActivityResponse])
def list_activities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    deal_id: UUID | None = None,
    lead_id: UUID | None = None,
    activity_type: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    return activity_service.list_activities(
        db,
        current_user.id,
        deal_id=deal_id,
        lead_id=lead_id,
        activity_type=activity_type,
        skip=skip,
        limit=limit,
    )


@router.get("/{activity_id}", response_model=ActivityResponse)
def get_activity(
    activity_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return activity_service.get_activity(db, activity_id, current_user.id)


@router.delete("/{activity_id}", status_code=204)
def delete_activity(
    activity_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    activity_service.delete_activity(db, activity_id, current_user.id)
