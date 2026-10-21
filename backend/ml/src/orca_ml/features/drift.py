"""Feature drift monitoring using Population Stability Index (PSI).

PSI Formula:
PSI = sum( (Actual% - Expected%) * ln(Actual% / Expected%) )

Thresholds:
- PSI < 0.10: No significant drift (Stable)
- 0.10 <= PSI < 0.25: Moderate drift (Warning)
- PSI >= 0.25: Significant drift (Action Required)
"""

from typing import Dict, Any, List, Tuple
import numpy as np
import pandas as pd


def compute_feature_psi(
    expected: np.ndarray,
    actual: np.ndarray,
    n_bins: int = 10,
    epsilon: float = 1e-4,
) -> float:
    """Compute Population Stability Index between baseline (expected) and current (actual) data."""
    expected = np.asarray(expected, dtype=float)
    actual = np.asarray(actual, dtype=float)
    
    # Remove NaNs
    expected = expected[~np.isnan(expected)]
    actual = actual[~np.isnan(actual)]
    
    if len(expected) == 0 or len(actual) == 0:
        return 0.0

    # Determine quantiles on expected distribution
    percentiles = np.linspace(0, 100, n_bins + 1)
    bin_edges = np.percentile(expected, percentiles)
    bin_edges[0] -= 1e-5
    bin_edges[-1] += 1e-5
    
    # Handle degenerate bin edges if feature has low variance
    bin_edges = np.unique(bin_edges)
    if len(bin_edges) <= 2:
        return 0.0

    exp_counts, _ = np.histogram(expected, bins=bin_edges)
    act_counts, _ = np.histogram(actual, bins=bin_edges)

    exp_pct = (exp_counts / len(expected)) + epsilon
    act_pct = (act_counts / len(actual)) + epsilon

    # Normalize to sum to 1
    exp_pct /= exp_pct.sum()
    act_pct /= act_pct.sum()

    psi_val = np.sum((act_pct - exp_pct) * np.log(act_pct / exp_pct))
    return float(max(0.0, psi_val))


def evaluate_dataset_drift(
    baseline_df: pd.DataFrame,
    current_df: pd.DataFrame,
    feature_names: List[str],
) -> Dict[str, Any]:
    """Compute PSI for all numerical features and determine overall drift status."""
    feature_psi = {}
    drifted_features = []

    for feat in feature_names:
        if feat in baseline_df.columns and feat in current_df.columns:
            psi = compute_feature_psi(
                baseline_df[feat].values,
                current_df[feat].values,
            )
            feature_psi[feat] = round(psi, 4)
            if psi >= 0.25:
                drifted_features.append(feat)

    max_psi = max(feature_psi.values()) if feature_psi else 0.0
    status = "SIGNIFICANT_DRIFT" if max_psi >= 0.25 else "MODERATE_DRIFT" if max_psi >= 0.10 else "STABLE"

    return {
        "status": status,
        "max_psi": round(max_psi, 4),
        "drifted_features": drifted_features,
        "feature_psi": feature_psi,
    }
