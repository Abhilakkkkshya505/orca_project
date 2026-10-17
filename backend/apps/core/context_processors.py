from django.conf import settings


def environment_banner(request):
    """Adds environment identifier and banner flag to template contexts."""
    env_name = getattr(settings, "ENVIRONMENT", "local")
    return {
        "ENVIRONMENT_NAME": env_name,
        "IS_PRODUCTION": env_name == "production",
    }
