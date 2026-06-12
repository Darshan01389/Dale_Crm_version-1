from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.calendar_event import CalendarEvent
from app.schemas.calendar import CalendarEventCreate, CalendarEventUpdate, CalendarEventResponse

router = APIRouter(prefix="/calendar/events", tags=["Calendar"])

def _check_event_access(event: CalendarEvent, user: User, db: Session):
    # 1. Super admin has full access
    if user.is_super_admin:
        return
    
    # 2. Check if owner of event
    if event.owner_id == user.id:
        return
        
    event_owner = db.query(User).filter(User.id == event.owner_id).first()
    if not event_owner:
        raise HTTPException(status_code=403, detail="Not allowed to access this event")
        
    # 3. Company Admin check
    if user.is_company_admin:
        if event_owner.company_id == user.company_id:
            return
        raise HTTPException(status_code=403, detail="Not allowed to access events outside your company")
        
    # 4. Team Lead/Manager check
    if user.role in ["Team Lead", "Manager"]:
        if user.team_id and event_owner.team_id == user.team_id:
            return
        if user.company_id and event_owner.company_id == user.company_id:
            return
            
    raise HTTPException(status_code=403, detail="Not allowed to access this event")

@router.post("", response_model=CalendarEventResponse, status_code=201)
def create_event(
    body: CalendarEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = CalendarEvent(
        owner_id=current_user.id,
        lead_id=body.lead_id,
        title=body.title,
        description=body.description,
        start_time=body.start_time,
        end_time=body.end_time,
        event_type=body.event_type,
        attendees=body.attendees,
        is_all_day=body.is_all_day,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@router.get("", response_model=list[CalendarEventResponse])
def list_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(CalendarEvent)
    
    if current_user.is_super_admin:
        # Super admin sees all events
        pass
    elif current_user.is_company_admin:
        # Company admin sees all events in company
        query = query.join(User, CalendarEvent.owner_id == User.id).filter(User.company_id == current_user.company_id)
    elif current_user.role in ["Team Lead", "Manager"]:
        # Team lead / Manager sees team events, or company events if no team_id
        if current_user.team_id:
            query = query.join(User, CalendarEvent.owner_id == User.id).filter(User.team_id == current_user.team_id)
        elif current_user.company_id:
            query = query.join(User, CalendarEvent.owner_id == User.id).filter(User.company_id == current_user.company_id)
        else:
            query = query.filter(CalendarEvent.owner_id == current_user.id)
    else:
        # Sales Rep / normal user sees own events
        query = query.filter(CalendarEvent.owner_id == current_user.id)
        
    return query.all()

@router.get("/{event_id}", response_model=CalendarEventResponse)
def get_event(
    event_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    _check_event_access(event, current_user, db)
    return event

@router.patch("/{event_id}", response_model=CalendarEventResponse)
def update_event(
    event_id: UUID,
    body: CalendarEventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    _check_event_access(event, current_user, db)
    
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
        
    db.commit()
    db.refresh(event)
    return event

@router.delete("/{event_id}", status_code=204)
def delete_event(
    event_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    _check_event_access(event, current_user, db)
    db.delete(event)
    db.commit()
