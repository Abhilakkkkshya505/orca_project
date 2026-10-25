"""
Development settings for ORCA.
"""

from .base import *  # noqa: F403

DEBUG = True
ENVIRONMENT = "local"

# Shared parent domain cookie configuration (None allows cookies on localhost/127.0.0.1)
SESSION_COOKIE_DOMAIN = env("SESSION_COOKIE_DOMAIN", default=None)
CSRF_COOKIE_DOMAIN = env("CSRF_COOKIE_DOMAIN", default=None)
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

CORS_ALLOWED_ORIGINS = [
    "http://app.localtest.me:5173",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

CSRF_TRUSTED_ORIGINS = [
    "http://app.localtest.me:5173",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
