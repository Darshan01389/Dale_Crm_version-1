"""
Decision Gate Service for DalelQ Research Extension.
Implements the safety-critical selective prediction / learning-to-defer policy:
- confidence >= tau_high -> auto_update (writes lead.status)
- tau_low <= confidence < tau_high -> needs_approval (logged, human approval requested)
- confidence < tau_low -> no_update (logged only)

SAFETY INVARIANT:
Only the Decision Gate writes lead.status.
Every single write or abstention produces an immutable audit row in stage_transition_decisions.
"""

import logging
from typing import Dict, Any, Optional, List
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.lead import Lead
from app.models.research_extension import (
    EvidenceSpan,
    StageTransitionDecision,
    AcousticFeatures,
    DecisionGateConfig,
)
from app.ml.acoustic_extractor import acoustic_extractor
from app.ml.crm_context_encoder import crm_context_encoder
from app.ml.fusion_model import fusion_model
from app.ml.calibration_service import calibrator

logger = logging.getLogger(__name__)

# Fallback default thresholds if no DB config exists
DEFAULT_TAU_HIGH = 0.85
DEFAULT_TAU_LOW = 0.55


class DecisionGateService:
    """
    Evaluates candidate stage transitions using multimodal fusion and calibrated confidence.
    Enforces safety invariant and selective prediction policy.
    """

    def get_thresholds(self, db: Session, company_id: Optional[int] = None) -> tuple[float, float]:
        """Loads configurable tau_high and tau_low from DecisionGateConfig table per rules.md #13."""
        try:
            query = db.query(DecisionGateConfig).filter(DecisionGateConfig.is_active == True)
            if company_id:
                query = query.filter(DecisionGateConfig.company_id == company_id)
            config = query.first()
            if config:
                return float(config.tau_high), float(config.tau_low)
        except Exception as e:
            logger.debug("Could not read DecisionGateConfig: %s", e)

        return DEFAULT_TAU_HIGH, DEFAULT_TAU_LOW

    def evaluate_and_execute(
        self,
        db: Session,
        lead_id: Optional[UUID],
        voice_recording_id: UUID,
        transcript: str,
        analysis: Dict[str, Any],
        audio_file_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Main entry point invoked post-call.
        Replaces unsafe voice.py lines 137-144 direct writes.
        """
        lead = None
        lead_dict = {}
        current_stage = "new"
        company_id = None

        if lead_id:
            lead = db.query(Lead).filter(Lead.id == lead_id).first()
            if lead:
                current_stage = lead.status or "new"
                company_id = lead.company_id
                lead_dict = {
                    "status": lead.status,
                    "ai_score": lead.ai_score,
                    "ml_lead_score": lead.ml_lead_score,
                    "conversion_probability": lead.conversion_probability,
                    "sentiment_compound": lead.sentiment_compound,
                    "activity_count": len(lead.activities) if hasattr(lead, "activities") else 1,
                }

        # 1. Acoustic feature extraction & DB persistence
        acoustic_dict = {}
        if audio_file_path:
            acoustic_dict = acoustic_extractor.extract_from_file(audio_file_path)
            try:
                # Check if acoustic features record already exists
                existing_af = db.query(AcousticFeatures).filter(
                    AcousticFeatures.voice_recording_id == voice_recording_id
                ).first()
                if not existing_af:
                    af_record = AcousticFeatures(
                        voice_recording_id=voice_recording_id,
                        pitch_mean=acoustic_dict.get("pitch_mean"),
                        pitch_std=acoustic_dict.get("pitch_std"),
                        energy_mean=acoustic_dict.get("energy_mean"),
                        energy_std=acoustic_dict.get("energy_std"),
                        speaking_rate=acoustic_dict.get("speaking_rate"),
                        pause_duration_mean=acoustic_dict.get("pause_duration_mean"),
                        turn_taking_ratio=acoustic_dict.get("turn_taking_ratio"),
                        jitter=acoustic_dict.get("jitter"),
                        shimmer=acoustic_dict.get("shimmer"),
                        extractor=acoustic_dict.get("extractor", "librosa"),
                    )
                    db.add(af_record)
                    db.flush()
            except Exception as e:
                logger.error("Error saving acoustic features: %s", e)

        # 2. Encode CRM context
        crm_context_vec = crm_context_encoder.encode(lead_dict)

        # 3. Retrieve or construct candidate transitions
        candidate_transitions = analysis.get("candidate_transitions", [])
        
        # Fallback if LLM only emitted suggested_stage
        if not candidate_transitions and analysis.get("suggested_stage"):
            suggested = str(analysis.get("suggested_stage")).lower()
            if suggested != current_stage:
                candidate_transitions = [{
                    "from_stage": current_stage,
                    "to_stage": suggested,
                    "recommend_transition": True,
                    "evidence": []
                }]

        tau_high, tau_low = self.get_thresholds(db, company_id)
        decision_results = []

        # If no candidates proposed, record neutral no_update
        if not candidate_transitions:
            candidate_transitions = [{
                "from_stage": current_stage,
                "to_stage": current_stage,
                "recommend_transition": False,
                "evidence": []
            }]

        for cand in candidate_transitions:
            from_stage = cand.get("from_stage", current_stage)
            to_stage = cand.get("to_stage", current_stage)
            cand_key = f"{from_stage}->{to_stage}"

            # Save validated evidence spans to DB
            for ev in cand.get("evidence", []):
                quote = ev.get("quote", "")
                if quote and len(quote) >= 5:
                    ev_record = EvidenceSpan(
                        voice_recording_id=voice_recording_id,
                        candidate_transition=cand_key,
                        quote=quote,
                        start_index=ev.get("start_index", 0),
                        end_index=ev.get("end_index", len(quote)),
                        rationale=ev.get("rationale", "Extracted evidence quote"),
                        recommend_transition=cand.get("recommend_transition", True)
                    )
                    db.add(ev_record)

            # 4. Multimodal feature vector & fusion scoring
            feature_vec = fusion_model.build_feature_vector(
                semantic_data=analysis,
                acoustic_data=acoustic_dict,
                crm_context=crm_context_vec,
                candidate_transition=cand
            )
            raw_score = fusion_model.predict_raw_score(feature_vec)

            # 5. Confidence calibration
            calibrated_conf = calibrator.calibrate(raw_score)

            # 6. Apply three-way selective prediction policy
            if calibrated_conf >= tau_high:
                decision = "auto_update"
                final_stage = to_stage
                # SAFE WRITE: Only Decision Gate executes this mutation
                if lead and to_stage in ["new", "contacted", "discovery", "proposal", "negotiation", "won", "lost"]:
                    lead.status = to_stage
                    db.add(lead)
            elif calibrated_conf >= tau_low:
                decision = "needs_approval"
                final_stage = None  # Requires human resolution
            else:
                decision = "no_update"
                final_stage = None

            # 7. Immutable Audit Trail Persistence
            audit_record = StageTransitionDecision(
                lead_id=lead_id,
                deal_id=None,
                voice_recording_id=voice_recording_id,
                candidate_transition=cand_key,
                from_stage=from_stage,
                to_stage=to_stage,
                raw_score=round(raw_score, 4),
                calibrated_confidence=round(calibrated_conf, 4),
                decision=decision,
                final_stage=final_stage,
                human_action="approved" if decision == "auto_update" else None,
                created_at=datetime.utcnow()
            )
            db.add(audit_record)
            db.flush()

            decision_results.append({
                "decision_id": str(audit_record.id),
                "candidate_transition": cand_key,
                "from_stage": from_stage,
                "to_stage": to_stage,
                "raw_score": round(raw_score, 4),
                "calibrated_confidence": round(calibrated_conf, 4),
                "confidence_band": "likely" if calibrated_conf >= tau_high else ("moderate" if calibrated_conf >= tau_low else "uncertain"),
                "decision": decision,
                "final_stage": final_stage,
                "tau_high": tau_high,
                "tau_low": tau_low,
                "evidence_spans": cand.get("evidence", [])
            })

        db.commit()

        return {
            "primary_decision": decision_results[0] if decision_results else None,
            "all_candidates": decision_results,
            "acoustic_metrics": acoustic_dict,
        }


# Global singleton instance
decision_gate_service = DecisionGateService()
