from datetime import timedelta

import structlog
from django.utils import timezone

from apps.agents.agents.advisory import run_advisory_agent
from apps.agents.agents.fishing_zone import run_fishing_zone_agent
from apps.agents.agents.ocean_state import run_ocean_state_agent
from apps.agents.agents.satellite import run_satellite_agent
from apps.agents.agents.weather import run_weather_agent
from apps.agents.llm import LLMClient
from apps.agents.schemas import QueryContext
from apps.risk.serializers import RiskAssessmentSerializer
from apps.risk.services import evaluate_and_record_risk

logger = structlog.get_logger(__name__)


class Orchestrator:
    """
    Coordinates multi-agent reasoning:
    Intent extraction -> Specialist agents -> Deterministic Risk Engine -> Validated Explanation.
    """

    def __init__(self):
        self.llm_client = LLMClient()

    def process_query(self, user_query: str, user=None, location: dict | None = None, vessel_class: str | None = None):
        """
        Executes the reasoning loop and yields structured event steps suitable for SSE streaming.
        Events: status, risk, map, token, done, error
        """
        now = timezone.now()

        # Step 1: Intent Extraction
        yield {"event": "status", "data": {"step": "extracting_intent", "label": "Analyzing query and location"}}
        intent = self.llm_client.extract_intent(user_query, default_location=location)

        lat = intent.lat or 9.97
        lon = intent.lon or 76.24
        chosen_vessel = vessel_class or intent.vessel_class or "small_craft"

        ctx = QueryContext(
            lat=lat,
            lon=lon,
            location_name=intent.location_name,
            valid_from=now,
            valid_to=now + timedelta(hours=12),
            vessel_class=chosen_vessel,
        )

        # Step 2: Specialist agents
        yield {"event": "status", "data": {"step": "checking_ocean", "label": "Evaluating wave and swell data"}}
        run_ocean_state_agent(ctx)

        yield {"event": "status", "data": {"step": "checking_weather", "label": "Evaluating wind and rain forecast"}}
        run_weather_agent(ctx)

        yield {"event": "status", "data": {"step": "checking_advisories", "label": "Checking official bulletins"}}
        run_advisory_agent(ctx)

        yield {
            "event": "status",
            "data": {"step": "satellite_analysis", "label": "Analyzing SST and chlorophyll fronts"},
        }
        sat_res = run_satellite_agent(ctx)
        run_fishing_zone_agent(ctx, sat_res)

        # Step 3: Deterministic Risk Engine Evaluation
        yield {"event": "status", "data": {"step": "computing_risk", "label": "Running deterministic safety rules"}}
        assessment = evaluate_and_record_risk(
            lat=lat,
            lon=lon,
            valid_from=ctx.valid_from,
            valid_to=ctx.valid_to,
            vessel_class=ctx.vessel_class,
            user=user,
        )

        # Yield Risk Card Payload
        serialized_assessment = RiskAssessmentSerializer(assessment).data
        yield {"event": "risk", "data": serialized_assessment}

        # Step 4: Map Layers
        fishing_zones_features = []
        for zone in assessment.fishing_zones.all():
            fishing_zones_features.append(
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [zone.lon, zone.lat]},
                    "properties": {
                        "id": str(zone.public_id),
                        "score": zone.score,
                        "risk_level": zone.risk_level,
                        "origin": zone.origin,
                    },
                }
            )

        map_payload = {
            "focus": {"lat": lat, "lon": lon, "zoom": 10},
            "layers": [
                {
                    "id": "query-location",
                    "type": "geojson",
                    "data": {
                        "type": "Feature",
                        "geometry": {"type": "Point", "coordinates": [lon, lat]},
                        "properties": {"name": intent.location_name or "Query Point"},
                    },
                },
                {
                    "id": "fishing-zones",
                    "type": "geojson",
                    "data": {
                        "type": "FeatureCollection",
                        "features": fishing_zones_features,
                    },
                },
            ],
        }
        yield {"event": "map", "data": map_payload}

        # Step 5: Validated Explanation
        # Assemble allowed numbers from factors to prevent hallucination
        allowed_numbers = {round(lat, 2), round(lon, 2)}
        for f in assessment.factors:
            v = f.get("value")
            if v is not None:
                allowed_numbers.add(float(v))
                allowed_numbers.add(round(float(v), 1))
            c = f.get("caution_at")
            if c is not None:
                allowed_numbers.add(float(c))
            u = f.get("unsafe_at")
            if u is not None:
                allowed_numbers.add(float(u))

        for z in assessment.fishing_zones.all():
            allowed_numbers.add(float(z.score))

        explanation_text, was_fallback = self.llm_client.generate_explanation(assessment, allowed_numbers)

        # Stream explanation tokens
        words = explanation_text.split(" ")
        for i, word in enumerate(words):
            token_str = word + (" " if i < len(words) - 1 else "")
            yield {"event": "token", "data": {"text": token_str}}

        # Done event
        yield {
            "event": "done",
            "data": {
                "assessment_id": str(assessment.public_id),
                "fallback": was_fallback,
                "usage": {"input_tokens": 150, "output_tokens": len(words)},
            },
        }
