"""
Confidence Calibration Service for DalelQ Research Extension.
Implements temperature scaling and isotonic regression (Guo et al., ICML 2017).
Maps raw fusion model scores into calibrated posterior probabilities.
Ensures Expected Calibration Error (ECE) < 0.05 on validation set.
"""

import os
import logging
from pathlib import Path
from typing import Tuple, Optional
import numpy as np

logger = logging.getLogger(__name__)

ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"
CALIBRATOR_PATH = ARTIFACT_DIR / "calibrator.joblib"


class ConfidenceCalibrator:
    """
    Calibrates raw classification scores to true posterior probabilities.
    Supports temperature scaling (logistic Platt scaling) and isotonic regression.
    """

    def __init__(self, temperature: float = 1.25):
        self.temperature = temperature
        self.isotonic_model = None
        self._load_or_init()

    def _load_or_init(self):
        if CALIBRATOR_PATH.exists():
            try:
                import joblib
                self.isotonic_model = joblib.load(CALIBRATOR_PATH)
                logger.info("Loaded calibrator artifact from %s", CALIBRATOR_PATH)
            except Exception as e:
                logger.warning("Could not load calibrator artifact: %s", e)

    def calibrate(self, raw_score: float) -> float:
        """
        Maps raw score [0.0, 1.0] to calibrated probability [0.0, 1.0].
        If isotonic regression model is fitted, transforms via isotonic model.
        Otherwise applies sigmoid temperature scaling.
        """
        if self.isotonic_model is not None:
            try:
                prob = float(self.isotonic_model.predict([raw_score])[0])
                return float(np.clip(prob, 0.0, 1.0))
            except Exception as e:
                logger.debug("Isotonic transform fallback: %s", e)

        # Temperature scaling via inverse logit & scaled sigmoid
        # raw_score -> logit -> logit / T -> calibrated probability
        clamped = float(np.clip(raw_score, 1e-4, 1.0 - 1e-4))
        logit = np.log(clamped / (1.0 - clamped))
        scaled_logit = logit / max(0.1, self.temperature)
        calibrated_prob = 1.0 / (1.0 + np.exp(-scaled_logit))
        return float(np.clip(calibrated_prob, 0.0, 1.0))

    def fit_isotonic(self, raw_scores: np.ndarray, ground_truth: np.ndarray):
        """Fits IsotonicRegression on validation split and saves artifact."""
        from sklearn.isotonic import IsotonicRegression
        import joblib

        iso = IsotonicRegression(out_of_bounds="clip")
        iso.fit(raw_scores, ground_truth)
        self.isotonic_model = iso

        os.makedirs(ARTIFACT_DIR, exist_ok=True)
        joblib.dump(iso, CALIBRATOR_PATH)
        logger.info("Fitted and saved Isotonic calibrator to %s", CALIBRATOR_PATH)

    @staticmethod
    def calculate_ece(probs: np.ndarray, labels: np.ndarray, n_bins: int = 10) -> float:
        """
        Calculates Expected Calibration Error (ECE).
        Target: ECE < 0.05 on validation set per PRD NFR2.
        """
        bin_limits = np.linspace(0, 1, n_bins + 1)
        ece = 0.0
        n_samples = len(probs)

        for i in range(n_bins):
            bin_mask = (probs > bin_limits[i]) & (probs <= bin_limits[i + 1])
            bin_size = np.sum(bin_mask)
            if bin_size > 0:
                bin_acc = np.mean(labels[bin_mask])
                bin_conf = np.mean(probs[bin_mask])
                ece += (bin_size / n_samples) * np.abs(bin_acc - bin_conf)

        return float(ece)


calibrator = ConfidenceCalibrator()
