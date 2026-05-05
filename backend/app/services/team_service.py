
from sqlalchemy.orm import Session
from uuid import UUID
from app.models.team import Team
from app.models.user import User
from app.schemas.team import TeamCreate

def create_team(db: Session, data: TeamCreate) -> Team:
    row = Team(**data.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

def list_teams(db: Session, skip: int = 0, limit: int = 50):
    return db.query(Team).offset(skip).limit(limit).all()

def get_team(db: Session, team_id: UUID) -> Team:
    return db.query(Team).filter(Team.id == team_id).first()

def add_member_to_team(db: Session, team_id: UUID, user_id: UUID):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.team_id = team_id
        db.commit()
        db.refresh(user)
    return user

def list_team_members(db: Session, team_id: UUID):
    return db.query(User).filter(User.team_id == team_id).all()
