from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.automation_rule import AutomationRule
from app.schemas.automation import AutomationRuleCreate, AutomationRuleUpdate, AutomationRuleResponse

router = APIRouter(prefix="/automation", tags=["Automation"])

@router.get("/rules", response_model=List[AutomationRuleResponse])
def get_rules(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(AutomationRule).all()

@router.post("/rules", response_model=AutomationRuleResponse, status_code=status.HTTP_201_CREATED)
def create_rule(rule_in: AutomationRuleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["Owner / Admin", "Sales Admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to create rules.")
        
    rule = AutomationRule(**rule_in.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rule(rule_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["Owner / Admin", "Sales Admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")
        
    rule = db.query(AutomationRule).filter(AutomationRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
        
    db.delete(rule)
    db.commit()
