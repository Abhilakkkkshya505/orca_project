"""
ASGI config for ORCA project.
Needed for streaming SSE responses via uvicorn.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

application = get_asgi_application()
