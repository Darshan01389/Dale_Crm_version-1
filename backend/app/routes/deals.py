from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.deal import DealCreate, DealResponse, DealUpdate
from app.services import deal_service

router = APIRouter(prefix="/deals", tags=["Deals"])


@router.post("", response_model=DealResponse, status_code=201)
def create_deal(
    body: DealCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return deal_service.create_deal(db, current_user, body)


@router.get("", response_model=list[DealResponse])
def list_deals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    outcome: str | None = Query(None, description="Filter: open | won | lost"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    company_id: int | None = Query(None),
):
    return deal_service.list_deals(db, current_user, outcome=outcome, skip=skip, limit=limit, company_id=company_id)


@router.get("/{deal_id}", response_model=DealResponse)
def get_deal(
    deal_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return deal_service.get_deal(db, deal_id, current_user)


@router.patch("/{deal_id}", response_model=DealResponse)
def update_deal(
    deal_id: UUID,
    body: DealUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return deal_service.update_deal(db, deal_id, current_user, body)


@router.delete("/{deal_id}", status_code=204)
def delete_deal(
    deal_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deal_service.delete_deal(db, deal_id, current_user)


@router.get("/{deal_id}/prediction")
def get_deal_prediction(
    deal_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.prediction_service import predict_deal_outcome
    # Ensure ownership via existing deal_service helper
    deal_service.get_deal(db, deal_id, current_user)
    return predict_deal_outcome(db, deal_id)
