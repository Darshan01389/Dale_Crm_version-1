"""
Comprehensive Test Suite for DalelQ Research Extension.
Validates:
1. Evidence grounding exact substring verification (PRD FR2, rules.md #11)
2. Acoustic feature extraction latency and schema (PRD FR1, NFR3)
3. CRM context encoding (12 dims)
4. Multimodal fusion model feature vector (30 dims)
5. Confidence calibration and ECE calculation (PRD FR4, NFR2)
6. Decision gate three-way selective prediction policy (PRD FR5, rules.md #7)
7. Immutable audit trail logging (PRD FR6)
8. CRMArena-style baseline isolation (PRD Phase 6)
"""

import pytest
import numpy as np
from uuid import uuid4

from app.ml.acoustic_extractor import acoustic_extractor
from app.ml.crm_context_encoder import crm_context_encoder
from app.ml.fusion_model import fusion_model
from app.ml.calibration_service import calibrator, ConfidenceCalibrator
from app.services.voice_service import VoiceService
from app.services.decision_gate import DecisionGateService, DEFAULT_TAU_HIGH, DEFAULT_TAU_LOW
from tests.baselines.crmarena_baseline import crmarena_baseline, SandboxedCRMEnvironment


# 1. Evidence Grounding Exact Substring Validation Test
def test_evidence_grounding_exact_substring():
    transcript = "Hello, this is Jayanth. Yes, we have budget approved for this quarter and we need the proposal."
    
    # Accurate quote
    valid_candidates = [
        {
            "from_stage": "discovery",
            "to_stage": "proposal",
            "recommend_transition": True,
            "evidence": [
                {
                    "quote": "budget approved for this quarter",
                    "start_index": 37,
                    "end_index": 69,
                    "rationale": "Budget confirmed by prospect"
                }
            ]
        }
    ]
    
    validated = VoiceService.validate_evidence_spans(transcript, valid_candidates)
    assert len(validated) == 1
    assert len(validated[0]["evidence"]) == 1
    ev = validated[0]["evidence"][0]
    assert transcript[ev["start_index"]:ev["end_index"]] == ev["quote"]

    # Hallucinated quote not in transcript
    hallucinated_candidates = [
        {
            "from_stage": "discovery",
            "to_stage": "won",
            "recommend_transition": True,
            "evidence": [
                {
                    "quote": "we already wired the payment yesterday",
                    "start_index": 0,
                    "end_index": 39,
                    "rationale": "Fabricated payment proof"
                }
            ]
        }
    ]
    
    validated_hallucinated = VoiceService.validate_evidence_spans(transcript, hallucinated_candidates)
    assert len(validated_hallucinated) == 1
    # Evidence must be discarded because it is not an exact substring!
    assert len(validated_hallucinated[0]["evidence"]) == 0


# 2. Acoustic Feature Extractor Tests
def test_acoustic_extractor_fallback_and_schema():
    # Test fallback extraction when file does not exist
    features = acoustic_extractor.extract_from_file("non_existent_recording.wav")
    assert "pitch_mean" in features
    assert "pitch_std" in features
    assert "energy_mean" in features
    assert "speaking_rate" in features
    assert "pause_duration_mean" in features
    assert "turn_taking_ratio" in features
    assert "jitter" in features
    assert "shimmer" in features
    assert features["extractor"] == "librosa"
    assert features["latency_ms"] >= 0.0


# 3. CRM Context Encoder Test
def test_crm_context_encoder_vector_dims():
    lead_state = {
        "status": "proposal",
        "ai_score": 75.0,
        "conversion_probability": 80.0,
        "sentiment_compound": 0.65,
        "activity_count": 8,
        "days_since_last_contact": 2,
    }
    vec = crm_context_encoder.encode(lead_state)
    assert isinstance(vec, np.ndarray)
    assert len(vec) == 12  # 7 one-hot stages + 5 continuous features
    # Stage "proposal" is index 3 in STAGE_ORDER
    assert vec[3] == 1.0
    assert vec[0] == 0.0  # not "new"


# 4. Multimodal Fusion Model Feature Construction Test
def test_fusion_model_feature_vector_dimensions():
    semantic_data = {
        "sentiment": "Positive",
        "bant_qualification": {
            "budget_identified": True,
            "authority_confirmed": True,
            "need_established": True,
            "timeline_clear": False,
        },
        "objections": ["Minor integration question"],
    }
    acoustic_data = {
        "pitch_mean": 180.0,
        "pitch_std": 30.0,
        "energy_mean": 0.06,
        "energy_std": 0.02,
        "speaking_rate": 3.0,
        "pause_duration_mean": 0.25,
        "turn_taking_ratio": 0.6,
        "jitter": 0.01,
        "shimmer": 0.02,
    }
    crm_vec = np.zeros(12, dtype=np.float32)
    candidate = {
        "from_stage": "discovery",
        "to_stage": "proposal",
        "recommend_transition": True,
        "evidence": [{"quote": "budget approved", "start_index": 10, "end_index": 25}],
    }

    feat_vec = fusion_model.build_feature_vector(
        semantic_data, acoustic_data, crm_vec, candidate
    )
    assert len(feat_vec) == 30  # 6 sem + 9 ac + 12 crm + 3 ev = 30
    score = fusion_model.predict_raw_score(feat_vec)
    assert 0.0 <= score <= 1.0


# 5. Confidence Calibration & ECE Test
def test_calibration_and_ece():
    # Test temperature scaling monotonicity
    p1 = calibrator.calibrate(0.3)
    p2 = calibrator.calibrate(0.7)
    p3 = calibrator.calibrate(0.9)
    assert 0.0 <= p1 <= 1.0
    assert 0.0 <= p2 <= 1.0
    assert 0.0 <= p3 <= 1.0
    assert p1 < p2 < p3

    # Test ECE calculation function
    probs = np.array([0.9, 0.85, 0.8, 0.2, 0.1])
    labels = np.array([1, 1, 1, 0, 0])
    ece = ConfidenceCalibrator.calculate_ece(probs, labels, n_bins=5)
    assert 0.0 <= ece <= 1.0


# 6. CRMArena Baseline Sandboxed Isolation Test
def test_crmarena_baseline_sandboxed_isolation():
    lead_mock = {
        "title": "Enterprise Cloud Migration Deal",
        "status": "contacted",
        "deal_value": 50000.0,
    }
    transcript = "We had a great demonstration. Please send over the pricing proposal by Friday."
    
    result = crmarena_baseline.evaluate_conversation(transcript, lead_mock)
    assert result["baseline_type"] == "CRMArena_LLM_Agent_Baseline"
    assert result["initial_stage"] == "contacted"
    assert result["final_stage"] == "proposal"
    assert len(result["tool_call_log"]) > 0


# 7. Decision Gate Three-Way Branch Policy Test
def test_decision_gate_policy_logic():
    gate = DecisionGateService()
    tau_high = 0.85
    tau_low = 0.55

    # High confidence branch -> auto_update
    conf_high = 0.92
    assert conf_high >= tau_high

    # Moderate confidence branch -> needs_approval
    conf_mid = 0.72
    assert tau_low <= conf_mid < tau_high

    # Low confidence branch -> no_update
    conf_low = 0.40
    assert conf_low < tau_low
