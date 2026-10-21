"""Multi-agent orchestrator coordinating the 7-step reasoning loop for ORCA.

Part B: The Pipeline
Step 1: UNDERSTAND (user text -> Intent)
Step 2: RESOLVE (Intent.places -> Port or coordinates or clarification)
Step 3: GATHER (specialist agents read stored data)
Step 4: DECIDE (deterministic risk engine -> RiskAssessment)
Step 5: ENRICH (advisories, fishing zones)
Step 6: EXPLAIN (template or LLM -> validator -> final text)
Step 7: STREAM (SSE events: status, risk, map, token, done, error)
"""

from collections.abc import Generator
from datetime import UTC, datetime, timedelta
from typing import Any

import structlog
from django.utils import timezone

from apps.agents.agents.advisory import run_advisory_agent
from apps.agents.agents.fishing_zone import run_fishing_zone_agent
from apps.agents.agents.ocean_state import run_ocean_state_agent
from apps.agents.agents.satellite import run_satellite_agent
from apps.agents.agents.weather import run_weather_agent
from apps.agents.glossary import lookup_glossary_term
from apps.agents.llm import LLMClient
from apps.agents.schemas import Intent, QueryContext
from apps.agents.templates import (
    render_comparison_explanation,
    render_out_of_scope_reply,
)
from apps.agents.validators import build_allowed_numbers_from_assessment
from apps.ports.models import Port
from apps.risk.serializers import RiskAssessmentSerializer
from apps.risk.services import evaluate_and_record_risk

logger = structlog.get_logger(__name__)


class Orchestrator:
    """
    Coordinates multi-agent reasoning, deterministic safety evaluation,
    and SSE streaming delivery.
    """

    def __init__(self):
        self.llm_client = LLMClient()

    def process_query(
        self,
        user_query: str,
        user=None,
        location: dict | None = None,
        vessel_class: str | None = None,
        previous_intent: dict | None = None,
    ) -> Generator[dict[str, Any], None, None]:
        """
        Executes the reasoning loop and yields structured SSE event dictionaries.
        Events: status, risk, map, clarification, token, done, error
        """
        now = timezone.now()

        # Step 1: UNDERSTAND
        yield {
            "event": "status",
            "data": {"step": "extracting_intent", "label": "Analyzing query and intent..."},
        }

        context = {
            "location": location,
            "vessel_class": vessel_class,
            "previous_intent": previous_intent,
        }
        intent: Intent = self.llm_client.extract_intent(user_query, context=context)

        # Check for Out of Scope / Adversarial / Injections (Part C7)
        if intent.task == "other":
            yield {
                "event": "status",
                "data": {"step": "scoped_response", "label": "Evaluating maritime scope..."},
            }
            reply_text = render_out_of_scope_reply()
            for word in reply_text.split(" "):
                yield {"event": "token", "data": {"text": word + " "}}
            yield {
                "event": "done",
                "data": {"intent": intent.model_dump(mode="json"), "fallback": False},
            }
            return

        # Check for Glossary Explanation (Part C5)
        if intent.task == "explain_term":
            yield {
                "event": "status",
                "data": {"step": "querying_glossary", "label": "Consulting marine weather glossary..."},
            }
            entry = lookup_glossary_term(user_query)
            if entry:
                prose = f"**{entry['term']}**\n\n{entry['definition']}\n\n*Impact for mariners:* {entry['practical_impact']}\n\n*Source:* {entry['citation']}"
            else:
                prose = "Glossary entry not found. Please ask about significant wave height, swell, steepness, Beaufort scale, or ORCA safety levels."

            for word in prose.split(" "):
                yield {"event": "token", "data": {"text": word + " "}}
            yield {
                "event": "done",
                "data": {"intent": intent.model_dump(mode="json"), "fallback": False},
            }
            return

        # Check for Needs Clarification (Part F3)
        if intent.needs_clarification:
            yield {
                "event": "status",
                "data": {"step": "clarification_needed", "label": "Requesting location clarification..."},
            }
            clarification_dict = intent.needs_clarification.model_dump(mode="json")
            yield {"event": "clarification", "data": clarification_dict}

            msg_text = intent.needs_clarification.message or "Please choose from the available options above."
            for word in msg_text.split(" "):
                yield {"event": "token", "data": {"text": word + " "}}
            yield {
                "event": "done",
                "data": {"intent": intent.model_dump(mode="json"), "fallback": False},
            }
            return

        # Step 2: RESOLVE Places
        places = intent.places
        if not places:
            # No place could be resolved, ask user
            clarification_data = {
                "reason": "no_place",
                "options": [],
                "message": "Which coastal port or anchorage should I check? (e.g., Mumbai, Kochi, Chennai, Visakhapatnam, Paradip)",
            }
            yield {"event": "clarification", "data": clarification_data}
            yield {"event": "token", "data": {"text": clarification_data["message"]}}
            yield {
                "event": "done",
                "data": {"intent": intent.model_dump(mode="json"), "fallback": False},
            }
            return

        # Comparison Flow (Part F2)
        if intent.task == "compare" and len(places) >= 2:
            yield from self._handle_comparison_flow(places[:2], intent, user)
            return

        # Standard Single Location Flow
        primary_place = places[0]
        lat = primary_place.lat
        lon = primary_place.lon
        location_name = primary_place.text

        # Verify coordinates from database if slug present
        if primary_place.port_slug and (lat is None or lon is None):
            port = Port.objects.filter(slug=primary_place.port_slug).first()
            if port:
                lat, lon = port.lat, port.lon
                location_name = port.name

        if lat is None or lon is None:
            yield {"event": "error", "data": {"code": "unresolved_location", "message": f"Could not determine sea coordinates for {location_name}."}}
            return

        chosen_vessel = intent.vessel_class or vessel_class or "small_craft"
        valid_from = intent.window.start or now
        valid_to = intent.window.end or (now + timedelta(hours=12))

        ctx = QueryContext(
            lat=lat,
            lon=lon,
            location_name=location_name,
            valid_from=valid_from,
            valid_to=valid_to,
            vessel_class=chosen_vessel,
            user_units=intent.units or "metric",
        )

        # Step 3: GATHER (Specialist Agents)
        yield {
            "event": "status",
            "data": {"step": "checking_ocean", "label": f"Evaluating wave and swell data off {location_name}..."},
        }
        run_ocean_state_agent(ctx)

        yield {
            "event": "status",
            "data": {"step": "checking_weather", "label": f"Evaluating wind and rain forecast off {location_name}..."},
        }
        run_weather_agent(ctx)

        yield {
            "event": "status",
            "data": {"step": "checking_advisories", "label": "Checking official bulletins and weather warnings..."},
        }
        run_advisory_agent(ctx)

        yield {
            "event": "status",
            "data": {"step": "satellite_analysis", "label": "Analyzing satellite SST and thermal fronts..."},
        }
        sat_res = run_satellite_agent(ctx)
        run_fishing_zone_agent(ctx, sat_res)

        # Step 4: DECIDE (Deterministic Risk Engine)
        yield {
            "event": "status",
            "data": {"step": "computing_risk", "label": "Running deterministic safety rules..."},
        }
        assessment = evaluate_and_record_risk(
            lat=lat,
            lon=lon,
            valid_from=ctx.valid_from,
            valid_to=ctx.valid_to,
            vessel_class=ctx.vessel_class,
            user=user,
        )

        # Step 5: ENRICH & Yield Risk Card
        serialized_assessment = RiskAssessmentSerializer(assessment).data
        yield {"event": "risk", "data": serialized_assessment}

        # Step 6: Map Layer Features
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
                        "origin": getattr(zone, "origin", "orca_model"),
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
                        "properties": {"name": location_name},
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

        # Step 7: EXPLAIN & STREAM Tokens
        allowed_numbers = build_allowed_numbers_from_assessment(assessment)
        explanation_text, was_fallback = self.llm_client.generate_explanation(
            assessment=assessment,
            allowed_numbers=allowed_numbers,
            location_name=location_name,
            assumed_vessel=intent.assumed_vessel_class,
            units=intent.units or "metric",
        )

        words = explanation_text.split(" ")
        for i, word in enumerate(words):
            token_str = word + (" " if i < len(words) - 1 else "")
            yield {"event": "token", "data": {"text": token_str}}

        # Complete Stream
        yield {
            "event": "done",
            "data": {
                "assessment_id": str(assessment.public_id),
                "intent": intent.model_dump(mode="json"),
                "fallback": was_fallback,
                "usage": {"input_tokens": 120, "output_tokens": len(words)},
            },
        }

    def _handle_comparison_flow(self, places: list, intent: Intent, user) -> Generator[dict[str, Any], None, None]:
        """Runs side-by-side evaluation for two ports and yields comparison data."""
        p1, p2 = places[0], places[1]
        now = timezone.now()
        vessel = intent.vessel_class or "small_craft"

        yield {
            "event": "status",
            "data": {"step": "evaluating_ports", "label": f"Evaluating conditions for {p1.text} and {p2.text}..."},
        }

        a1 = evaluate_and_record_risk(lat=p1.lat, lon=p1.lon, valid_from=now, valid_to=now + timedelta(hours=12), vessel_class=vessel, user=user)
        a2 = evaluate_and_record_risk(lat=p2.lat, lon=p2.lon, valid_from=now, valid_to=now + timedelta(hours=12), vessel_class=vessel, user=user)

        # Emit both risk cards
        yield {"event": "risk", "data": RiskAssessmentSerializer(a1).data}
        yield {"event": "risk", "data": RiskAssessmentSerializer(a2).data}

        # Map showing both ports
        map_payload = {
            "focus": {"lat": (p1.lat + p2.lat) / 2.0, "lon": (p1.lon + p2.lon) / 2.0, "zoom": 6},
            "layers": [
                {
                    "id": "compare-ports",
                    "type": "geojson",
                    "data": {
                        "type": "FeatureCollection",
                        "features": [
                            {"type": "Feature", "geometry": {"type": "Point", "coordinates": [p1.lon, p1.lat]}, "properties": {"name": p1.text, "level": a1.level}},
                            {"type": "Feature", "geometry": {"type": "Point", "coordinates": [p2.lon, p2.lat]}, "properties": {"name": p2.text, "level": a2.level}},
                        ],
                    },
                }
            ],
        }
        yield {"event": "map", "data": map_payload}

        comp_text = render_comparison_explanation(
            port1_name=p1.text,
            assessment1=a1,
            port2_name=p2.text,
            assessment2=a2,
            units=intent.units or "metric",
        )

        words = comp_text.split(" ")
        for i, word in enumerate(words):
            token_str = word + (" " if i < len(words) - 1 else "")
            yield {"event": "token", "data": {"text": token_str}}

        yield {
            "event": "done",
            "data": {
                "assessment_id": str(a1.public_id),
                "intent": intent.model_dump(mode="json"),
                "fallback": False,
                "comparison": True,
            },
        }
