"""Fishing zone suitability model for ORCA.

Candidate model: HistGradientBoostingClassifier.
Inputs: Canonical 15-dimensional feature vector from orca_ml.features.
Evaluation: Evaluated against B1 (climatology), B2 (heuristic rules), B3 (distance-only).
Calibration: Platt scaling / Isotonic regression.

Adoption Gate:
- PR-AUC delta vs best baseline >= +0.10
- Top-20% hit rate delta vs B2 >= +0.05
- ECE <= 0.08

Honest Status:
- Marked 'unfinished' in production if GFW_API_ACCESS_TOKEN is missing.
- Provides reproducible fixture dataset generator for complete offline testing.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, Optional, List
from sklearn.ensemble import HistGradientBoostingClassifier

from orca_ml.features.features import FEATURE_NAMES
from orca_ml.eval.splits import (
    create_temporal_split,
    create_spatial_block_splits,
    assert_no_data_leakage,
)
from orca_ml.eval.baselines import (
    ClimatologyBaseline,
    HeuristicRuleBaseline,
    DistanceOnlyBaseline,
)
from orca_ml.eval.metrics import (
    compute_classification_metrics,
    block_bootstrap_confidence_intervals,
)
from orca_ml.eval.calibration import select_best_calibrator
from orca_ml.eval.report import evaluate_adoption_gate


def generate_fishing_fixture_dataset(
    n_samples: int = 12000,
    seed: int = 42,
) -> pd.DataFrame:
    """Generate a realistic, deterministic fixture dataset for testing & verification.
    
    Generates oceanographic observations across the Indian Ocean (lat 8-22°N, lon 68-89°E)
    over a 2-year temporal span with 5x5° spatial blocks.
    Target label is based on oceanographic physics (SST 26-29, high chl front, continental shelf).
    """
    rng = np.random.RandomState(seed)
    
    # 1. Dates spanning 2024-01-01 to 2025-12-31
    base_date = pd.Timestamp("2024-01-01")
    days = rng.randint(0, 730, size=n_samples)
    dates = [base_date + pd.Timedelta(days=int(d)) for d in days]
    
    # 2. Coordinates
    lats = rng.uniform(8.0, 22.0, size=n_samples)
    lons = rng.uniform(68.0, 89.0, size=n_samples)
    
    # 5x5 degree block IDs
    from orca_ml.features.grid import get_cell_block
    block_ids = [get_cell_block(lat, lon, block_size_deg=5.0) for lat, lon in zip(lats, lons)]
    
    # 3. Oceanographic features
    months = np.array([d.month for d in dates])
    month_sin = np.sin(2.0 * np.pi * months / 12.0)
    month_cos = np.cos(2.0 * np.pi * months / 12.0)
    
    # SST: 24 to 32 °C with seasonal cycle
    sst = 28.0 + 2.0 * month_sin + rng.normal(0, 1.0, size=n_samples)
    
    # Chlorophyll: log-normal distribution
    log_chl = rng.normal(-0.8, 0.6, size=n_samples)
    chl = np.exp(log_chl)
    
    # Gradients
    sst_gradient = np.abs(rng.normal(0.04, 0.03, size=n_samples))
    chl_gradient = np.abs(rng.normal(0.06, 0.05, size=n_samples))
    front_indicator = ((sst_gradient > 0.06) & (chl_gradient > 0.08)).astype(float)
    
    # Geography
    dist_to_coast_km = rng.exponential(scale=60.0, size=n_samples) + 5.0
    dist_to_nearest_port_km = dist_to_coast_km + rng.exponential(scale=40.0, size=n_samples)
    
    # Depth: continental shelf (50-200m) near coast, deeper offshore
    shelf_factor = np.exp(-dist_to_coast_km / 70.0)
    bathymetry_depth_m = 80.0 * shelf_factor + (1.0 - shelf_factor) * rng.uniform(500, 3500, size=n_samples)
    
    # Lags
    sst_lag_1w = sst + rng.normal(0, 0.3, size=n_samples)
    sst_lag_2w = sst_lag_1w + rng.normal(0, 0.4, size=n_samples)
    chl_lag_1w = chl * np.exp(rng.normal(0, 0.15, size=n_samples))
    chl_lag_2w = chl_lag_1w * np.exp(rng.normal(0, 0.2, size=n_samples))
    
    # 4. Target Fishing Label (ground truth physics + non-linear interaction + noise)
    # Favorable: SST between 26 and 29.5, high chl, front active, shelf depth, reasonable port distance
    p_sst = np.exp(-((sst - 28.0) ** 2) / (2 * 1.5 ** 2))
    p_chl = np.clip(chl / 1.5, 0.05, 1.0)
    p_depth = np.exp(-((np.log(np.maximum(10.0, bathymetry_depth_m)) - np.log(120.0)) ** 2) / 1.2)
    p_dist = np.exp(-dist_to_nearest_port_km / 120.0)
    
    logit = (
        2.5 * p_sst
        + 2.2 * p_chl
        + 1.8 * p_depth
        + 1.5 * front_indicator
        + 1.2 * p_dist
        - 3.8
        + rng.normal(0, 0.4, size=n_samples)
    )
    prob_true = 1.0 / (1.0 + np.exp(-logit))
    labels = (rng.rand(n_samples) < prob_true).astype(int)
    
    df = pd.DataFrame({
        "timestamp": dates,
        "month": months,
        "latitude": lats,
        "longitude": lons,
        "block_id": block_ids,
        "sst": sst,
        "chl": chl,
        "log_chl": log_chl,
        "sst_gradient": sst_gradient,
        "chl_gradient": chl_gradient,
        "front_indicator": front_indicator,
        "bathymetry_depth_m": bathymetry_depth_m,
        "dist_to_coast_km": dist_to_coast_km,
        "dist_to_nearest_port_km": dist_to_nearest_port_km,
        "month_sin": month_sin,
        "month_cos": month_cos,
        "sst_lag_1w": sst_lag_1w,
        "sst_lag_2w": sst_lag_2w,
        "chl_lag_1w": chl_lag_1w,
        "chl_lag_2w": chl_lag_2w,
        "label": labels,
    })
    return df


class FishingSuitabilityPipeline:
    """End-to-end fishing suitability model with calibration and feature schema."""

    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        self.feature_names = FEATURE_NAMES
        self.model = HistGradientBoostingClassifier(
            learning_rate=0.06,
            max_iter=150,
            max_leaf_nodes=31,
            min_samples_leaf=30,
            class_weight="balanced",
            early_stopping=True,
            n_iter_no_change=10,
            random_state=random_state,
        )
        self.calibrator = None

    def fit(self, X_train: pd.DataFrame, y_train: np.ndarray, X_val: pd.DataFrame, y_val: np.ndarray):
        X_tr = X_train[self.feature_names].values
        self.model.fit(X_tr, y_train)
        
        # Calibrate on validation split
        val_raw_probs = self.model.predict_proba(X_val[self.feature_names].values)[:, 1]
        self.calibrator = select_best_calibrator(val_raw_probs, y_val)
        return self

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        raw_probs = self.model.predict_proba(X[self.feature_names].values)[:, 1]
        if self.calibrator is not None:
            return self.calibrator.predict_proba(raw_probs)
        return raw_probs


def train_and_evaluate_fishing_model(
    artifacts_dir: str,
    gate_config_path: str,
    df: Optional[pd.DataFrame] = None,
    enforce_production_token: bool = True,
) -> Dict[str, Any]:
    """Train, calibrate, evaluate against baselines, and test adoption gate."""
    os.makedirs(artifacts_dir, exist_ok=True)
    
    # Check live GFW token
    has_token = bool(os.getenv("GFW_API_ACCESS_TOKEN"))
    
    if df is None:
        df = generate_fishing_fixture_dataset(n_samples=12000, seed=42)
        
    # 1. Temporal split (last 6 months held out)
    train_df, test_df = create_temporal_split(df, date_col="timestamp", test_months=6)
    
    # Assert no temporal leakage
    assert_no_data_leakage(train_df, test_df, date_col="timestamp", enforce_temporal=True)
    
    # Further split train into train/val using spatial blocks
    spatial_splits = create_spatial_block_splits(train_df, block_col="block_id", n_splits=5)
    tr_idx, val_idx = spatial_splits[0]
    
    fold_train = train_df.iloc[tr_idx].copy()
    fold_val = train_df.iloc[val_idx].copy()
    
    # Assert no spatial leakage between fold train and fold val
    assert_no_data_leakage(fold_train, fold_val, block_col="block_id", enforce_spatial=True, enforce_temporal=False)
    
    # 2. Fit Model
    pipeline = FishingSuitabilityPipeline(random_state=42)
    pipeline.fit(
        fold_train,
        fold_train["label"].values,
        fold_val,
        fold_val["label"].values,
    )
    
    # 3. Predict on Held-Out Test Set
    test_probs = pipeline.predict_proba(test_df)
    test_labels = test_df["label"].values
    test_port_dist = test_df["dist_to_nearest_port_km"].values
    
    model_metrics = compute_classification_metrics(
        test_labels, test_probs, dist_to_port=test_port_dist, max_port_dist_km=100.0
    )
    
    # 4. Evaluate Baselines on identical held-out test set
    # B1: Climatology
    b1 = ClimatologyBaseline().fit(train_df, target_col="label")
    b1_probs = b1.predict_proba(test_df)
    b1_metrics = compute_classification_metrics(test_labels, b1_probs, dist_to_port=test_port_dist)
    
    # B2: Heuristic Rules
    b2 = HeuristicRuleBaseline()
    b2_probs = b2.predict_proba(test_df)
    b2_metrics = compute_classification_metrics(test_labels, b2_probs, dist_to_port=test_port_dist)
    
    # B3: Distance-only
    b3 = DistanceOnlyBaseline()
    b3_probs = b3.predict_proba(test_df)
    b3_metrics = compute_classification_metrics(test_labels, b3_probs, dist_to_port=test_port_dist)
    
    baseline_metrics = {
        "b1_climatology": b1_metrics,
        "b2_heuristic": b2_metrics,
        "b3_distance": b3_metrics,
    }
    
    # 5. Block bootstrap 95% CIs
    test_df_eval = test_df.copy()
    test_df_eval["pred_prob"] = test_probs
    cis = block_bootstrap_confidence_intervals(
        test_df_eval, y_true_col="label", y_prob_col="pred_prob", block_col="block_id"
    )
    model_metrics["bootstrap_95ci"] = cis
    
    # 6. Read gate config and evaluate
    import yaml
    with open(gate_config_path, "r") as f:
        gate_cfg = yaml.safe_load(f)
        
    gate_decision = evaluate_adoption_gate(
        model_id="fishing_zone",
        gate_config=gate_cfg,
        model_metrics=model_metrics,
        baseline_metrics=baseline_metrics,
    )
    
    # Honest status determination:
    # If GFW token is not set and enforce_production_token is True: status is unfinished per spec
    if enforce_production_token and not has_token:
        gate_decision["status"] = "unfinished"
        gate_decision["reason"] = "GFW_API_ACCESS_TOKEN is not set in environment. Model marked UNFINISHED per Task 4 specification."
        
    # Save model artifact
    model_path = os.path.join(artifacts_dir, "fishing_zone_model.joblib")
    joblib.dump(pipeline, model_path, compress=3)
    
    metrics_path = os.path.join(artifacts_dir, "fishing_zone_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(gate_decision, f, indent=2)
        
    return {
        "pipeline": pipeline,
        "gate_decision": gate_decision,
        "model_path": model_path,
        "metrics_path": metrics_path,
    }
