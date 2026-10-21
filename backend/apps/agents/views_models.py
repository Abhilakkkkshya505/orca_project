"""Views for Model Registry and Model Cards."""

import os
import json
import yaml
from rest_framework.renderers import BaseRenderer, JSONRenderer, BrowsableAPIRenderer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from orca_ml.serve.loader import ModelRegistry, DEFAULT_ARTIFACTS_DIR, DEFAULT_GATE_PATH
from orca_ml.eval.report import generate_model_card_markdown


class MarkdownRenderer(BaseRenderer):
    """Renderer for GitHub-Flavored Markdown model cards."""
    media_type = "text/markdown"
    format = "markdown"
    charset = "utf-8"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        if isinstance(data, dict):
            return data.get("markdown", str(data)).encode("utf-8")
        elif isinstance(data, str):
            return data.encode("utf-8")
        return str(data).encode("utf-8")


class ModelListView(APIView):
    """GET /api/v1/models/
    
    Lists all models, their adoption gate status, and key performance metrics.
    """
    permission_classes = [AllowAny]
    renderer_classes = [JSONRenderer, BrowsableAPIRenderer]

    def get(self, request, *args, **kwargs):
        registry = ModelRegistry()
        models = registry.list_all_models()
        return Response(models, status=status.HTTP_200_OK)


class ModelCardView(APIView):
    """GET /api/v1/models/{id}/card/
    
    Returns structured model card JSON and rendered GitHub-flavored Markdown.
    """
    permission_classes = [AllowAny]
    renderer_classes = [JSONRenderer, MarkdownRenderer, BrowsableAPIRenderer]


    def get(self, request, model_id, *args, **kwargs):
        registry = ModelRegistry()
        status_info = registry.get_model_status(model_id)

        # Validate existence
        valid_ids = ["fishing_zone", "chl_anomaly", "intent", "wave_error"]
        if model_id not in valid_ids:
            return Response(
                {"detail": f"Model '{model_id}' not found. Valid models: {valid_ids}"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Load metrics file if exists
        metrics_file = os.path.join(registry.artifacts_dir, f"{model_id}_metrics.json")
        card_data = {
            "model_id": model_id,
            "name": status_info.get("name", model_id),
            "status": status_info.get("status", "unknown"),
            "version": status_info.get("version", "1.0.0"),
            "last_updated": "2026-10-21",
            "intended_use": (
                "Advisory fishing zone suitability assessment for coastal artisanal fisheries (SDG 14.b)."
                if model_id == "fishing_zone" else
                "Harmful algal bloom and chlorophyll anomaly detection in Indian coastal waters."
                if model_id == "chl_anomaly" else
                "Natural language query intent classification across maritime advisory tasks."
                if model_id == "intent" else
                "Significant wave height forecast residual uncertainty quantile estimation."
            ),
            "training_data_summary": (
                "Indian Ocean 0.25° oceanographic observations (SST, Chlorophyll, Bathymetry, AIS activity)."
                if model_id in ["fishing_zone", "chl_anomaly"] else
                "6,000+ synthetic maritime domain queries + 150 handcrafted vernacular/Hinglish edge cases."
                if model_id == "intent" else
                "Copernicus Climate Data Store wave reanalysis & coastal wave buoys (pending API key)."
            ),
            "checks": status_info.get("checks", []),
            "model_metrics": status_info.get("metrics", {}),
            "baseline_metrics": {},
            "limitations": (
                "- Not for navigation or commercial legal enforcement.\n"
                "- High risk weather conditions supersede fishing suitability advisories (Rule 1.1).\n"
                "- Cloud cover limits optical satellite observations."
            ),
        }

        if os.path.exists(metrics_file):
            try:
                with open(metrics_file, "r") as f:
                    raw_data = json.load(f)
                    if "baseline_metrics" in raw_data:
                        card_data["baseline_metrics"] = raw_data["baseline_metrics"]
                    if "checks" in raw_data:
                        card_data["checks"] = raw_data["checks"]
            except Exception:
                pass

        # Generate markdown representation
        markdown_content = generate_model_card_markdown(card_data)
        card_data["markdown"] = markdown_content

        # Return format based on query parameter
        req_format = request.query_params.get("format", "json").lower()
        if req_format == "markdown" or req_format == "md":
            from django.http import HttpResponse
            return HttpResponse(markdown_content, content_type="text/markdown; charset=utf-8")

        return Response(card_data, status=status.HTTP_200_OK)
