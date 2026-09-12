from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from pydantic import BaseModel

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

@router.put("/rules/{rule_id}", response_model=AutomationRuleResponse)
def update_rule(
    rule_id: UUID,
    rule_in: AutomationRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["Owner / Admin", "Sales Admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit rules.")
        
    rule = db.query(AutomationRule).filter(AutomationRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
        
    update_data = rule_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)
        
    db.commit()
    db.refresh(rule)
    return rule

class TestRuleRequest(BaseModel):
    lead_id: UUID

@router.post("/rules/{rule_id}/test")
def test_rule(
    rule_id: UUID,
    body: TestRuleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["Owner / Admin", "Sales Admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to test rules.")
        
    from app.services import automation_service
    res = automation_service.dry_run_rule(db, rule_id, body.lead_id)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res


@router.post("/rules/{rule_id}/simulate")
def simulate_sequence(
    rule_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Simulate and preview multi-touch drip cadence execution timeline."""
    rule = db.query(AutomationRule).filter(AutomationRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
        
    payload = rule.action_payload or {}
    steps = payload.get("steps", [])
    if not steps:
        steps = [{
            "step": 1,
            "channel": rule.action_type,
            "delay_days": 0,
            "template": f"Execute single action: {rule.action_type}"
        }]
        
    timeline = []
    accumulated_delay = 0
    for s in steps:
        delay = int(s.get("delay_days", 0))
        accumulated_delay += delay
        timeline.append({
            "step": s.get("step", len(timeline) + 1),
            "channel": s.get("channel", "whatsapp"),
            "delay_days": delay,
            "scheduled_time": f"Day {accumulated_delay + 1}",
            "template": s.get("template", "Automated outreach template"),
            "status": "Ready to dispatch",
            "condition": "Immediate trigger" if len(timeline) == 0 else f"Dispatched +{delay}d after previous step"
        })
        
    return {
        "rule_id": str(rule.id),
        "rule_name": rule.name,
        "is_active": rule.is_active,
        "total_touches": len(timeline),
        "total_cadence_days": accumulated_delay + 1,
        "sequence_timeline": timeline
    }
