import time

import jwt
import requests
import structlog
from django.conf import settings
from django.http import HttpResponseForbidden

logger = structlog.get_logger(__name__)

# Cache for Access public keys
_CERTS_CACHE = {"keys": {}, "expires_at": 0}


class TrustedProxyMiddleware:
    """
    Resolves client IP securely according to docs/security.md section 8.
    Only trusts CF-Connecting-IP when TRUST_CF_HEADERS is True.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if getattr(settings, "TRUST_CF_HEADERS", False):
            cf_ip = request.headers.get("CF-Connecting-IP")
            if cf_ip:
                request.client_ip = cf_ip.strip()
            else:
                request.client_ip = request.META.get("REMOTE_ADDR", "127.0.0.1")
        else:
            request.client_ip = request.META.get("REMOTE_ADDR", "127.0.0.1")

        return self.get_response(request)


class AccessJwtMiddleware:
    """
    Verifies Cloudflare Access JWT assertions on /admin/ paths.
    Enforces that only staff who passed Cloudflare Access can reach the Django admin login.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not request.path.startswith("/admin/"):
            return self.get_response(request)

        team_domain = getattr(settings, "CF_ACCESS_TEAM_DOMAIN", "")
        aud = getattr(settings, "CF_ACCESS_AUD", "")
        environment = getattr(settings, "ENVIRONMENT", "local")

        # In local or test environments without Access configured, allow passthrough
        if not aud or not team_domain or environment in ("local", "test"):
            return self.get_response(request)

        token = request.headers.get("Cf-Access-Jwt-Assertion")
        if not token:
            logger.warning(
                "access_denied_missing_token",
                path=request.path,
                ip=getattr(request, "client_ip", None),
            )
            return HttpResponseForbidden("Cloudflare Access assertion token required.")

        try:
            # Verify Access JWT
            certs = self._get_access_certs(team_domain)
            header = jwt.get_unverified_header(token)
            kid = header.get("kid")
            if not kid or kid not in certs:
                raise jwt.InvalidTokenError("Key ID not found in Access certificates.")

            public_key = certs[kid]
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                audience=aud,
                issuer=f"https://{team_domain}",
            )
            request.cf_access_user_email = payload.get("email")
        except Exception as e:
            logger.warning("access_denied_invalid_jwt", error=str(e), path=request.path)
            return HttpResponseForbidden("Cloudflare Access assertion verification failed.")

        return self.get_response(request)

    @classmethod
    def _get_access_certs(cls, team_domain: str) -> dict:
        now = time.time()
        if _CERTS_CACHE["expires_at"] > now and _CERTS_CACHE["keys"]:
            return _CERTS_CACHE["keys"]

        certs_url = f"https://{team_domain}/cdn-cgi/access/certs"
        resp = requests.get(certs_url, timeout=5)
        resp.raise_for_status()
        jwks = resp.json()

        keys = {}
        for key_dict in jwks.get("keys", []):
            kid = key_dict.get("kid")
            if kid:
                keys[kid] = jwt.algorithms.RSAAlgorithm.from_jwk(key_dict)

        _CERTS_CACHE["keys"] = keys
        _CERTS_CACHE["expires_at"] = now + 3600  # cache 1 hour
        return keys
