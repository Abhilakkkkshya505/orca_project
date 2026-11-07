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

        # Check for Out of Scope / General Chat / Inquiries
        if intent.task == "other":
            yield {
                "event": "status",
                "data": {"step": "assistant_reasoning", "label": "Consulting ORCA AI Assistant (powered by Groq)..."},
            }
            reply_text = self.llm_client.generate_chat_reply(user_query, context=context)
            if not reply_text:
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
                groq_reply = self.llm_client.generate_chat_reply(user_query, context=context)
                if groq_reply:
                    prose = groq_reply
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
        resolution_options = []

        # Verify coordinates from database if slug or place text present
        if lat is None or lon is None:
            if primary_place.port_slug:
                slug_candidate = primary_place.port_slug.strip().lower()
                port = (
                    Port.objects.filter(slug=slug_candidate).first()
                    or Port.objects.filter(slug__istartswith=slug_candidate).first()
                )
                if port:
                    lat, lon = port.lat, port.lon
                    location_name = port.name

            if (lat is None or lon is None) and primary_place.text:
                import re
                from apps.agents.parser import resolve_port_from_db
                port, _, opts = resolve_port_from_db(primary_place.text)
                if port:
                    lat, lon = port.lat, port.lon
                    location_name = port.name
                    primary_place.port_slug = port.slug
                elif opts:
                    resolution_options = opts
                    place_words = [w.lower() for w in re.findall(r"\b[A-Za-z]{3,}\b", primary_place.text)]
                    for o in opts:
                        o_words = [w.lower() for w in re.findall(r"\b[A-Za-z]{3,}\b", o.name)]
                        if any(w in o_words for w in place_words):
                            matched = Port.objects.filter(slug=o.slug).first()
                            if matched:
                                lat, lon = matched.lat, matched.lon
                                location_name = matched.name
                                primary_place.port_slug = matched.slug
                                break

            # Word-by-word DB fallback for place text
            if (lat is None or lon is None) and primary_place.text:
                import re
                words = [w for w in re.findall(r"\b[A-Za-z]{4,}\b", primary_place.text) if w.lower() not in ("fort", "port", "near", "cape", "harbour", "beach", "today", "tomorrow")]
                for w in words:
                    candidate = Port.objects.filter(name__icontains=w).first()
                    if candidate:
                        lat, lon = candidate.lat, candidate.lon
                        location_name = candidate.name
                        primary_place.port_slug = candidate.slug
                        break

        # Fallback to query context location if provided
        if (lat is None or lon is None) and location and isinstance(location, dict):
            if "lat" in location and "lon" in location:
                try:
                    lat = float(location["lat"])
                    lon = float(location["lon"])
                except (ValueError, TypeError):
                    pass

        # Fallback to known Indian coastal coordinates if DB unseeded
        if lat is None or lon is None:
            KNOWN_COORDINATES = {
                "kochi": (9.967, 76.242, "Kochi (Cochin)"),
                "cochin": (9.967, 76.242, "Kochi (Cochin)"),
                "mumbai": (18.940, 72.840, "Mumbai (Bombay)"),
                "chennai": (13.084, 80.292, "Chennai (Madras)"),
                "visakhapatnam": (17.686, 83.218, "Visakhapatnam (Vizag)"),
                "paradip": (20.316, 86.611, "Paradip"),
                "kandla": (23.003, 70.219, "Kandla"),
                "kolkata": (22.572, 88.363, "Kolkata (Calcutta)"),
                "mangalore": (12.914, 74.856, "New Mangalore"),
                "tuticorin": (8.764, 78.134, "V.O. Chidambaranar (Tuticorin)"),
                "mormugao": (15.416, 73.800, "Mormugao (Goa)"),
                "goa": (15.416, 73.800, "Mormugao (Goa)"),
            }
            from apps.ports.normalisation import to_ascii
            from apps.agents.parser import COMMON_TRANSLITERATIONS
            place_raw = to_ascii(primary_place.text).lower()
            stem = COMMON_TRANSLITERATIONS.get(place_raw, place_raw)
            if stem in KNOWN_COORDINATES:
                lat, lon, def_name = KNOWN_COORDINATES[stem]
                location_name = def_name
            else:
                for k, (klat, klon, kname) in KNOWN_COORDINATES.items():
                    if k in place_raw or k in stem:
                        lat, lon = klat, klon
                        location_name = kname
                        break

        if lat is None or lon is None:
            if resolution_options:
                clarification_data = {
                    "reason": "ambiguous_place",
                    "options": [o.model_dump() if hasattr(o, "model_dump") else o.__dict__ for o in resolution_options],
                    "message": f"Multiple coastal locations match '{primary_place.text}'. Which one did you mean?",
                }
                yield {"event": "clarification", "data": clarification_data}
                yield {"event": "token", "data": {"text": clarification_data["message"]}}
                yield {
                    "event": "done",
                    "data": {"intent": intent.model_dump(mode="json"), "fallback": False},
                }
                return

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

    def _resolve_place_coords(self, place) -> tuple[float | None, float | None, str]:
        """Resolves sea coordinates for PlaceRef via slug, database lookup, or known Indian port stems."""
        lat = getattr(place, "lat", None)
        lon = getattr(place, "lon", None)
        name = getattr(place, "text", "") or ""

        # 1. By slug
        slug = getattr(place, "port_slug", None)
        if (lat is None or lon is None) and slug:
            p = Port.objects.filter(slug=slug.strip().lower()).first()
            if p:
                return float(p.lat), float(p.lon), p.name

        # 2. By text DB lookup
        if (lat is None or lon is None) and name:
            from apps.agents.parser import resolve_port_from_db
            p, _, _ = resolve_port_from_db(name)
            if p:
                return float(p.lat), float(p.lon), p.name

        # 3. Known Indian ports fallback
        KNOWN = {
            "kochi": (9.967, 76.242, "Kochi (Cochin)"),
            "cochin": (9.967, 76.242, "Kochi (Cochin)"),
            "mumbai": (18.940, 72.840, "Mumbai (Bombay)"),
            "chennai": (13.084, 80.292, "Chennai (Madras)"),
            "visakhapatnam": (17.686, 83.218, "Visakhapatnam (Vizag)"),
            "vizag": (17.686, 83.218, "Visakhapatnam (Vizag)"),
            "paradip": (20.316, 86.611, "Paradip"),
            "kandla": (23.003, 70.219, "Kandla"),
            "kolkata": (22.572, 88.363, "Kolkata (Calcutta)"),
            "mangalore": (12.914, 74.856, "New Mangalore"),
            "tuticorin": (8.764, 78.134, "V.O. Chidambaranar (Tuticorin)"),
            "mormugao": (15.416, 73.800, "Mormugao (Goa)"),
            "goa": (15.416, 73.800, "Mormugao (Goa)"),
        }
        name_lower = name.lower()
        for k, (klat, klon, kname) in KNOWN.items():
            if k in name_lower:
                return klat, klon, kname

        return lat, lon, name

    def _handle_comparison_flow(self, places: list, intent: Intent, user) -> Generator[dict[str, Any], None, None]:
        """Runs side-by-side evaluation for two ports and yields comparison data."""
        p1, p2 = places[0], places[1]
        lat1, lon1, name1 = self._resolve_place_coords(p1)
        lat2, lon2, name2 = self._resolve_place_coords(p2)

        if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
            yield {
                "event": "error",
                "data": {"code": "unresolved_location", "message": f"Could not determine sea coordinates to compare {p1.text} and {p2.text}."},
            }
            return

        now = timezone.now()
        vessel = intent.vessel_class or "small_craft"

        yield {
            "event": "status",
            "data": {"step": "evaluating_ports", "label": f"Evaluating conditions for {name1} and {name2}..."},
        }

        a1 = evaluate_and_record_risk(lat=lat1, lon=lon1, valid_from=now, valid_to=now + timedelta(hours=12), vessel_class=vessel, user=user)
        a2 = evaluate_and_record_risk(lat=lat2, lon=lon2, valid_from=now, valid_to=now + timedelta(hours=12), vessel_class=vessel, user=user)

        # Emit both risk cards
        yield {"event": "risk", "data": RiskAssessmentSerializer(a1).data}
        yield {"event": "risk", "data": RiskAssessmentSerializer(a2).data}

        # Map showing both ports
        map_payload = {
            "focus": {"lat": (lat1 + lat2) / 2.0, "lon": (lon1 + lon2) / 2.0, "zoom": 6},
            "layers": [
                {
                    "id": "compare-ports",
                    "type": "geojson",
                    "data": {
                        "type": "FeatureCollection",
                        "features": [
                            {"type": "Feature", "geometry": {"type": "Point", "coordinates": [lon1, lat1]}, "properties": {"name": name1, "level": a1.level}},
                            {"type": "Feature", "geometry": {"type": "Point", "coordinates": [lon2, lat2]}, "properties": {"name": name2, "level": a2.level}},
                        ],
                    },
                }
            ],
        }
        yield {"event": "map", "data": map_payload}

        comp_text = render_comparison_explanation(
            port1_name=name1,
            assessment1=a1,
            port2_name=name2,
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
