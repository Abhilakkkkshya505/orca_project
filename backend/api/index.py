"""
Vercel Serverless Function entrypoint inside backend.
"""
import os
import sys

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
os.environ.setdefault("ENVIRONMENT", "local")

from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()
app = application
