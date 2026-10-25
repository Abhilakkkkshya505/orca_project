"""
Base settings for ORCA project.
"""

from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env(
    DEBUG=(bool, False),
    SECRET_KEY=(str, "insecure-secret-key-must-be-set-in-environment"),
    ENVIRONMENT=(str, "local"),
    DATABASE_URL=(str, f"sqlite:///{BASE_DIR / 'db.sqlite3'}"),
    REDIS_URL=(str, "redis://localhost:6379/0"),
    CELERY_BROKER_URL=(str, "redis://localhost:6379/1"),
    TRUST_CF_HEADERS=(bool, False),
    TURNSTILE_SECRET_KEY=(str, "1x0000000000000000000000000000000AA"),
    CF_ACCESS_TEAM_DOMAIN=(str, ""),
    CF_ACCESS_AUD=(str, ""),
    LLM_PROVIDER=(str, "template"),
    LLM_MODEL=(str, "qwen/qwen3.8-27b"),
    LLM_API_KEY=(str, ""),
    GROQ_API_KEY=(str, ""),
    LLM_DAILY_TOKEN_BUDGET=(int, 100000),
    COVERAGE_BBOX=(str, "68.0,6.0,89.0,24.0"),
    RISK_OUTPUT_ENABLED=(bool, True),
    DEMO_PASSWORD=(str, "OrcaDemoUser2026!"),
)

# Read .env if present
env_file = BASE_DIR / ".env"
if env_file.exists():
    environ.Env.read_env(env_file)

SECRET_KEY = env("SECRET_KEY")
DEBUG = env("DEBUG")
ENVIRONMENT = env("ENVIRONMENT")

ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["localhost", "127.0.0.1", "api.localtest.me"])

# Application definition
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

# Check if GDAL is available for GeoDjango
HAS_GDAL = False
try:
    from django.contrib.gis import gdal  # noqa: F401

    HAS_GDAL = True
except Exception:
    HAS_GDAL = False

if HAS_GDAL:
    DJANGO_APPS.append("django.contrib.gis")

THIRD_PARTY_APPS = [
    "rest_framework",
    "drf_spectacular",
    "corsheaders",
]

LOCAL_APPS = [
    "apps.core.apps.CoreConfig",
    "apps.accounts.apps.AccountsConfig",
    "apps.geodata.apps.GeodataConfig",
    "apps.ports.apps.PortsConfig",
    "apps.risk.apps.RiskConfig",
    "apps.agents.apps.AgentsConfig",
    "apps.chat.apps.ChatConfig",
    "apps.locations.apps.LocationsConfig",
    "apps.dashboard.apps.DashboardConfig",
    "apps.auditlog.apps.AuditlogConfig",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "apps.core.middleware.RequestIDMiddleware",
    "apps.core.cloudflare.TrustedProxyMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "apps.core.cloudflare.AccessJwtMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "apps.core.context_processors.environment_banner",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# Database setup
DATABASES = {"default": env.db("DATABASE_URL", default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}")}

if DATABASES["default"]["ENGINE"] == "django.db.backends.sqlite3":
    db_name = DATABASES["default"].get("NAME")
    if db_name and db_name != ":memory:" and not Path(db_name).is_absolute():
        DATABASES["default"]["NAME"] = str(BASE_DIR / db_name)

# Fix dialect if postgis is specified but running on sqlite
if not HAS_GDAL and DATABASES["default"]["ENGINE"] == "django.contrib.gis.db.backends.postgis":
    # If GDAL library is not available on host system, fall back to standard postgresql or sqlite
    DATABASES["default"]["ENGINE"] = "django.db.backends.postgresql"

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 10},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

PASSWORD_RESET_TIMEOUT = 3600  # 1 hour

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "static_root"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Session & Cookies
SESSION_ENGINE = "django.contrib.sessions.backends.cached_db"
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_AGE = 1209600  # 14 days
CSRF_COOKIE_HTTPONLY = False  # SPA needs to read cookie to send X-CSRFToken
CSRF_COOKIE_SAMESITE = "Lax"

# Cache
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "orca-local-cache",
    }
}
REDIS_URL = env("REDIS_URL", default="")
if REDIS_URL and not env("TESTING", default=False):
    import socket
    try:
        host_port = REDIS_URL.split("://")[1].split("/")[0]
        host = host_port.split(":")[0]
        port = int(host_port.split(":")[1]) if ":" in host_port else 6379
        sock = socket.socket()
        sock.settimeout(0.2)
        if sock.connect_ex((host, port)) == 0:
            CACHES["default"] = {
                "BACKEND": "django_redis.cache.RedisCache",
                "LOCATION": REDIS_URL,
                "OPTIONS": {
                    "CLIENT_CLASS": "django_redis.client.DefaultClient",
                    "IGNORE_EXCEPTIONS": True,
                },
                "KEY_PREFIX": "orca:v1",
            }
        sock.close()
    except Exception:
        pass

# REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.StandardPageNumberPagination",
    "EXCEPTION_HANDLER": "apps.core.exceptions.custom_exception_handler",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "60/minute",
        "user": "120/minute",
        "auth_ip": "10/hour",
        "auth_email": "20/hour",
        "guest_chat": "10/hour",
        "user_chat": "60/hour",
    },
}

FRONTEND_URL = env("FRONTEND_URL", default="http://app.localtest.me:5173")

SPECTACULAR_SETTINGS = {
    "TITLE": "ORCA Marine Safety & Ecosystem Reasoning API",
    "DESCRIPTION": (
        "Decision support system turning marine and meteorological forecasts into plain-language "
        "safety ratings and likely fishing areas for coastal communities."
    ),
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
}

# CORS
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
    "idempotency-key",
]

# Security & Cloudflare
TRUST_CF_HEADERS = env("TRUST_CF_HEADERS")
TURNSTILE_SECRET_KEY = env("TURNSTILE_SECRET_KEY")
CF_ACCESS_TEAM_DOMAIN = env("CF_ACCESS_TEAM_DOMAIN")
CF_ACCESS_AUD = env("CF_ACCESS_AUD")

# LLM & Risk Engine configuration
LLM_PROVIDER = env("LLM_PROVIDER")
LLM_MODEL = env("LLM_MODEL")
LLM_API_KEY = env("LLM_API_KEY")
GROQ_API_KEY = env("GROQ_API_KEY")
LLM_DAILY_TOKEN_BUDGET = env.int("LLM_DAILY_TOKEN_BUDGET")

RISK_OUTPUT_ENABLED = env.bool("RISK_OUTPUT_ENABLED")
COVERAGE_BBOX = [float(x.strip()) for x in env("COVERAGE_BBOX").split(",")]
RULES_VERSION = "2026.10.0"

# Celery
CELERY_BROKER_URL = env("CELERY_BROKER_URL")
CELERY_RESULT_BACKEND = env("REDIS_URL")
CELERY_TASK_IGNORE_RESULT = True
CELERY_TASK_ACKS_LATE = True
CELERY_TASK_TIME_LIMIT = 720  # 12 minutes
CELERY_TASK_SOFT_TIME_LIMIT = 600  # 10 minutes

# Email
EMAIL_BACKEND = env("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="alerts@orca.example")

# Development access bypass (Turnstile/JWT bypass, only allowed in local/test mode)
DEV_BYPASS_ACCESS = env.bool("DEV_BYPASS_ACCESS", default=False)


def validate_environment(custom_env=None):
    """
    Validates required environment configuration.
    Reports ALL missing required variables at once and refuses DEV_BYPASS_ACCESS in production.
    """
    import os
    from django.core.exceptions import ImproperlyConfigured

    target_env = custom_env if custom_env is not None else os.environ
    current_environment = target_env.get("ENVIRONMENT", ENVIRONMENT)

    if custom_env is not None:
        bypass_access = str(custom_env.get("DEV_BYPASS_ACCESS", "false")).lower() in ("true", "1", "yes")
    else:
        bypass_access = str(target_env.get("DEV_BYPASS_ACCESS", DEV_BYPASS_ACCESS)).lower() in ("true", "1", "yes")

    if current_environment == "production" and bypass_access:
        raise ImproperlyConfigured("DEV_BYPASS_ACCESS=true is strictly forbidden in production mode.")

    if current_environment == "production":
        required_vars = [
            "SECRET_KEY",
            "DATABASE_URL",
            "REDIS_URL",
            "CELERY_BROKER_URL",
            "COOKIE_DOMAIN",
            "ALLOWED_HOSTS",
            "CSRF_TRUSTED_ORIGINS",
            "CORS_ALLOWED_ORIGINS",
            "FRONTEND_URL",
        ]
        missing = [v for v in required_vars if not target_env.get(v)]
        if missing:
            raise ImproperlyConfigured(
                f"Missing required environment variables: {', '.join(missing)}"
            )


# Perform initial validation on import if in production
if ENVIRONMENT == "production":
    validate_environment()

