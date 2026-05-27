from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_admin_user
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user)
):
    """Admin only: List all users."""
    return db.query(User).all()


from pydantic import BaseModel

class JoinRequest(BaseModel):
    code: str

@router.post("/join")
def join_workspace_or_team(
    body: JoinRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    code_str = body.code.strip()
    if not code_str:
        raise HTTPException(status_code=400, detail="Invite code cannot be empty.")
        
    # Check if the user is banned from the organisation completely
    if current_user.company_banned:
        raise HTTPException(
            status_code=403,
            detail="You have been removed from this organisation and cannot rejoin via code. Please contact an admin."
        )
    
    from app.models.company import Company
    from app.models.team import Team
    
    # 1. Check if the code is a Company join code
    company = db.query(Company).filter(Company.join_code == code_str).first()
    if company:
        already_joined = (current_user.company_id == company.id)
        current_user.company_id = company.id
        db.commit()
        db.refresh(current_user)
        
        # Check if the user is also in a team to customize the already in response
        team_name = None
        if current_user.team_id:
            team = db.query(Team).filter(Team.id == current_user.team_id).first()
            if team:
                team_name = team.name
        
        if already_joined:
            if team_name:
                msg = f"You are already in '{company.name}' and '{team_name}'."
            else:
                msg = f"You are already in '{company.name}'."
            return {"status": "already", "message": msg}
        else:
            if team_name:
                msg = f"You are a part of '{team_name}' under '{company.name}'."
            else:
                msg = f"You are a part of '{company.name}'."
            return {"status": "success", "message": msg}
            
    # 2. Check if the code is a Team join code
    team = db.query(Team).filter(Team.join_code == code_str).first()
    if team:
        # Check if the user is banned from rejoining this specific team
        if current_user.banned_team_ids:
            banned_list = [tid.strip() for tid in current_user.banned_team_ids.split(",") if tid.strip()]
            if str(team.id) in banned_list:
                raise HTTPException(
                    status_code=403,
                    detail="You have been removed from this team and cannot rejoin via code. Please contact an admin."
                )

        # Find the single company workspace
        company = db.query(Company).first()
        company_name = company.name if company else "Organisation"
        company_id = company.id if company else None
        
        # If user missed joining the organization first, joining a team automatically brings them under it
        already_joined = (current_user.team_id == team.id) and (current_user.company_id == company_id)
        
        current_user.team_id = team.id
        if company_id:
            current_user.company_id = company_id
            
        db.commit()
        db.refresh(current_user)
        
        if already_joined:
            msg = f"You are already in '{company_name}' and '{team.name}'."
            return {"status": "already", "message": msg}
        else:
            msg = f"You are a part of '{team.name}' under '{company_name}'."
            return {"status": "success", "message": msg}
            
    # If the code matches neither
    raise HTTPException(
        status_code=400,
        detail="Invalid Organization or Team Join Code. Please verify your invitation."
    )


from uuid import UUID

@router.post("/{user_id}/remove-team")
def remove_user_from_team(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Permission Check: Must be Admin or target user's team Manager (Team Lead)
    is_admin = current_user.role in ['Owner / Admin', 'Sales Admin']
    is_manager = current_user.role == 'Team Lead' and current_user.team_id == target.team_id
    
    if not (is_admin or is_manager):
        raise HTTPException(status_code=403, detail="You do not have permission to remove this member.")
        
    if target.team_id:
        # Append team_id to banned_team_ids list
        banned = [tid.strip() for tid in target.banned_team_ids.split(",") if tid.strip()]
        if str(target.team_id) not in banned:
            banned.append(str(target.team_id))
        target.banned_team_ids = ",".join(banned)
        
        target.team_id = None
        db.commit()
        db.refresh(target)
        
    return {"message": f"Successfully removed {target.name} from the team squad."}


@router.post("/{user_id}/remove-company")
def remove_user_from_company(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
        
    target.company_id = None
    target.team_id = None
    target.company_banned = True
    
    db.commit()
    db.refresh(target)
    return {"message": f"Successfully removed {target.name} from the organisation completely."}
