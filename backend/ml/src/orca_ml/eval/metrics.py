"""Evaluation metrics for ORCA ML models.

Includes:
- ROC-AUC, PR-AUC (Average Precision)
- Brier score
- Expected Calibration Error (ECE)
- Top-10% and Top-20% hit rate within 100km of ports
- Block bootstrap 95% confidence intervals
"""

from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score, average_precision_score, brier_score_loss


def compute_ece(y_true: np.ndarray, y_prob: np.ndarray, n_bins: int = 10) -> float:
    """Calculate Expected Calibration Error (ECE) with equal-width bins."""
    y_true = np.asarray(y_true, dtype=float)
    y_prob = np.asarray(y_prob, dtype=float)
    
    bin_limits = np.linspace(0.0, 1.0, n_bins + 1)
    ece = 0.0
    n = len(y_true)
    if n == 0:
        return 0.0
        
    for i in range(n_bins):
        low, high = bin_limits[i], bin_limits[i + 1]
        if i == n_bins - 1:
            mask = (y_prob >= low) & (y_prob <= high)
        else:
            mask = (y_prob >= low) & (y_prob < high)
            
        bin_count = np.sum(mask)
        if bin_count > 0:
            bin_acc = np.mean(y_true[mask])
            bin_conf = np.mean(y_prob[mask])
            ece += (bin_count / n) * abs(bin_acc - bin_conf)
            
    return float(ece)


def compute_top_k_hit_rate(y_true: np.ndarray, y_prob: np.ndarray, top_k_pct: float = 0.20) -> float:
    """Compute hit rate (precision) in the top k fraction of predictions."""
    y_true = np.asarray(y_true)
    y_prob = np.asarray(y_prob)
    n = len(y_true)
    if n == 0:
        return 0.0
        
    k = max(1, int(n * top_k_pct))
    top_indices = np.argsort(y_prob)[::-1][:k]
    hit_rate = np.mean(y_true[top_indices])
    return float(hit_rate)


def compute_classification_metrics(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    dist_to_port: Optional[np.ndarray] = None,
    max_port_dist_km: float = 100.0,
) -> Dict[str, float]:
    """Compute standard ORCA classification metric suite."""
    y_true = np.asarray(y_true)
    y_prob = np.asarray(y_prob)
    
    metrics: Dict[str, float] = {}
    
    # Handle single class edge case
    if len(np.unique(y_true)) > 1:
        metrics["roc_auc"] = float(roc_auc_score(y_true, y_prob))
        metrics["pr_auc"] = float(average_precision_score(y_true, y_prob))
    else:
        metrics["roc_auc"] = 0.5
        metrics["pr_auc"] = float(np.mean(y_true))
        
    metrics["brier_score"] = float(brier_score_loss(y_true, y_prob))
    metrics["ece"] = compute_ece(y_true, y_prob, n_bins=10)
    metrics["top_10_hit_rate"] = compute_top_k_hit_rate(y_true, y_prob, top_k_pct=0.10)
    metrics["top_20_hit_rate"] = compute_top_k_hit_rate(y_true, y_prob, top_k_pct=0.20)
    
    # Port-filtered hit rate (within 100km of ports)
    if dist_to_port is not None:
        mask = dist_to_port <= max_port_dist_km
        if np.sum(mask) >= 10:
            metrics["port100km_top_20_hit_rate"] = compute_top_k_hit_rate(
                y_true[mask], y_prob[mask], top_k_pct=0.20
            )
            metrics["port100km_pr_auc"] = float(
                average_precision_score(y_true[mask], y_prob[mask])
                if len(np.unique(y_true[mask])) > 1 else np.mean(y_true[mask])
            )
        else:
            metrics["port100km_top_20_hit_rate"] = metrics["top_20_hit_rate"]
            metrics["port100km_pr_auc"] = metrics["pr_auc"]
            
    return metrics


def block_bootstrap_confidence_intervals(
    df: pd.DataFrame,
    y_true_col: str,
    y_prob_col: str,
    block_col: str = "block_id",
    n_bootstraps: int = 200,
    random_state: int = 42,
) -> Dict[str, Tuple[float, float]]:
    """Compute 95% confidence intervals via spatial block bootstrapping.
    
    Resamples 5x5 degree spatial blocks with replacement to account for spatial autocorrelation.
    """
    unique_blocks = df[block_col].unique()
    n_blocks = len(unique_blocks)
    if n_blocks < 2:
        return {}
        
    rng = np.random.RandomState(random_state)
    boot_metrics: Dict[str, List[float]] = {
        "pr_auc": [],
        "roc_auc": [],
        "top_20_hit_rate": [],
        "ece": []
    }
    
    # Group row indices by block for fast sampling
    block_to_indices = df.groupby(block_col).indices
    
    for _ in range(n_bootstraps):
        sampled_blocks = rng.choice(unique_blocks, size=n_blocks, replace=True)
        sampled_indices = np.concatenate([block_to_indices[b] for b in sampled_blocks])
        
        sample_true = df[y_true_col].values[sampled_indices]
        sample_prob = df[y_prob_col].values[sampled_indices]
        
        if len(np.unique(sample_true)) < 2:
            continue
            
        boot_metrics["pr_auc"].append(float(average_precision_score(sample_true, sample_prob)))
        boot_metrics["roc_auc"].append(float(roc_auc_score(sample_true, sample_prob)))
        boot_metrics["top_20_hit_rate"].append(compute_top_k_hit_rate(sample_true, sample_prob, 0.20))
        boot_metrics["ece"].append(compute_ece(sample_true, sample_prob))
        
    cis: Dict[str, Tuple[float, float]] = {}
    for metric_name, values in boot_metrics.items():
        if len(values) >= 10:
            low = float(np.percentile(values, 2.5))
            high = float(np.percentile(values, 97.5))
            cis[metric_name] = (round(low, 4), round(high, 4))
        else:
            cis[metric_name] = (0.0, 1.0)
            
    return cis
