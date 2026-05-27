
from sqlalchemy.orm import Session
from uuid import UUID
from app.models.team import Team
from app.models.user import User
from app.schemas.team import TeamCreate

def create_team(db: Session, data: TeamCreate) -> Team:
    import random
    row = Team(**data.model_dump())
    row.join_code = str(random.randint(100000, 999999))
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

def list_teams(db: Session, skip: int = 0, limit: int = 50):
    teams = db.query(Team).offset(skip).limit(limit).all()
    import random
    updated = False
    for t in teams:
        if not t.join_code:
            t.join_code = str(random.randint(100000, 999999))
            updated = True
    if updated:
        db.commit()
    return teams

def get_team(db: Session, team_id: UUID) -> Team:
    return db.query(Team).filter(Team.id == team_id).first()

def add_member_to_team(db: Session, team_id: UUID, user_id: UUID):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        from app.models.company import Company
        company = db.query(Company).first()
        
        user.team_id = team_id
        if company:
            user.company_id = company.id
        user.company_banned = False
        
        # Remove team_id from banned_team_ids list
        if user.banned_team_ids:
            teams_list = [tid.strip() for tid in user.banned_team_ids.split(",") if tid.strip()]
            if str(team_id) in teams_list:
                teams_list.remove(str(team_id))
            user.banned_team_ids = ",".join(teams_list)
            
        db.commit()
        db.refresh(user)
    return user

def list_team_members(db: Session, team_id: UUID):
    return db.query(User).filter(User.team_id == team_id).all()

def delete_team(db: Session, team_id: UUID) -> bool:
    # 1. Unassign all members first
    members = db.query(User).filter(User.team_id == team_id).all()
    for m in members:
        m.team_id = None
    
    # 2. Delete team
    team = db.query(Team).filter(Team.id == team_id).first()
    if team:
        db.delete(team)
        db.commit()
        return True
    return False
