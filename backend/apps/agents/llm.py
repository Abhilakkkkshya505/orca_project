from datetime import UTC, datetime

import structlog
from django.conf import settings
from django.core.cache import cache

from apps.agents.schemas import IntentExtractionResult
from apps.agents.validators import validate_llm_numbers
from apps.risk.models import RiskAssessment

logger = structlog.get_logger(__name__)


class LLMClient:
    """
    Pluggable LLM interface with daily budget tracking and deterministic template fallbacks.
    Never lets an LLM invent numbers or decide safety ratings.
    """

    def __init__(self):
        self.provider = getattr(settings, "LLM_PROVIDER", "template")
        self.model_name = getattr(settings, "LLM_MODEL", "template-engine")
        self.daily_budget = getattr(settings, "LLM_DAILY_TOKEN_BUDGET", 100000)

    def _get_daily_token_usage(self) -> int:
        today_key = f"llm_tokens_{datetime.now(UTC).strftime('%Y%m%d')}"
        return int(cache.get(today_key) or 0)

    def _record_tokens(self, tokens_used: int) -> None:
        today_key = f"llm_tokens_{datetime.now(UTC).strftime('%Y%m%d')}"
        current = self._get_daily_token_usage()
        cache.set(today_key, current + tokens_used, timeout=86400 * 2)

    def is_budget_exceeded(self) -> bool:
        return self._get_daily_token_usage() >= self.daily_budget

    def extract_intent(self, user_query: str, default_location: dict | None = None) -> IntentExtractionResult:
        """
        Parses intent from user question. If template/offline, uses pattern matching
        against known Indian coastal ports.
        """
        q = user_query.lower()

        # Known port coordinates dictionary
        PORTS = {
            "kochi": (9.97, 76.24),
            "cochin": (9.97, 76.24),
            "mumbai": (18.92, 72.83),
            "bombay": (18.92, 72.83),
            "chennai": (13.08, 80.27),
            "madras": (13.08, 80.27),
            "visakhapatnam": (17.68, 83.21),
            "vizag": (17.68, 83.21),
            "goa": (15.49, 73.82),
            "panaji": (15.49, 73.82),
            "kanyakumari": (8.08, 77.55),
            "veraval": (20.95, 70.36),
            "mangalore": (12.87, 74.84),
            "puri": (19.81, 85.83),
        }

        matched_port = None
        for port, (plat, plon) in PORTS.items():
            if port in q:
                matched_port = (port.capitalize(), plat, plon)
                break

        vessel_class = "mechanised" if any(w in q for w in ["trawler", "mechanised", "inboard"]) else "small_craft"

        if matched_port:
            name, lat, lon = matched_port
            return IntentExtractionResult(
                location_name=name,
                lat=lat,
                lon=lon,
                vessel_class=vessel_class,
            )

        if default_location and "lat" in default_location and "lon" in default_location:
            return IntentExtractionResult(
                location_name="Current Location",
                lat=float(default_location["lat"]),
                lon=float(default_location["lon"]),
                vessel_class=vessel_class,
            )

        # Default fallback to Kochi, Kerala
        return IntentExtractionResult(
            location_name="Kochi",
            lat=9.97,
            lon=76.24,
            vessel_class=vessel_class,
        )

    def generate_explanation(self, assessment: RiskAssessment, allowed_numbers: set[float]) -> tuple[str, bool]:
        """
        Generates explanatory text from structured assessment.
        Validates output numbers with agents/validators.py.
        Falls back to deterministic template on validation failure or budget exhaustion.
        Returns: (explanation_text, was_fallback)
        """
        if self.is_budget_exceeded() or self.provider == "template":
            return self._render_template_explanation(assessment), True

        # Try generating via external provider
        generated = self._call_provider_api(assessment)
        if generated:
            is_valid, unsupported = validate_llm_numbers(generated, allowed_numbers)
            if is_valid:
                return generated, False
            logger.warning("llm_validator_rejected_first_attempt", unsupported=unsupported)
            # Retry once
            generated_retry = self._call_provider_api(assessment)
            if generated_retry:
                is_valid2, _ = validate_llm_numbers(generated_retry, allowed_numbers)
                if is_valid2:
                    return generated_retry, False

        # Fallback to deterministic template
        return self._render_template_explanation(assessment), True

    def _call_provider_api(self, assessment: RiskAssessment) -> str | None:
        """Calls external LLM if credentials and provider configured."""
        try:
            if self.provider == "gemini" and settings.LLM_API_KEY:
                import google.generativeai as genai

                genai.configure(api_key=settings.LLM_API_KEY)
                model = genai.GenerativeModel("gemini-1.5-flash")
                prompt = f"Explain this marine risk result simply without extra numbers: Level is {assessment.level} for {assessment.vessel_class}."
                resp = model.generate_content(prompt)
                self._record_tokens(len(prompt.split()) + len(resp.text.split()))
                return resp.text.strip()
        except Exception as e:
            logger.warning("llm_api_call_failed", error=str(e))
        return None

    def _render_template_explanation(self, assessment: RiskAssessment) -> str:
        """
        Deterministic, plain-spoken template explanation.
        Guaranteed zero hallucinated numbers and zero external API dependencies.
        """
        lvl = assessment.level.lower()
        factors_map = {f.get("key"): f for f in assessment.factors}

        wave = factors_map.get("wave_height_m", {})
        wind = factors_map.get("wind_speed_kmh", {})
        gust = factors_map.get("wind_gust_kmh", {})

        wave_val = wave.get("value")
        wind_val = wind.get("value")
        gust_val = gust.get("value")

        parts = []
        if lvl == "safe":
            parts.append(f"Conditions are currently evaluated as Safe for {assessment.vessel_class.replace('_', ' ')}.")
        elif lvl == "caution":
            parts.append(
                f"Caution advised for {assessment.vessel_class.replace('_', ' ')} due to developing conditions."
            )
        elif lvl == "unsafe":
            parts.append(f"Unsafe conditions detected for {assessment.vessel_class.replace('_', ' ')}.")
        else:
            parts.append("Risk level is currently Unknown due to missing or stale sensor reports.")

        metrics = []
        if wave_val is not None:
            metrics.append(f"waves reach {wave_val:.1f} m")
        if wind_val is not None:
            metrics.append(f"sustained winds blow at {int(wind_val)} km/h")
        if gust_val is not None:
            metrics.append(f"gusts reach {int(gust_val)} km/h")

        if metrics:
            parts.append(f"Observations show {', and '.join(metrics)}.")

        if assessment.advisory_ids:
            parts.append(f"There are {len(assessment.advisory_ids)} active official bulletins covering this area.")

        parts.append("Official warnings always override ORCA. Check local port authorities before setting sail.")
        return " ".join(parts)
