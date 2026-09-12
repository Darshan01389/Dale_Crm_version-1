"""
CRM Context Encoder for DalelQ Research Extension.
Transforms pre-conversation CRM state (lead, deal, activity history) into a compact numeric feature vector.
"""

from typing import Dict, Any, Optional
import numpy as np
from sqlalchemy.orm import Session

# Canonical stage ordering
STAGE_ORDER = ["new", "contacted", "discovery", "proposal", "negotiation", "won", "lost"]


class CRMContextEncoder:
    """Encodes CRM state into a fixed-length numeric vector."""

    def __init__(self):
        self.stage_map = {s: i for i, s in enumerate(STAGE_ORDER)}

    def encode(self, lead_data: Optional[Dict[str, Any]] = None) -> np.ndarray:
        """
        Returns a 12-dimensional numeric context vector:
        [0..6]: one-hot stage representation
        [7]: normalized lead score [0, 1]
        [8]: conversion probability [0, 1]
        [9]: sentiment compound [-1, 1]
        [10]: activity count normalized [0, 1]
        [11]: days since last contact normalized [0, 1]
        """
        if not lead_data:
            return np.zeros(12, dtype=np.float32)

        # 1. One-hot stage
        current_stage = str(lead_data.get("status", "new")).lower()
        stage_one_hot = np.zeros(len(STAGE_ORDER), dtype=np.float32)
        idx = self.stage_map.get(current_stage, 0)
        stage_one_hot[idx] = 1.0

        # 2. Continuous indicators
        lead_score = float(lead_data.get("ai_score") or lead_data.get("ml_lead_score") or 50.0) / 100.0
        conv_prob = float(lead_data.get("conversion_probability") or 50.0) / 100.0
        sentiment = float(lead_data.get("sentiment_compound") or 0.0)
        activity_count = min(1.0, float(lead_data.get("activity_count", 1)) / 20.0)
        days_idle = min(1.0, float(lead_data.get("days_since_last_contact", 0)) / 30.0)

        continuous = np.array([lead_score, conv_prob, sentiment, activity_count, days_idle], dtype=np.float32)
        return np.concatenate([stage_one_hot, continuous])


crm_context_encoder = CRMContextEncoder()
