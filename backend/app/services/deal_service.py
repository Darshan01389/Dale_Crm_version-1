from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.deal import Deal
from app.models.lead import Lead
from app.models.pipeline_stage import PipelineStage
from app.schemas.deal import DealCreate, DealResponse, DealUpdate
from app.models.user import User


def _stage_by_key(db: Session, stage_key: str) -> PipelineStage:
    stage = (
        db.query(PipelineStage)
        .filter(PipelineStage.stage_key == stage_key)
        .first()
    )
    if stage is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown pipeline stage: {stage_key}",
        )
    return stage


def _ensure_lead_owner(db: Session, lead_id: UUID | None, user: User) -> None:
    if lead_id is None:
        return
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=400, detail="Invalid lead_id")
    
    # Use existing helper to check permission
    from app.services.lead_service import _ensure_owner
    _ensure_owner(lead, user)


def _ensure_deal_owner(deal: Deal | None, user: User) -> Deal:
    if deal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal not found")
    
    # Check for synonyms and standard roles
    is_admin = user.role in ["Owner / Admin", "Sales Admin"]
    is_manager = user.role in ["Team Lead", "Manager"]

    if is_admin:
        if user.is_super_admin:
            return deal
        if deal.owner and deal.owner.company_id == user.company_id:
            return deal
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to access deals outside your company"
        )
        
    if is_manager:
        lead_owner = deal.owner
        if lead_owner and lead_owner.company_id == user.company_id and lead_owner.team_id == user.team_id:
            return deal

    if deal.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to access this deal",
        )
    return deal


def serialize_deal(d: Deal) -> DealResponse:
    stage = d.stage
    
    intent = "unknown"
    lead_name = None
    if getattr(d, 'lead', None):
        lead_name = d.lead.title
        il = (d.lead.intent_level or "").lower()
        if "high" in il:
            intent = "high"
        elif "risk" in il or d.lead.risk_flag:
            intent = "risk"
        elif "medium" in il or "low" in il or "standard" in il:
            intent = "standard"
        elif d.lead.ai_score and d.lead.ai_score > 80:
            intent = "high"

    return DealResponse(
        id=d.id,
        owner_id=d.owner_id,
        lead_id=d.lead_id,
        title=d.title,
        stage_id=d.stage_id,
        stage_key=stage.stage_key,
        stage_label=stage.label,
        amount=float(d.amount),
        currency=d.currency,
        probability=float(d.probability),
        expected_close_date=d.expected_close_date,
        closed_at=d.closed_at,
        outcome=d.outcome,
        notes=d.notes,
        created_at=d.created_at,
        updated_at=d.updated_at,
        intent=intent,
        lead_name=lead_name,
    )


def create_deal(db: Session, user: User, data: DealCreate) -> DealResponse:
    _ensure_lead_owner(db, data.lead_id, user)
    stage = _stage_by_key(db, data.stage_key)
    row = Deal(
        owner_id=user.id,
        lead_id=data.lead_id,
        title=data.title,
        stage_id=stage.id,
        amount=data.amount,
        currency=data.currency,
        probability=data.probability,
        expected_close_date=data.expected_close_date,
        outcome=data.outcome,
        notes=data.notes,
    )
    if data.outcome in ("won", "lost"):
        row.closed_at = datetime.utcnow()
    db.add(row)
    db.commit()
    db.refresh(row)
    d = (
        db.query(Deal)
        .options(joinedload(Deal.stage), joinedload(Deal.lead))
        .filter(Deal.id == row.id)
        .first()
    )
    return serialize_deal(d)


def list_deals(
    db: Session,
    user: User,
    *,
    outcome: str | None = None,
    skip: int = 0,
    limit: int = 50,
    company_id: int | None = None,
) -> list[DealResponse]:
    q = db.query(Deal).options(joinedload(Deal.stage), joinedload(Deal.lead))
    
    # If the user is a normal company user, enforce that company_id is exactly user.company_id
    if not user.is_super_admin:
        company_id = user.company_id

    if user.role == "Sales Rep" or user.role == "Sales":
        q = q.filter(Deal.owner_id == user.id)
    elif user.role in ["Team Lead", "Manager"]:
        if user.team_id:
            member_ids = db.query(User.id).filter(User.team_id == user.team_id).all()
            member_ids = [m[0] for m in member_ids]
            q = q.filter(Deal.owner_id.in_(member_ids))
        else:
            q = q.filter(Deal.owner_id == user.id)
            
    # Scope by company
    if company_id is not None:
        q = q.filter(Deal.owner.has(User.company_id == company_id))

    if outcome:
        q = q.filter(Deal.outcome == outcome)
    rows = (
        q.order_by(Deal.updated_at.desc()).offset(skip).limit(limit).all()
    )
    return [serialize_deal(d) for d in rows]


def get_deal(db: Session, deal_id: UUID, user: User) -> DealResponse:
    d = (
        db.query(Deal)
        .options(joinedload(Deal.stage), joinedload(Deal.lead))
        .filter(Deal.id == deal_id)
        .first()
    )
    d = _ensure_deal_owner(d, user)
    return serialize_deal(d)


def update_deal(
    db: Session,
    deal_id: UUID,
    user: User,
    data: DealUpdate,
) -> DealResponse:
    d = (
        db.query(Deal)
        .options(joinedload(Deal.stage), joinedload(Deal.lead))
        .filter(Deal.id == deal_id)
        .first()
    )
    d = _ensure_deal_owner(d, user)
    patch = data.model_dump(exclude_unset=True)
    if "lead_id" in patch:
        _ensure_lead_owner(db, patch["lead_id"], user)
    if "stage_key" in patch:
        st = _stage_by_key(db, patch.pop("stage_key"))
        d.stage_id = st.id
    for k, v in patch.items():
        setattr(d, k, v)
    if d.outcome in ("won", "lost") and d.closed_at is None:
        d.closed_at = datetime.utcnow()
    if d.outcome == "open":
        d.closed_at = None
    db.add(d)
    db.commit()
    db.refresh(d)
    d = (
        db.query(Deal)
        .options(joinedload(Deal.stage), joinedload(Deal.lead))
        .filter(Deal.id == d.id)
        .first()
    )
    return serialize_deal(d)


def delete_deal(db: Session, deal_id: UUID, user: User) -> None:
    d = db.query(Deal).filter(Deal.id == deal_id).first()
    d = _ensure_deal_owner(d, user)
    db.delete(d)
    db.commit()


def list_pipeline_stages(db: Session) -> list[dict]:
    stages = (
        db.query(PipelineStage)
        .order_by(PipelineStage.sort_order.asc())
        .all()
    )
    return [
        {
            "id": s.id,
            "stage_key": s.stage_key,
            "label": s.label,
            "sort_order": s.sort_order,
            "is_closed_won": s.is_closed_won,
            "is_closed_lost": s.is_closed_lost,
        }
        for s in stages
    ]
