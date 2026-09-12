"""
Research Extension Audit and Human Approval Routes for DalelQ.
Provides endpoints for reviewing decision-gate audit trails, evidence spans,
and resolving 'needs_approval' cases with correction logging per FR6, FR7, FR8.
"""

from typing import Optional, List
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.lead import Lead
from app.models.research_extension import (
    StageTransitionDecision,
    EvidenceSpan,
    AcousticFeatures,
    DecisionGateConfig,
)

router = APIRouter(prefix="/research", tags=["Research Extension & Audit"])


class HumanResolveRequest(BaseModel):
    action: str = Field(..., description="'approved' | 'rejected' | 'edited'")
    human_corrected_stage: Optional[str] = Field(None, description="Stage if action is edited")
    correction_reason: Optional[str] = Field(None, description="Reason for override/rejection")


class DecisionGateConfigUpdate(BaseModel):
    tau_high: float = Field(..., ge=0.5, le=1.0)
    tau_low: float = Field(..., ge=0.0, le=0.8)
    max_false_advancement_rate: Optional[float] = Field(0.01, ge=0.001, le=0.1)


@router.get("/decisions/pending")
def list_pending_decisions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns all stage transition decisions flagged as 'needs_approval' that await human review."""
    query = (
        db.query(StageTransitionDecision)
        .filter(
            StageTransitionDecision.decision == "needs_approval",
            StageTransitionDecision.human_action == None,
        )
        .order_by(StageTransitionDecision.created_at.desc())
    )

    decisions = query.limit(50).all()
    results = []
    for d in decisions:
        lead_name = d.lead.title if d.lead else "Unknown Lead"
        evidence = (
            db.query(EvidenceSpan)
            .filter(EvidenceSpan.voice_recording_id == d.voice_recording_id)
            .all()
        )
        results.append({
            "id": str(d.id),
            "lead_id": str(d.lead_id) if d.lead_id else None,
            "lead_name": lead_name,
            "candidate_transition": d.candidate_transition,
            "from_stage": d.from_stage,
            "to_stage": d.to_stage,
            "raw_score": d.raw_score,
            "calibrated_confidence": d.calibrated_confidence,
            "confidence_band": "moderate",
            "decision": d.decision,
            "created_at": d.created_at.isoformat() if d.created_at else None,
            "evidence_spans": [
                {
                    "quote": ev.quote,
                    "start_index": ev.start_index,
                    "end_index": ev.end_index,
                    "rationale": ev.rationale,
                }
                for ev in evidence
            ],
        })
    return results


@router.get("/decisions/lead/{lead_id}")
def get_lead_decisions(
    lead_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves decision audit history and evidence spans for a specific lead."""
    decisions = (
        db.query(StageTransitionDecision)
        .filter(StageTransitionDecision.lead_id == lead_id)
        .order_by(StageTransitionDecision.created_at.desc())
        .all()
    )

    results = []
    for d in decisions:
        evidence = (
            db.query(EvidenceSpan)
            .filter(EvidenceSpan.voice_recording_id == d.voice_recording_id)
            .all()
        )
        results.append({
            "id": str(d.id),
            "candidate_transition": d.candidate_transition,
            "from_stage": d.from_stage,
            "to_stage": d.to_stage,
            "raw_score": d.raw_score,
            "calibrated_confidence": d.calibrated_confidence,
            "decision": d.decision,
            "final_stage": d.final_stage,
            "human_action": d.human_action,
            "human_corrected_stage": d.human_corrected_stage,
            "correction_reason": d.correction_reason,
            "created_at": d.created_at.isoformat() if d.created_at else None,
            "resolved_at": d.resolved_at.isoformat() if d.resolved_at else None,
            "evidence_spans": [
                {
                    "quote": ev.quote,
                    "start_index": ev.start_index,
                    "end_index": ev.end_index,
                    "rationale": ev.rationale,
                }
                for ev in evidence
            ],
        })
    return results


@router.post("/decisions/{decision_id}/resolve")
def resolve_decision(
    decision_id: UUID,
    payload: HumanResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Resolves a 'needs_approval' decision.
    Handles 'approved', 'rejected', or 'edited' actions.
    Updates lead.status only on approved/edited, and logs full audit trail.
    """
    decision = (
        db.query(StageTransitionDecision)
        .filter(StageTransitionDecision.id == decision_id)
        .first()
    )
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    action = payload.action.lower()
    if action not in ["approved", "rejected", "edited"]:
        raise HTTPException(
            status_code=400,
            detail="Action must be 'approved', 'rejected', or 'edited'",
        )

    decision.human_action = action
    decision.resolved_at = datetime.utcnow()
    decision.correction_reason = payload.correction_reason

    lead = db.query(Lead).filter(Lead.id == decision.lead_id).first() if decision.lead_id else None

    if action == "approved":
        decision.final_stage = decision.to_stage
        if lead and decision.to_stage:
            lead.status = decision.to_stage
            db.add(lead)
    elif action == "edited":
        corrected = (payload.human_corrected_stage or "").lower()
        if not corrected:
            raise HTTPException(
                status_code=400,
                detail="human_corrected_stage required when action is 'edited'",
            )
        decision.human_corrected_stage = corrected
        decision.final_stage = corrected
        if lead:
            lead.status = corrected
            db.add(lead)
    elif action == "rejected":
        decision.final_stage = None
        # No CRM write on rejection

    db.commit()
    db.refresh(decision)

    return {
        "status": "success",
        "decision_id": str(decision.id),
        "human_action": decision.human_action,
        "final_stage": decision.final_stage,
        "correction_reason": decision.correction_reason,
    }


@router.get("/config")
def get_decision_gate_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns the current decision gate thresholds."""
    config = (
        db.query(DecisionGateConfig)
        .filter(DecisionGateConfig.is_active == True)
        .first()
    )
    if not config:
        return {
            "tau_high": 0.85,
            "tau_low": 0.55,
            "max_false_advancement_rate": 0.01,
            "source": "default",
        }
    return {
        "id": str(config.id),
        "tau_high": config.tau_high,
        "tau_low": config.tau_low,
        "max_false_advancement_rate": config.max_false_advancement_rate,
        "source": "database",
    }


@router.post("/config")
def update_decision_gate_config(
    payload: DecisionGateConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Updates decision gate thresholds (Admin/SuperAdmin)."""
    config = (
        db.query(DecisionGateConfig)
        .filter(DecisionGateConfig.is_active == True)
        .first()
    )
    if not config:
        config = DecisionGateConfig(
            tau_high=payload.tau_high,
            tau_low=payload.tau_low,
            max_false_advancement_rate=payload.max_false_advancement_rate or 0.01,
            is_active=True,
        )
        db.add(config)
    else:
        config.tau_high = payload.tau_high
        config.tau_low = payload.tau_low
        if payload.max_false_advancement_rate:
            config.max_false_advancement_rate = payload.max_false_advancement_rate

    db.commit()
    db.refresh(config)
    return {
        "status": "success",
        "tau_high": config.tau_high,
        "tau_low": config.tau_low,
        "max_false_advancement_rate": config.max_false_advancement_rate,
    }
