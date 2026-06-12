from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.activity import Activity
from app.models.deal import Deal
from app.models.lead import Lead
from app.schemas.activity import ActivityCreate


def _verify_links(db: Session, owner_id: UUID, deal_id: UUID | None, lead_id: UUID | None) -> None:
    if deal_id:
        d = db.query(Deal).filter(Deal.id == deal_id).first()
        if d is None or d.owner_id != owner_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid deal_id",
            )
    if lead_id:
        lead_row = db.query(Lead).filter(Lead.id == lead_id).first()
        if lead_row is None or lead_row.owner_id != owner_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid lead_id",
            )


def _ensure_owner(row: Activity | None, owner_id: UUID) -> Activity:
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
    if row.owner_id != owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to access this activity",
        )
    return row


def create_activity(db: Session, owner_id: UUID, data: ActivityCreate) -> Activity:
    _verify_links(db, owner_id, data.deal_id, data.lead_id)
    when = data.occurred_at or datetime.utcnow()
    row = Activity(
        owner_id=owner_id,
        deal_id=data.deal_id,
        lead_id=data.lead_id,
        activity_type=data.activity_type,
        subject=data.subject,
        body=data.body,
        extra_metadata=data.extra_metadata,
        occurred_at=when,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    
    # Auto-complete daily tasks
    from app.services.task_service import TaskService
    TaskService.complete_task_by_activity(db, owner_id, data.lead_id)
    
    return row


def list_activities(
    db: Session,
    owner_id: UUID,
    *,
    deal_id: UUID | None = None,
    lead_id: UUID | None = None,
    activity_type: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Activity]:
    q = db.query(Activity).filter(Activity.owner_id == owner_id)
    if deal_id:
        q = q.filter(Activity.deal_id == deal_id)
    if lead_id:
        q = q.filter(Activity.lead_id == lead_id)
    if activity_type:
        q = q.filter(Activity.activity_type == activity_type)
    return list(q.order_by(Activity.occurred_at.desc()).offset(skip).limit(limit).all())


def get_activity(db: Session, activity_id: UUID, owner_id: UUID) -> Activity:
    row = db.query(Activity).filter(Activity.id == activity_id).first()
    return _ensure_owner(row, owner_id)


def delete_activity(db: Session, activity_id: UUID, owner_id: UUID) -> None:
    row = get_activity(db, activity_id, owner_id)
    db.delete(row)
    db.commit()
