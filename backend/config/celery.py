"""
Celery configuration for ORCA background tasks and beat schedules.
"""

import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

app = Celery("orca")

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Periodic task beat schedule
app.conf.beat_schedule = {
    "ingest-open-meteo-every-3h": {
        "task": "apps.geodata.tasks.ingest_open_meteo_task",
        "schedule": crontab(minute=0, hour="*/3"),
    },
    "ingest-copernicus-every-6h": {
        "task": "apps.geodata.tasks.ingest_copernicus_task",
        "schedule": crontab(minute=15, hour="*/6"),
    },
    "ingest-advisories-every-30m": {
        "task": "apps.geodata.tasks.ingest_advisories_task",
        "schedule": crontab(minute="*/30"),
    },
    "evaluate-alerts-hourly": {
        "task": "apps.locations.tasks.evaluate_alerts_task",
        "schedule": crontab(minute=45),
    },
    "prune-snapshots-daily": {
        "task": "apps.geodata.tasks.prune_snapshots_task",
        "schedule": crontab(minute=30, hour=2),  # 02:30 UTC daily
    },
    "check-data-freshness-every-15m": {
        "task": "apps.geodata.tasks.check_data_freshness_task",
        "schedule": crontab(minute="*/15"),
    },
}


@app.task(bind=True)
def debug_ping(self):
    """Trivial Celery ping task for health checks and worker round-trip verification."""
    return "pong"

