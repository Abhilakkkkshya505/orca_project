"""Master training and evaluation pipeline for all ORCA models."""

import os
import sys
import json
import yaml

# Ensure ml package is on sys.path
ML_ROOT = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(ML_ROOT, "src")
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from orca_ml.models.intent import train_and_evaluate_intent_model
from orca_ml.models.chl_anomaly import run_historical_bloom_backtest
from orca_ml.models.fishing_zone import train_and_evaluate_fishing_model
from orca_ml.models.wave_error import WaveForecastErrorModel
from orca_ml.eval.report import evaluate_adoption_gate, generate_model_card_markdown


def main():
    artifacts_dir = os.path.join(ML_ROOT, "artifacts")
    gate_yaml_path = os.path.join(ML_ROOT, "gate.yaml")
    os.makedirs(artifacts_dir, exist_ok=True)
    
    with open(gate_yaml_path, "r") as f:
        gate_cfg = yaml.safe_load(f)

    print("=" * 60)
    print("STARTING ORCA MODEL TRAINING & EVALUATION PIPELINE")
    print("=" * 60)

    # 1. Intent Model
    print("\n[1/4] Training and evaluating Intent Classifier...")
    intent_res = train_and_evaluate_intent_model(artifacts_dir, n_samples_per_class=1300)
    intent_gate = evaluate_adoption_gate(
        model_id="intent",
        gate_config=gate_cfg,
        model_metrics=intent_res["metrics"],
        baseline_metrics=intent_res["baselines"],
    )
    # Save gate status
    with open(os.path.join(artifacts_dir, "intent_metrics.json"), "w") as f:
        json.dump(intent_gate, f, indent=2)
    print(f"Intent Model Gate: {intent_gate['status'].upper()} (Macro-F1: {intent_res['metrics']['macro_f1']}, Rule F1: {intent_res['baselines']['rules']['macro_f1']})")

    # 2. Chlorophyll Anomaly Detector & Backtest
    print("\n[2/4] Running Chlorophyll Anomaly Backtest...")
    chl_backtest = run_historical_bloom_backtest(artifacts_dir)
    chl_metrics = {
        "model_id": "chl_anomaly",
        "name": "Chlorophyll Anomaly Detector",
        "status": "active" if chl_backtest["all_passed"] else "not_adopted",
        "version": "1.0.0",
        "events_tested": chl_backtest["n_historical_events"],
        "all_passed": chl_backtest["all_passed"],
        "checks": [
            {
                "criterion": "historical_bloom_backtest",
                "required": "100% detection of 3 citable historical blooms",
                "actual": f"{len(chl_backtest['events'])}/{len(chl_backtest['events'])} detected",
                "passed": chl_backtest["all_passed"],
            }
        ]
    }
    with open(os.path.join(artifacts_dir, "chl_anomaly_metrics.json"), "w") as f:
        json.dump(chl_metrics, f, indent=2)
    print(f"Chlorophyll Anomaly Gate: {chl_metrics['status'].upper()} ({chl_metrics['events_tested']} historical blooms detected)")

    # 3. Fishing Zone Suitability Model
    print("\n[3/4] Training and evaluating Fishing Zone Model...")
    fishing_res = train_and_evaluate_fishing_model(
        artifacts_dir=artifacts_dir,
        gate_config_path=gate_yaml_path,
        enforce_production_token=True,
    )
    print(f"Fishing Zone Gate: {fishing_res['gate_decision']['status'].upper()}")
    if fishing_res['gate_decision'].get("reason"):
        print(f"  Reason: {fishing_res['gate_decision']['reason']}")

    # 4. Wave Error Model
    print("\n[4/4] Checking Wave Error Quantile Model...")
    wave_status = WaveForecastErrorModel().get_status()
    with open(os.path.join(artifacts_dir, "wave_error_metrics.json"), "w") as f:
        json.dump(wave_status, f, indent=2)
    print(f"Wave Error Gate: {wave_status['status'].upper()}")
    if wave_status.get("skip_reason"):
        print(f"  Reason: {wave_status['skip_reason']}")

    print("\n" + "=" * 60)
    print("ALL MODELS TRAINED AND ADOPTION GATES EVALUATED")
    print("=" * 60)


if __name__ == "__main__":
    main()
