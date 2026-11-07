"""
Vercel Serverless Function entrypoint for Django WSGI application.
"""
import os
import sys

# Add backend directory to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
os.environ.setdefault("ENVIRONMENT", "local")

from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()
app = application

