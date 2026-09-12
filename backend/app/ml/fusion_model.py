"""
Fusion Model for DalelQ Research Extension.
Combines semantic extractions, acoustic prosody, pre-convo CRM context,
and grounded evidence features to produce a raw candidate transition score.
"""

import os
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np

logger = logging.getLogger(__name__)

ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"
FUSION_MODEL_PATH = ARTIFACT_DIR / "fusion_model.joblib"


class StageTransitionFusionModel:
    """
    Multimodal fusion classifier predicting candidate stage transition viability.
    Uses gradient boosting (XGBoost / GradientBoostingClassifier) or linear baseline.
    """

    def __init__(self):
        self.model = None
        self._load_or_init()

    def _load_or_init(self):
        """Loads serialized model artifact or initializes default fallback weights."""
        if FUSION_MODEL_PATH.exists():
            try:
                import joblib
                self.model = joblib.load(FUSION_MODEL_PATH)
                logger.info("Loaded serialized fusion model from %s", FUSION_MODEL_PATH)
                return
            except Exception as e:
                logger.warning("Could not load fusion model artifact: %s", e)
        
        self.model = None

    def build_feature_vector(
        self,
        semantic_data: Dict[str, Any],
        acoustic_data: Dict[str, Any],
        crm_context: np.ndarray,
        candidate_transition: Dict[str, Any]
    ) -> np.ndarray:
        """
        Concatenates all multimodal feature representations:
        1. Semantic flags: sentiment (-1, 0, 1), BANT (4 booleans), objections count
        2. Acoustic prosody: 9 dimensions (pitch, energy, rate, pause, ratio, jitter, shimmer)
        3. CRM context vector: 12 dimensions
        4. Evidence-span features: count, recommend boolean, total quote length
        Total dimension: 6 + 9 + 12 + 3 = 30 dimensions.
        """
        # 1. Semantic features (6 dims)
        sentiment_label = str(semantic_data.get("sentiment", "Neutral")).lower()
        sent_val = 1.0 if "pos" in sentiment_label else (-1.0 if "neg" in sentiment_label else 0.0)
        
        bant = semantic_data.get("bant_qualification", {})
        budget = 1.0 if bant.get("budget_identified") else 0.0
        authority = 1.0 if bant.get("authority_confirmed") else 0.0
        need = 1.0 if bant.get("need_established") else 0.0
        timeline = 1.0 if bant.get("timeline_clear") else 0.0
        
        objections = semantic_data.get("objections", [])
        obj_count = min(1.0, len(objections) / 5.0)
        
        sem_vec = np.array([sent_val, budget, authority, need, timeline, obj_count], dtype=np.float32)

        # 2. Acoustic features (9 dims)
        ac_vec = np.array([
            float(acoustic_data.get("pitch_mean", 150.0)) / 300.0,
            float(acoustic_data.get("pitch_std", 25.0)) / 100.0,
            float(acoustic_data.get("energy_mean", 0.05)) * 10.0,
            float(acoustic_data.get("energy_std", 0.02)) * 10.0,
            float(acoustic_data.get("speaking_rate", 2.5)) / 10.0,
            float(acoustic_data.get("pause_duration_mean", 0.3)) / 2.0,
            float(acoustic_data.get("turn_taking_ratio", 0.5)),
            float(acoustic_data.get("jitter", 0.01)) * 50.0,
            float(acoustic_data.get("shimmer", 0.02)) * 20.0
        ], dtype=np.float32)

        # 3. CRM Context vector (12 dims)
        if crm_context is None or len(crm_context) != 12:
            crm_vec = np.zeros(12, dtype=np.float32)
        else:
            crm_vec = crm_context.astype(np.float32)

        # 4. Evidence-span features (3 dims)
        evidence = candidate_transition.get("evidence", [])
        ev_count = min(1.0, len(evidence) / 5.0)
        recommend_bool = 1.0 if candidate_transition.get("recommend_transition") else 0.0
        total_len = sum(len(e.get("quote", "")) for e in evidence)
        norm_len = min(1.0, total_len / 500.0)
        
        ev_vec = np.array([ev_count, recommend_bool, norm_len], dtype=np.float32)

        return np.concatenate([sem_vec, ac_vec, crm_vec, ev_vec])

    def predict_raw_score(self, feature_vector: np.ndarray) -> float:
        """
        Computes raw scalar score for candidate transition.
        If trained model is loaded, uses decision_function / probability.
        Otherwise, applies calibrated heuristic dot-product baseline.
        """
        if self.model is not None:
            try:
                X = feature_vector.reshape(1, -1)
                if hasattr(self.model, "predict_proba"):
                    return float(self.model.predict_proba(X)[0][1])
                elif hasattr(self.model, "decision_function"):
                    return float(self.model.decision_function(X)[0])
            except Exception as e:
                logger.error("Model prediction error: %s; using deterministic baseline", e)

        # Deterministic Baseline scoring:
        # Weighted linear combination of semantic grounding, acoustic stability, and CRM context
        w_sem = 0.40
        w_ev = 0.35
        w_crm = 0.15
        w_ac = 0.10

        sem_score = (feature_vector[0] + 1.0) / 2.0 * 0.2 + (feature_vector[1] + feature_vector[2] + feature_vector[3] + feature_vector[4]) / 4.0 * 0.8
        ev_score = feature_vector[27] * 0.4 + feature_vector[28] * 0.4 + feature_vector[29] * 0.2
        crm_score = feature_vector[19] * 0.5 + feature_vector[20] * 0.5  # score and conv prob
        ac_score = 1.0 - min(1.0, feature_vector[11] * 0.5 + feature_vector[13] * 0.5)  # low pause and jitter = positive

        raw_score = (w_sem * sem_score) + (w_ev * ev_score) + (w_crm * crm_score) + (w_ac * ac_score)
        return float(np.clip(raw_score, 0.0, 1.0))

    def train_and_save(self, X: np.ndarray, y: np.ndarray):
        """Trains GradientBoostingClassifier on feature matrix and saves artifact."""
        from sklearn.ensemble import GradientBoostingClassifier
        import joblib

        model = GradientBoostingClassifier(n_estimators=100, learning_rate=0.05, max_depth=3, random_state=42)
        model.fit(X, y)
        self.model = model

        os.makedirs(ARTIFACT_DIR, exist_ok=True)
        joblib.dump(model, FUSION_MODEL_PATH)
        logger.info("Trained and persisted fusion model to %s", FUSION_MODEL_PATH)


fusion_model = StageTransitionFusionModel()
