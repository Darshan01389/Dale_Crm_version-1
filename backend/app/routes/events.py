from fastapi import APIRouter, Depends, Request, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.models.utm_tracking import UTMTracking
from app.models.website_event import WebsiteEvent
from app.schemas.tracking import WebsiteEventCreate, UTMTrackingCreate

router = APIRouter(prefix="/events", tags=["Event Tracking"])

@router.post("/")
async def ingest_event(
    event_in: WebsiteEventCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Ingest a tracking event from the client-side JS snippet.
    """
    # Create the event
    new_event = WebsiteEvent(**event_in.model_dump())
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return {"status": "success", "event_id": new_event.id}

@router.post("/utm")
async def register_utm(
    utm_in: UTMTrackingCreate,
    db: Session = Depends(get_db)
):
    """
    Register UTM parameters for a session or lead.
    """
    # Check if we already have UTM for this session
    existing = None
    if utm_in.session_id:
        existing = db.query(UTMTracking).filter(UTMTracking.session_id == utm_in.session_id).first()
    
    if existing:
        # Update existing
        for key, value in utm_in.model_dump(exclude_unset=True).items():
            setattr(existing, key, value)
        db.commit()
        return {"status": "updated", "utm_id": existing.id}
    else:
        new_utm = UTMTracking(**utm_in.model_dump())
        db.add(new_utm)
        db.commit()
        db.refresh(new_utm)
        return {"status": "created", "utm_id": new_utm.id}
