from sqlalchemy.orm import Session
from uuid import UUID
import logging
from typing import Dict, Any

from app.models.lead import Lead
from app.models.automation_rule import AutomationRule
from app.services.lead_service import assign_lead

logger = logging.getLogger(__name__)

def evaluate_rules_for_lead(db: Session, lead_id: UUID, current_user_id: UUID = None):
    """
    Evaluates all active automation rules against a lead.
    If conditions match, executes the rule's action.
    """
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        return

    rules = db.query(AutomationRule).filter(AutomationRule.is_active == True).all()

    for rule in rules:
        try:
            if _evaluate_conditions(rule.conditions, lead):
                _execute_action(db, rule, lead, current_user_id)
        except Exception as e:
            logger.error(f"Error evaluating rule {rule.id} for lead {lead.id}: {str(e)}")


def _evaluate_conditions(conditions: list, lead: Lead) -> bool:
    """
    Evaluates a list of conditions against a Lead object.
    Supports basic AND logic for all conditions in the list.
    """
    if not conditions:
        return False
        
    for cond in conditions:
        field = cond.get("field")
        operator = cond.get("operator")
        value = cond.get("value")

        if not hasattr(lead, field):
            return False
            
        lead_val = getattr(lead, field)

        if operator == "equals":
            if str(lead_val).lower() != str(value).lower():
                return False
        elif operator == "contains":
            if not lead_val or str(value).lower() not in str(lead_val).lower():
                return False
        elif operator == "greater_than":
            try:
                if float(lead_val) <= float(value):
                    return False
            except:
                return False
        else:
            return False

    return True


def _execute_action(db: Session, rule: AutomationRule, lead: Lead, current_user_id: UUID):
    """
    Executes the action defined in the rule.
    """
    action_type = rule.action_type
    payload = rule.action_payload

    if action_type == "assign_to_user":
        target_user_id = payload.get("user_id")
        if target_user_id:
            try:
                assign_lead(db, lead.id, UUID(target_user_id), current_user_id or UUID(target_user_id))
            except Exception as e:
                logger.error(f"Failed to auto-assign lead: {str(e)}")
                
    elif action_type == "change_status":
        new_status = payload.get("status")
        if new_status:
            lead.status = new_status
            db.commit()
            
    # Additional actions like 'send_email', 'add_tag' can be added here
    logger.info(f"Executed rule '{rule.name}' on lead {lead.id}")
