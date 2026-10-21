"""Probability calibration for ORCA models.

Supports:
- Platt scaling (logistic regression on logits/scores)
- Isotonic regression
- Automatic selection of calibrator minimizing ECE on validation fold
"""

from typing import Union, Optional
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.isotonic import IsotonicRegression
from orca_ml.eval.metrics import compute_ece


class ModelCalibrator:
    """Wraps Platt scaling or Isotonic regression calibrators."""
    
    def __init__(self, method: str = "platt"):
        self.method = method.lower()
        self.model = None
        
    def fit(self, scores: np.ndarray, y_true: np.ndarray):
        scores = np.asarray(scores, dtype=float).clip(1e-6, 1.0 - 1e-6)
        y_true = np.asarray(y_true, dtype=int)
        
        if self.method == "platt":
            # Logistic regression on log-odds / logit
            logits = np.log(scores / (1.0 - scores)).reshape(-1, 1)
            clf = LogisticRegression(C=1.0, solver="lbfgs")
            clf.fit(logits, y_true)
            self.model = clf
        elif self.method == "isotonic":
            iso = IsotonicRegression(out_of_bounds="clip", y_min=0.0, y_max=1.0)
            iso.fit(scores, y_true)
            self.model = iso
        else:
            raise ValueError(f"Unknown calibration method: {self.method}")
        return self
        
    def predict_proba(self, scores: np.ndarray) -> np.ndarray:
        if self.model is None:
            return scores
            
        scores = np.asarray(scores, dtype=float).clip(1e-6, 1.0 - 1e-6)
        if self.method == "platt":
            logits = np.log(scores / (1.0 - scores)).reshape(-1, 1)
            probs = self.model.predict_proba(logits)[:, 1]
        elif self.method == "isotonic":
            probs = self.model.predict(scores)
        else:
            probs = scores
            
        return np.clip(probs, 0.0, 1.0)


def select_best_calibrator(val_scores: np.ndarray, val_true: np.ndarray) -> ModelCalibrator:
    """Evaluate raw vs Platt vs Isotonic on validation data, returning best calibration."""
    base_ece = compute_ece(val_true, val_scores)
    
    platt = ModelCalibrator(method="platt").fit(val_scores, val_true)
    platt_ece = compute_ece(val_true, platt.predict_proba(val_scores))
    
    iso = ModelCalibrator(method="isotonic").fit(val_scores, val_true)
    iso_ece = compute_ece(val_true, iso.predict_proba(val_scores))
    
    if platt_ece <= base_ece and platt_ece <= iso_ece:
        return platt
    elif iso_ece <= base_ece:
        return iso
    else:
        # Raw was already best
        raw = ModelCalibrator(method="platt")
        raw.model = None
        return raw
