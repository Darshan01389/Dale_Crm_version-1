import csv
import io
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
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


@router.get("/export/csv")
def export_deals_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    outcome: str | None = Query(None, description="Filter: open | won | lost"),
    company_id: int | None = Query(None),
):
    """Export deals as a formatted CSV file."""
    deals = deal_service.list_deals(db, current_user, outcome=outcome, skip=0, limit=2000, company_id=company_id)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Deal ID", "Title", "Value (INR)", "Stage", "Outcome", 
        "Probability (%)", "Expected Close Date", "Created Date"
    ])
    
    for d in deals:
        writer.writerow([
            str(d.id),
            d.title or "",
            float(d.value or 0.0),
            d.stage or (d.pipeline_stage.name if hasattr(d, 'pipeline_stage') and d.pipeline_stage else ""),
            d.outcome or "open",
            round(float(d.probability or 0.0), 1),
            d.expected_close_date.strftime("%Y-%m-%d") if d.expected_close_date else "",
            d.created_at.strftime("%Y-%m-%d %H:%M") if d.created_at else ""
        ])
        
    csv_bytes = output.getvalue().encode("utf-8")
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=deals_export.csv"}
    )


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
