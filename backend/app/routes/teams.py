
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_admin_user
from app.models.user import User
from app.schemas.team import TeamCreate, TeamResponse
from app.services import team_service

router = APIRouter(prefix="/teams", tags=["Teams"])

@router.post("", response_model=TeamResponse, status_code=201)
def create_team(
    body: TeamCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """Admin only: Create a new team."""
    return team_service.create_team(db, body)

@router.get("", response_model=List[TeamResponse])
def list_teams(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    return team_service.list_teams(db, skip=skip, limit=limit)

@router.post("/{team_id}/members/{user_id}")
def add_member(
    team_id: UUID,
    user_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """Admin only: Assign a user to a team."""
    user = team_service.add_member_to_team(db, team_id, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"User {user.name} added to team successfully"}

@router.get("/{team_id}/members")
def list_members(
    team_id: UUID,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    members = team_service.list_team_members(db, team_id)
    return [{"id": m.id, "name": m.name, "email": m.email, "role": m.role} for m in members]
