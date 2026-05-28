from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.lead_source import LeadSource
from app.schemas.lead_source import LeadSourceCreate, LeadSourceUpdate, LeadSourceResponse

router = APIRouter(prefix="/lead-sources", tags=["Lead Sources"])

@router.get("/", response_model=List[LeadSourceResponse])
def get_lead_sources(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Assuming lead sources are company-wide. If multi-tenant, filter by company_id
    sources = db.query(LeadSource).order_by(LeadSource.created_at.desc()).all()
    return sources

@router.post("/", response_model=LeadSourceResponse, status_code=status.HTTP_201_CREATED)
def create_lead_source(
    source_in: LeadSourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Depending on role, might restrict this to Owner / Admin only
    new_source = LeadSource(**source_in.model_dump())
    db.add(new_source)
    db.commit()
    db.refresh(new_source)
    return new_source

@router.get("/{source_id}", response_model=LeadSourceResponse)
def get_lead_source(
    source_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    source = db.query(LeadSource).filter(LeadSource.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Lead source not found")
    return source

@router.put("/{source_id}", response_model=LeadSourceResponse)
def update_lead_source(
    source_id: UUID,
    source_update: LeadSourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    source = db.query(LeadSource).filter(LeadSource.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Lead source not found")

    update_data = source_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(source, key, value)

    db.commit()
    db.refresh(source)
    return source

@router.delete("/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead_source(
    source_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    source = db.query(LeadSource).filter(LeadSource.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Lead source not found")
    
    db.delete(source)
    db.commit()
    return None
