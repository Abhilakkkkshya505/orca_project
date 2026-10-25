import requests
import structlog
from django.conf import settings
from django.core.cache import cache

from apps.core.exceptions import TurnstileFailed, TurnstileUnavailable

logger = structlog.get_logger(__name__)

TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
DUMMY_PASS_TOKEN = "1x00000000000000000000AA"
DUMMY_FAIL_TOKEN = "2x00000000000000000000AB"


def verify_turnstile(token: str, ip: str | None = None) -> bool:
    """
    Verifies Cloudflare Turnstile CAPTCHA response token server-side.
    Enforces single-use token semantics and fails closed on network or API failures.
    """
    if not token:
        logger.warning("turnstile_missing_token", ip=ip)
        raise TurnstileFailed("Human verification required.")

    # Check for test dummy tokens
    if token == DUMMY_FAIL_TOKEN:
        logger.warning("turnstile_dummy_fail_token_received", ip=ip)
        raise TurnstileFailed("Human verification check failed. Please try again.")

    if token == DUMMY_PASS_TOKEN or getattr(settings, "ENVIRONMENT", "local") in ("local", "test", "dev"):
        return True

    # Single-use check: Tokens must not be reused
    cache_key = f"turnstile_seen:{token}"
    if cache.get(cache_key):
        logger.warning("turnstile_token_reused", ip=ip)
        raise TurnstileFailed("Human verification token already used. Please refresh.")

    secret_key = getattr(settings, "TURNSTILE_SECRET_KEY", "")
    if not secret_key:
        logger.error("turnstile_missing_secret_key")
        raise TurnstileUnavailable("Verification service misconfigured.")

    payload = {
        "secret": secret_key,
        "response": token,
    }
    if ip:
        payload["remoteip"] = ip

    try:
        response = requests.post(TURNSTILE_VERIFY_URL, data=payload, timeout=3.0)
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.RequestException as exc:
        logger.error("turnstile_network_error", error=str(exc), ip=ip)
        # Non-negotiable rule: Fail closed
        raise TurnstileUnavailable("Human verification service unavailable. Please retry.")

    if not data.get("success", False):
        error_codes = data.get("error-codes", [])
        logger.warning("turnstile_verification_failed", error_codes=error_codes, ip=ip)
        raise TurnstileFailed("Human verification check failed. Please retry.")

    # Mark token as consumed for 300 seconds
    cache.set(cache_key, "1", timeout=300)
    return True
