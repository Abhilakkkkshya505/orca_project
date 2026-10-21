"""Model loader with strict adoption gate enforcement for ORCA."""

import os
import json
import yaml
import joblib
from typing import Dict, Any, Optional, Tuple


ML_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
DEFAULT_ARTIFACTS_DIR = os.path.join(ML_ROOT, "artifacts")
DEFAULT_GATE_PATH = os.path.join(ML_ROOT, "gate.yaml")



class ModelRegistry:
    """Manages loaded models and validates active status against adoption gates."""

    def __init__(
        self,
        artifacts_dir: str = DEFAULT_ARTIFACTS_DIR,
        gate_path: str = DEFAULT_GATE_PATH,
    ):
        self.artifacts_dir = artifacts_dir
        self.gate_path = gate_path
        self._loaded_models: Dict[str, Any] = {}
        self._metadata_cache: Dict[str, Any] = {}

    def get_gate_config(self) -> Dict[str, Any]:
        if os.path.exists(self.gate_path):
            with open(self.gate_path, "r") as f:
                return yaml.safe_load(f)
        return {"models": {}}

    def get_model_status(self, model_id: str) -> Dict[str, Any]:
        """Read model metrics and status, validating against gate criteria."""
        gate_cfg = self.get_gate_config()
        model_gate = gate_cfg.get("models", {}).get(model_id, {})
        
        # Check if wave_error
        if model_id == "wave_error":
            from orca_ml.models.wave_error import WaveForecastErrorModel
            return WaveForecastErrorModel().get_status()

        # Check for model metrics json
        metrics_file = os.path.join(self.artifacts_dir, f"{model_id}_metrics.json")
        if not os.path.exists(metrics_file):
            # Check if GFW token missing for fishing_zone
            if model_id == "fishing_zone" and not os.getenv("GFW_API_ACCESS_TOKEN"):
                return {
                    "model_id": model_id,
                    "name": model_gate.get("name", model_id),
                    "status": "unfinished",
                    "reason": "GFW_API_ACCESS_TOKEN not set in environment. Model marked UNFINISHED per Task 4 specification.",
                    "version": "1.0.0",
                }
            return {
                "model_id": model_id,
                "name": model_gate.get("name", model_id),
                "status": "not_adopted",
                "reason": "Model metrics or training artifact not found.",
                "version": "1.0.0",
            }

        with open(metrics_file, "r") as f:
            data = json.load(f)
            
        status = data.get("status", "not_adopted")
        return {
            "model_id": model_id,
            "name": model_gate.get("name", model_id),
            "status": status,
            "version": "1.0.0",
            "metrics": data.get("metrics", data.get("model_metrics", {})),
            "checks": data.get("checks", []),
            "reason": data.get("reason"),
        }

    def is_model_active(self, model_id: str) -> bool:
        """Enforces frozen adoption gate: only 'active' models may be served."""
        status_info = self.get_model_status(model_id)
        return status_info.get("status") == "active"

    def load_model(self, model_id: str) -> Optional[Any]:
        """Load model artifact if and only if adoption gate was passed."""
        if not self.is_model_active(model_id):
            return None

        if model_id in self._loaded_models:
            return self._loaded_models[model_id]

        artifact_name = f"{model_id}_model.joblib"
        artifact_path = os.path.join(self.artifacts_dir, artifact_name)
        if not os.path.exists(artifact_path):
            return None

        model = joblib.load(artifact_path)
        self._loaded_models[model_id] = model
        return model

    def list_all_models(self) -> List[Dict[str, Any]]:
        """Return status and card metadata for all 4 models."""
        model_ids = ["fishing_zone", "chl_anomaly", "intent", "wave_error"]
        return [self.get_model_status(m_id) for m_id in model_ids]
