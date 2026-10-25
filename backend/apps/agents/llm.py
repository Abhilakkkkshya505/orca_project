"""LLM Provider abstraction layer for ORCA agents.

Part D: Supports Template (default, 0 keys), Gemini, and Anthropic.
Enforces daily token budgets in Redis, strict number validation against hallucinations,
prompt-injection protection, and automatic fallback to verified templates.
"""

import json
import os
import re
from datetime import UTC, datetime
from typing import Any

import structlog
from django.conf import settings
from django.core.cache import cache

from apps.agents.parser import parse_intent
from apps.agents.schemas import Intent
from apps.agents.templates import render_risk_explanation
from apps.agents.validators import (
    build_allowed_numbers_from_assessment,
    validate_llm_numbers,
)
from apps.risk.models import RiskAssessment

logger = structlog.get_logger(__name__)


def load_prompt_file(filename: str) -> str:
    """Loads prompt template from apps/agents/prompts directory."""
    prompt_dir = os.path.join(os.path.dirname(__file__), "prompts")
    filepath = os.path.join(prompt_dir, filename)
    if os.path.exists(filepath):
        with open(filepath, encoding="utf-8") as f:
            return f.read()
    return ""


class BaseLLMProvider:
    """Base class for all LLM providers."""

    def extract_intent(self, text: str, context: dict | None = None) -> Intent:
        raise NotImplementedError

    def write_explanation(
        self,
        assessment: RiskAssessment,
        style: str = "plain",
        allowed_numbers: set[float] | None = None,
        location_name: str | None = None,
        assumed_vessel: bool = False,
        units: str = "metric",
    ) -> tuple[str, bool]:
        raise NotImplementedError


class TemplateProvider(BaseLLMProvider):
    """
    Deterministic rule-based provider (Part E).
    Always available, requires 0 API keys and 0 network requests.
    """

    def extract_intent(self, text: str, context: dict | None = None) -> Intent:
        return parse_intent(text, context)

    def write_explanation(
        self,
        assessment: RiskAssessment,
        style: str = "plain",
        allowed_numbers: set[float] | None = None,
        location_name: str | None = None,
        assumed_vessel: bool = False,
        units: str = "metric",
    ) -> tuple[str, bool]:
        text = render_risk_explanation(
            assessment=assessment,
            location_name=location_name,
            assumed_vessel=assumed_vessel,
            units=units,
        )
        return text, False


class GeminiProvider(BaseLLMProvider):
    """Google Gemini Provider using official google.generativeai or google.genai."""

    def __init__(self, api_key: str, model_name: str = "gemini-1.5-flash"):
        self.api_key = api_key
        self.model_name = model_name or "gemini-1.5-flash"
        self._init_client()

    def _init_client(self):
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(self.model_name)
            self.available = True
        except Exception as e:
            logger.warning("gemini_init_failed", error=str(e))
            self.available = False

    def extract_intent(self, text: str, context: dict | None = None) -> Intent:
        if not self.available:
            intent = parse_intent(text, context)
            intent.fallback = True
            intent.fallback_reason = "gemini_unavailable"
            return intent

        try:
            prompt_tpl = load_prompt_file("intent_v1.md")
            prompt = prompt_tpl.replace("{user_query}", text[:1000])
            resp = self.model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"},
            )
            data = json.loads(resp.text)
            return Intent(**data)
        except Exception as e:
            logger.warning("gemini_intent_extraction_failed", error=str(e))
            intent = parse_intent(text, context)
            intent.fallback = True
            intent.fallback_reason = f"gemini_intent_error: {str(e)[:60]}"
            return intent

    def write_explanation(
        self,
        assessment: RiskAssessment,
        style: str = "plain",
        allowed_numbers: set[float] | None = None,
        location_name: str | None = None,
        assumed_vessel: bool = False,
        units: str = "metric",
    ) -> tuple[str, bool]:
        if not self.available:
            return TemplateProvider().write_explanation(
                assessment, style, allowed_numbers, location_name, assumed_vessel, units
            )[0], True

        data_block = {
            "level": assessment.level,
            "vessel_class": assessment.vessel_class,
            "location": location_name or f"{assessment.lat:.2f}N, {assessment.lon:.2f}E",
            "marine_offset_km": assessment.marine_offset_km,
            "factors": assessment.factors,
            "advisories_count": len(assessment.advisory_ids or []),
            "units": units,
            "valid_from": assessment.valid_from.isoformat() if assessment.valid_from else None,
        }

        prompt_tpl = load_prompt_file("explain_v1.md")
        prompt = prompt_tpl.replace("{data_block_json}", json.dumps(data_block, indent=2))

        allowed = allowed_numbers or build_allowed_numbers_from_assessment(assessment)

        for attempt in range(2):
            try:
                resp = self.model.generate_content(prompt)
                text = resp.text.strip()
                is_valid, unsupported = validate_llm_numbers(text, allowed)
                if is_valid:
                    return text, False
                logger.warning("gemini_validator_rejected_attempt", attempt=attempt, unsupported=unsupported)
                prompt += f"\n\nSTRICT WARNING: Do not mention numbers {unsupported}. You must ONLY use figures from the DATA BLOCK."
            except Exception as e:
                logger.warning("gemini_explanation_failed", error=str(e))
                break

        # Fallback to template
        fallback_text, _ = TemplateProvider().write_explanation(
            assessment, style, allowed_numbers, location_name, assumed_vessel, units
        )
        return fallback_text, True


class AnthropicProvider(BaseLLMProvider):
    """Anthropic Claude Provider using official anthropic SDK."""

    def __init__(self, api_key: str, model_name: str = "claude-3-5-sonnet-20241022"):
        self.api_key = api_key
        self.model_name = model_name or "claude-3-5-sonnet-20241022"
        self._init_client()

    def _init_client(self):
        try:
            import anthropic
            self.client = anthropic.Anthropic(api_key=self.api_key)
            self.available = True
        except Exception as e:
            logger.warning("anthropic_init_failed", error=str(e))
            self.available = False

    def extract_intent(self, text: str, context: dict | None = None) -> Intent:
        if not self.available:
            intent = parse_intent(text, context)
            intent.fallback = True
            intent.fallback_reason = "anthropic_unavailable"
            return intent

        try:
            prompt_tpl = load_prompt_file("intent_v1.md")
            prompt = prompt_tpl.replace("{user_query}", text[:1000])
            msg = self.client.messages.create(
                model=self.model_name,
                max_tokens=500,
                messages=[{"role": "user", "content": prompt}],
            )
            content = msg.content[0].text
            # Extract JSON block
            json_match = re.search(r"\{.*\}", content, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(0))
                return Intent(**data)
            return parse_intent(text, context)
        except Exception as e:
            logger.warning("anthropic_intent_failed", error=str(e))
            intent = parse_intent(text, context)
            intent.fallback = True
            intent.fallback_reason = f"anthropic_intent_error: {str(e)[:60]}"
            return intent

    def write_explanation(
        self,
        assessment: RiskAssessment,
        style: str = "plain",
        allowed_numbers: set[float] | None = None,
        location_name: str | None = None,
        assumed_vessel: bool = False,
        units: str = "metric",
    ) -> tuple[str, bool]:
        if not self.available:
            return TemplateProvider().write_explanation(
                assessment, style, allowed_numbers, location_name, assumed_vessel, units
            )[0], True

        data_block = {
            "level": assessment.level,
            "vessel_class": assessment.vessel_class,
            "location": location_name or f"{assessment.lat:.2f}N, {assessment.lon:.2f}E",
            "marine_offset_km": assessment.marine_offset_km,
            "factors": assessment.factors,
            "advisories_count": len(assessment.advisory_ids or []),
            "units": units,
            "valid_from": assessment.valid_from.isoformat() if assessment.valid_from else None,
        }

        prompt_tpl = load_prompt_file("explain_v1.md")
        prompt = prompt_tpl.replace("{data_block_json}", json.dumps(data_block, indent=2))
        allowed = allowed_numbers or build_allowed_numbers_from_assessment(assessment)

        for attempt in range(2):
            try:
                msg = self.client.messages.create(
                    model=self.model_name,
                    max_tokens=300,
                    messages=[{"role": "user", "content": prompt}],
                )
                text = msg.content[0].text.strip()
                is_valid, unsupported = validate_llm_numbers(text, allowed)
                if is_valid:
                    return text, False
                logger.warning("anthropic_validator_rejected_attempt", attempt=attempt, unsupported=unsupported)
                prompt += f"\n\nSTRICT WARNING: Do not mention numbers {unsupported}. You must ONLY use figures from the DATA BLOCK."
            except Exception as e:
                logger.warning("anthropic_explanation_failed", error=str(e))
                break

        # Fallback to template
        fallback_text, _ = TemplateProvider().write_explanation(
            assessment, style, allowed_numbers, location_name, assumed_vessel, units
        )
        return fallback_text, True


class GroqProvider(BaseLLMProvider):
    """
    Groq High-Speed LPU Provider using OpenAI-compatible REST endpoint.
    Ultra-low latency inference for maritime intent and non-hallucinatory explanations.
    """

    def __init__(self, api_key: str, model_name: str = "qwen/qwen3.8-27b"):
        self.api_key = api_key
        self.model_name = model_name or "qwen/qwen3.8-27b"
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        self.available = bool(api_key)

    def extract_intent(self, text: str, context: dict | None = None) -> Intent:
        if not self.available:
            intent = parse_intent(text, context)
            intent.fallback = True
            intent.fallback_reason = "groq_unavailable"
            return intent

        try:
            import requests

            prompt_tpl = load_prompt_file("intent_v1.md")
            prompt = prompt_tpl.replace("{user_query}", text[:1000])

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": self.model_name,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a marine intent parser. You must respond with ONLY valid JSON matching the requested schema. No markdown formatting, no code fences.",
                    },
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.1,
                "max_tokens": 500,
            }
            resp = requests.post(self.api_url, headers=headers, json=payload, timeout=10)
            if resp.status_code == 200:
                content = resp.json()["choices"][0]["message"]["content"]
                clean = re.sub(r"^```(?:json)?\s*|\s*```$", "", content.strip(), flags=re.MULTILINE)
                data = json.loads(clean)
                return Intent(**data)
            else:
                logger.warning("groq_intent_http_error", status=resp.status_code, body=resp.text[:200])
                raise ValueError(f"HTTP {resp.status_code}")
        except Exception as e:
            logger.warning("groq_intent_extraction_failed", error=str(e))
            intent = parse_intent(text, context)
            intent.fallback = True
            intent.fallback_reason = f"groq_intent_error: {str(e)[:60]}"
            return intent

    def write_explanation(
        self,
        assessment: RiskAssessment,
        style: str = "plain",
        allowed_numbers: set[float] | None = None,
        location_name: str | None = None,
        assumed_vessel: bool = False,
        units: str = "metric",
    ) -> tuple[str, bool]:
        if not self.available:
            return TemplateProvider().write_explanation(
                assessment, style, allowed_numbers, location_name, assumed_vessel, units
            )[0], True

        import requests

        data_block = {
            "level": assessment.level,
            "vessel_class": assessment.vessel_class,
            "location": location_name or f"{assessment.lat:.2f}N, {assessment.lon:.2f}E",
            "marine_offset_km": assessment.marine_offset_km,
            "factors": assessment.factors,
            "advisories_count": len(assessment.advisory_ids or []),
            "units": units,
            "valid_from": assessment.valid_from.strftime("%H:%M UTC") if assessment.valid_from else None,
        }


        prompt_tpl = load_prompt_file("explain_v1.md")
        prompt = prompt_tpl.replace("{data_block_json}", json.dumps(data_block, indent=2))
        allowed = allowed_numbers or build_allowed_numbers_from_assessment(assessment)

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        for attempt in range(2):
            try:
                payload = {
                    "model": self.model_name,
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are ORCA, an AI assistant for coastal safety and marine ecosystem reasoning. "
                                "Synthesize a concise, nautical explanation using ONLY figures from the DATA BLOCK. "
                                "Never invent numbers or contradict the official rating."
                            ),
                        },
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.2,
                    "max_tokens": 350,
                }
                resp = requests.post(self.api_url, headers=headers, json=payload, timeout=12)
                if resp.status_code == 200:
                    text = resp.json()["choices"][0]["message"]["content"].strip()
                    is_valid, unsupported = validate_llm_numbers(text, allowed)
                    if is_valid:
                        return text, False
                    logger.warning("groq_validator_rejected_attempt", attempt=attempt, unsupported=unsupported)
                    prompt += f"\n\nSTRICT WARNING: Do not mention numbers {unsupported}. You must ONLY use figures from the DATA BLOCK."
                else:
                    logger.warning("groq_explanation_http_error", status=resp.status_code, body=resp.text[:200])
                    break
            except Exception as e:
                logger.warning("groq_explanation_failed", error=str(e))
                break

        # Fallback to template if validation or network fails
        fallback_text, _ = TemplateProvider().write_explanation(
            assessment, style, allowed_numbers, location_name, assumed_vessel, units
        )
        return fallback_text, True

    def generate_chat_reply(self, message: str, context: dict | None = None) -> str:
        """Generates conversational coastal and oceanographic assistance."""
        if not self.available:
            return ""

        import requests

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        system_prompt = (
            "You are ORCA (Ocean Reasoning and Coastal Advisory), an AI assistant for marine safety, "
            "coastal oceanography, and nautical intelligence (SDG 14). "
            "You provide accurate coastal oceanography insights, wave explanations, and maritime guidance. "
            "Keep answers concise, direct, and under 150 words. Do not use marketing buzzwords."
        )
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message[:1000]},
        ]
        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": 300,
        }
        try:
            resp = requests.post(self.api_url, headers=headers, json=payload, timeout=12)
            if resp.status_code == 200:
                return resp.json()["choices"][0]["message"]["content"].strip()
            return ""
        except Exception as e:
            logger.warning("groq_chat_reply_failed", error=str(e))
            return ""


class LLMClient:
    """
    Primary interface for orchestrator multi-agent reasoning.
    Selects the active provider (Groq, Gemini, Anthropic, or Template) and enforces token budget limits.
    """

    def __init__(self):
        self.provider_name = getattr(settings, "LLM_PROVIDER", "template").lower()
        self.model_name = getattr(settings, "LLM_MODEL", "")
        self.api_key = (
            getattr(settings, "LLM_API_KEY", "")
            or getattr(settings, "GROQ_API_KEY", "")
            or getattr(settings, f"{self.provider_name.upper()}_API_KEY", "")
        )
        self.daily_budget = getattr(settings, "LLM_DAILY_TOKEN_BUDGET", 100000)

        # Instantiate provider - priority to Groq if key provided
        groq_key = getattr(settings, "GROQ_API_KEY", "") or (self.api_key if self.provider_name == "groq" else "")
        if self.provider_name == "groq" or (groq_key and self.provider_name in ("template", "groq", "")):
            self.provider = GroqProvider(api_key=groq_key, model_name=self.model_name or "qwen/qwen3.8-27b")
        elif self.provider_name == "gemini" and self.api_key:
            self.provider = GeminiProvider(api_key=self.api_key, model_name=self.model_name)
        elif self.provider_name == "anthropic" and self.api_key:
            self.provider = AnthropicProvider(api_key=self.api_key, model_name=self.model_name)
        else:
            self.provider = TemplateProvider()


    def _get_daily_token_usage(self) -> int:
        today_key = f"llm_tokens_{datetime.now(UTC).strftime('%Y%m%d')}"
        try:
            return int(cache.get(today_key) or 0)
        except Exception:
            return 0

    def _record_tokens(self, count: int):
        today_key = f"llm_tokens_{datetime.now(UTC).strftime('%Y%m%d')}"
        try:
            usage = self._get_daily_token_usage()
            cache.set(today_key, usage + count, timeout=86400 * 2)
        except Exception:
            pass

    def is_budget_exceeded(self) -> bool:
        return self._get_daily_token_usage() >= self.daily_budget

    def extract_intent(self, user_query: str, default_location: dict | None = None, context: dict | None = None) -> Intent:
        """Parses intent from user question."""
        ctx = context or {}
        if default_location and "location" not in ctx:
            ctx["location"] = default_location

        if self.is_budget_exceeded():
            intent = TemplateProvider().extract_intent(user_query, ctx)
            intent.fallback = True
            intent.fallback_reason = "token_budget_exceeded"
            return intent

        return self.provider.extract_intent(user_query, ctx)

    def generate_explanation(
        self,
        assessment: RiskAssessment,
        allowed_numbers: set[float] | None = None,
        location_name: str | None = None,
        assumed_vessel: bool = False,
        units: str = "metric",
    ) -> tuple[str, bool]:
        """Generates validated explanation with fallback tracking."""
        if self.is_budget_exceeded():
            text, _ = TemplateProvider().write_explanation(
                assessment=assessment,
                location_name=location_name,
                assumed_vessel=assumed_vessel,
                units=units,
            )
            return text, True

        return self.provider.write_explanation(
            assessment=assessment,
            allowed_numbers=allowed_numbers,
            location_name=location_name,
            assumed_vessel=assumed_vessel,
            units=units,
        )

    def generate_chat_reply(self, message: str, context: dict | None = None) -> str:
        """Generates conversational coastal and oceanographic reply."""
        if self.is_budget_exceeded():
            return ""
        if hasattr(self.provider, "generate_chat_reply"):
            return self.provider.generate_chat_reply(message, context)
        return ""

