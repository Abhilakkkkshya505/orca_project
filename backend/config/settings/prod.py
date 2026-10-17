"""
Production settings for ORCA.
Hardened according to docs/security.md and passes python manage.py check --deploy.
"""

from .base import *  # noqa: F403

DEBUG = False
ENVIRONMENT = "production"

ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["api.orca.example"])  # noqa: F405

# Secure Cookies & Domain Sharing
COOKIE_DOMAIN = env("COOKIE_DOMAIN", default=".orca.example")  # noqa: F405
SESSION_COOKIE_DOMAIN = COOKIE_DOMAIN
CSRF_COOKIE_DOMAIN = COOKIE_DOMAIN
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True

# Security Headers & HSTS
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = False
X_FRAME_OPTIONS = "DENY"
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=["https://app.orca.example"])  # noqa: F405
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=["https://app.orca.example"])  # noqa: F405

# Cloudflare Tunnel IP Trust
TRUST_CF_HEADERS = env.bool("TRUST_CF_HEADERS", default=True)  # noqa: F405
