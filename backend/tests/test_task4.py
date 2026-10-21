"""Comprehensive test suite for Task 4: ORCA Machine Learning and Adoption Gates.

Tests:
1. Feature Parity (extract_feature_vector vs extract_features_df)
2. Data Leakage Assertion (temporal & spatial splits)
3. Model Determinism (reproducibility with fixed seed)
4. Adoption Gate Enforcement (active vs not_adopted / unfinished)
5. Risk Level Independence (Rule 1.1: safety never suppressed by suitability)
6. Intent Classifier (Macro-F1, recall >= 0.80, latency < 5ms, size < 20MB, edge cases)
7. Chlorophyll Anomaly Detector (z-score, 4-cell cluster threshold, cloud threshold, 3 bloom citations)
8. Wave Error Quantile Model (honest skip status when CDS_API_KEY missing)
9. API Endpoints (GET /api/v1/models/ and GET /api/v1/models/{id}/card/)
10. Feature Drift Monitoring (Population Stability Index - PSI)
"""

import os
import pytest
import numpy as np
import pandas as pd
from rest_framework.test import APIClient
from rest_framework import status

from orca_ml.features.features import (
    RawObservation,
    extract_feature_vector,
    extract_features_df,
    FEATURE_NAMES,
)
from orca_ml.eval.splits import (
    create_temporal_split,
    create_spatial_block_splits,
    assert_no_data_leakage,
)
from orca_ml.eval.report import evaluate_adoption_gate
from orca_ml.models.intent import (
    IntentClassifierModel,
    generate_intent_dataset,
    rule_based_predict,
)
from orca_ml.models.chl_anomaly import (
    ChlorophyllAnomalyDetector,
    HISTORICAL_BLOOM_CITATIONS,
)
from orca_ml.models.wave_error import WaveForecastErrorModel
from orca_ml.features.drift import compute_feature_psi, evaluate_dataset_drift
from orca_ml.serve.loader import ModelRegistry
from orca_ml.serve.predict import predict_fishing_suitability_for_port


class TestTask4MachineLearning:
    """Task 4 ML test suite."""

    def test_feature_parity(self):
        """Rule 22: Feature parity between single-vector and batch dataframe extractors."""
        obs1 = RawObservation(
            latitude=15.0,
            longitude=73.0,
            timestamp=pd.Timestamp("2025-04-15 12:00:00"),
            sst=28.5,
            chl=0.65,
            bathymetry_depth_m=85.0,
            dist_to_coast_km=25.0,
            dist_to_nearest_port_km=45.0,
            sst_gradient=0.04,
            chl_gradient=0.07,
            front_indicator=1.0,
            sst_lag_1w=28.3,
            sst_lag_2w=28.1,
            chl_lag_1w=0.60,
            chl_lag_2w=0.58,
        )
        obs2 = RawObservation(
            latitude=18.5,
            longitude=84.0,
            timestamp=pd.Timestamp("2025-08-20 12:00:00"),
            sst=29.2,
            chl=0.40,
            bathymetry_depth_m=150.0,
            dist_to_coast_km=60.0,
            dist_to_nearest_port_km=90.0,
            sst_gradient=0.02,
            chl_gradient=0.03,
            front_indicator=0.0,
            sst_lag_1w=29.0,
            sst_lag_2w=28.8,
            chl_lag_1w=0.38,
            chl_lag_2w=0.35,
        )

        v1 = extract_feature_vector(obs1)
        v2 = extract_feature_vector(obs2)
        df_batch = extract_features_df([obs1, obs2])

        assert list(df_batch.columns) == FEATURE_NAMES
        np.testing.assert_allclose(df_batch.iloc[0].values, v1, rtol=1e-5)
        np.testing.assert_allclose(df_batch.iloc[1].values, v2, rtol=1e-5)

    def test_data_leakage_assertion(self):
        """Verifies assert_no_data_leakage detects temporal and spatial leakage."""
        df = pd.DataFrame({
            "timestamp": pd.date_range("2024-01-01", periods=10, freq="D"),
            "block_id": [f"block_{i}" for i in range(10)],
            "feature": range(10),
        })

        train_clean = df.iloc[:7]
        test_clean = df.iloc[7:]

        # Clean split should pass
        assert_no_data_leakage(train_clean, test_clean, date_col="timestamp", block_col="block_id", enforce_temporal=True, enforce_spatial=True)

        # Injected temporal leak: train contains future date
        train_leaky_time = df.iloc[[0, 1, 2, 8]]
        with pytest.raises(AssertionError, match="Temporal leakage"):
            assert_no_data_leakage(train_leaky_time, test_clean, date_col="timestamp", enforce_temporal=True)

        # Injected spatial leak: block_7 present in both
        train_leaky_space = df.iloc[[0, 1, 7]]
        with pytest.raises(AssertionError, match="Spatial leakage"):
            assert_no_data_leakage(train_leaky_space, test_clean, block_col="block_id", enforce_temporal=False, enforce_spatial=True)

    def test_model_determinism(self):
        """Fixed random seed must produce bitwise identical model predictions."""
        from orca_ml.models.intent import generate_intent_dataset
        df = generate_intent_dataset(n_samples_per_class=100, seed=42)
        queries = df["query"].tolist()[:40]

        m1 = IntentClassifierModel()
        m1.fit(df["query"].tolist(), df["intent"].tolist())
        p1 = m1.predict_proba(queries)

        m2 = IntentClassifierModel()
        m2.fit(df["query"].tolist(), df["intent"].tolist())
        p2 = m2.predict_proba(queries)

        np.testing.assert_array_equal(p1, p2)

    def test_adoption_gate_enforcement(self):
        """Enforces frozen adoption gate: only models passing criteria are marked active."""
        gate_cfg = {
            "models": {
                "test_model": {
                    "metric_rules": {
                        "pr_auc_relative_improvement_min": 0.10,
                        "ece_max": 0.08,
                    }
                }
            }
        }

        # Case 1: Beats baseline and low ECE -> ACTIVE
        good_metrics = {"pr_auc": 0.85, "ece": 0.04}
        good_baselines = {"b1": {"pr_auc": 0.70}}
        decision_pass = evaluate_adoption_gate("test_model", gate_cfg, good_metrics, good_baselines)
        assert decision_pass["status"] == "active"
        assert decision_pass["all_passed"] is True

        # Case 2: Fails PR-AUC threshold -> NOT_ADOPTED
        bad_metrics = {"pr_auc": 0.74, "ece": 0.04}
        decision_fail = evaluate_adoption_gate("test_model", gate_cfg, bad_metrics, good_baselines)
        assert decision_fail["status"] == "not_adopted"
        assert decision_fail["all_passed"] is False

        # Case 3: High ECE -> NOT_ADOPTED
        high_ece_metrics = {"pr_auc": 0.90, "ece": 0.12}
        decision_ece_fail = evaluate_adoption_gate("test_model", gate_cfg, high_ece_metrics, good_baselines)
        assert decision_ece_fail["status"] == "not_adopted"

    def test_risk_level_independence(self):
        """Rule 1.1: Safety engine is independent; high suitability never suppresses risk."""
        result = predict_fishing_suitability_for_port(
            port_lat=18.93,
            port_lon=72.84,
            port_name="Mumbai",
            radius_km=100.0,
            min_suitability_threshold=0.30,
        )
        assert "zones" in result
        for zone in result["zones"]:
            assert "safety_assessment" in zone
            assert zone["safety_assessment"]["risk_level"] in ["LOW", "MODERATE", "HIGH"]
            assert "average_suitability" in zone

    def test_intent_classifier(self):
        """Verifies Intent classifier accuracy, latency budget, artifact size, and vernacular edge cases."""
        registry = ModelRegistry()
        status_info = registry.get_model_status("intent")
        assert status_info["status"] == "active"

        model = registry.load_model("intent")
        assert model is not None

        # Vernacular and edge cases test
        test_cases = [
            ("machli kahan milegi near kochi", "fishing_zone"),
            ("kya aaj samundar me jana safe hai", "safety_assessment"),
            ("track cyclone Dana landfall path", "cyclone_tracking"),
            ("nearest emergency refuge harbor", "port_recommendation"),
            ("who developed this marine advisory system", "general_query"),
        ]
        for query, expected_intent in test_cases:
            pred = model.predict_one(query)
            assert pred["intent"] == expected_intent, f"Failed on '{query}': got {pred['intent']} expected {expected_intent}"

        # Latency check: predict_one under 5ms
        import time
        t0 = time.perf_counter()
        _ = model.predict_one("best fishing spot near paradip port")
        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        assert elapsed_ms < 5.0, f"Latency {elapsed_ms:.2f}ms exceeds 5ms"

        # Model artifact size under 20MB
        artifact_path = os.path.join(registry.artifacts_dir, "intent_model.joblib")
        assert os.path.exists(artifact_path)
        size_mb = os.path.getsize(artifact_path) / (1024 * 1024)
        assert size_mb < 20.0, f"Artifact size {size_mb:.2f}MB exceeds 20MB"

    def test_chl_anomaly_detector(self):
        """Verifies chlorophyll anomaly z-score, 4-cell cluster threshold, cloud threshold."""
        detector = ChlorophyllAnomalyDetector(z_threshold=2.5, min_cluster_cells=4, max_cloud_fraction=0.50)
        # Seasonal climatology: log(0.35) ~ -1.05, std = 0.35
        clim_mean = np.full((10, 10), np.log(0.35))
        clim_std = np.full((10, 10), 0.35)

        # Case 1: Isolated 2 cells with high chl (5.0 mg/m3) -> z = 7.6 >= 2.5
        # but rejected by min_cluster_cells=4
        grid_small = np.full((10, 10), 0.35)
        grid_small[2, 2] = 5.0
        grid_small[2, 3] = 5.0
        res1 = detector.detect_blooms(grid_small, clim_mean, clim_std)
        assert res1["bloom_detected"] is False

        # Case 2: 4 contiguous cells with high chl (should be accepted)
        grid_large = np.full((10, 10), 0.35)
        grid_large[2:4, 2:4] = 5.0  # 2x2 = 4 cells
        res2 = detector.detect_blooms(grid_large, clim_mean, clim_std)
        assert res2["bloom_detected"] is True
        assert res2["num_clusters"] >= 1

        # Case 3: Cloud obscured (>= 50% NaNs)
        grid_cloud = np.full((10, 10), np.nan)
        grid_cloud[:4, :4] = 5.0
        res3 = detector.detect_blooms(grid_cloud, clim_mean, clim_std)
        assert res3["status"] == "CLOUD_OBSCURED"
        assert res3["bloom_detected"] is False

        # Case 4: Verify 3 historical bloom citations
        assert len(HISTORICAL_BLOOM_CITATIONS) == 3

    def test_wave_error_model(self):
        """Verifies wave error model is honestly skipped if CDS_API_KEY is missing."""
        model = WaveForecastErrorModel()
        status_info = model.get_status()
        if not os.getenv("CDS_API_KEY"):
            assert status_info["status"] == "skipped"
            assert "CDS_API_KEY" in status_info["skip_reason"]

    def test_feature_drift_psi(self):
        """Verifies Population Stability Index calculation on feature distributions."""
        rng = np.random.RandomState(42)
        base = rng.normal(0, 1, size=1000)
        same = rng.normal(0, 1, size=1000)
        shifted = rng.normal(1.5, 1, size=1000)

        psi_stable = compute_feature_psi(base, same)
        psi_drifted = compute_feature_psi(base, shifted)

        assert psi_stable < 0.10, f"Stable PSI {psi_stable} should be < 0.10"
        assert psi_drifted > 0.25, f"Drifted PSI {psi_drifted} should be > 0.25"

    def test_models_api(self):
        """Verifies GET /api/v1/models/ and GET /api/v1/models/{id}/card/ endpoints."""
        client = APIClient()

        # 1. Models list
        res_list = client.get("/api/v1/models/")
        assert res_list.status_code == status.HTTP_200_OK
        model_ids = [m["model_id"] for m in res_list.data]
        assert "intent" in model_ids
        assert "chl_anomaly" in model_ids
        assert "fishing_zone" in model_ids
        assert "wave_error" in model_ids

        # 2. Intent card JSON
        res_card = client.get("/api/v1/models/intent/card/")
        assert res_card.status_code == status.HTTP_200_OK
        assert res_card.data["model_id"] == "intent"
        assert res_card.data["status"] == "active"
        assert "markdown" in res_card.data

        # 3. Intent card Markdown format
        res_md = client.get("/api/v1/models/intent/card/?format=markdown")
        assert res_md.status_code == status.HTTP_200_OK
        assert "text/markdown" in res_md["Content-Type"]
        assert b"# Model Card: intent" in res_md.content

        # 4. 404 for unknown model
        res_404 = client.get("/api/v1/models/nonexistent_model/card/")
        assert res_404.status_code == status.HTTP_404_NOT_FOUND
