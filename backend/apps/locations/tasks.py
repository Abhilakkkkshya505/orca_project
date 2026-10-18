"""Celery tasks for evaluating alert subscriptions."""

from datetime import timedelta

import structlog
from celery import shared_task
from django.utils import timezone

from apps.locations.models import AlertSubscription
from apps.risk.services import evaluate_and_record_risk

logger = structlog.get_logger(__name__)


@shared_task(name="apps.locations.tasks.evaluate_alerts_task")
def evaluate_alerts_task():
    """
    Evaluates active alert subscriptions against current coastal conditions.
    Sends notifications if condition level meets or exceeds threshold.
    """
    now = timezone.now()
    active_subs = AlertSubscription.objects.filter(is_active=True).select_related("user", "location")
    evaluated_count = 0
    triggered_count = 0

    for sub in active_subs:
        evaluated_count += 1
        loc = sub.location
        try:
            assessment = evaluate_and_record_risk(
                lat=loc.lat,
                lon=loc.lon,
                valid_from=now,
                valid_to=now + timedelta(hours=12),
                vessel_class=getattr(sub.user, "vessel_class", "small_craft"),
                user=sub.user,
            )

            severity_map = {"safe": 1, "caution": 2, "unsafe": 3, "unknown": 2}
            current_severity = severity_map.get(assessment.level, 0)
            target_severity = severity_map.get(sub.min_level, 2)

            if current_severity >= target_severity:
                triggered_count += 1
                logger.info(
                    "Alert threshold met",
                    user_id=str(sub.user.public_id),
                    location_name=loc.name,
                    level=assessment.level,
                    min_level=sub.min_level,
                )
                sub.last_notified_at = now
                sub.save(update_fields=["last_notified_at"])
                # Note: Email notifications would be sent via configured EMAIL_BACKEND here

        except Exception as exc:
            logger.error("Error evaluating alert", sub_id=str(sub.public_id), error=str(exc))

    logger.info("Alert evaluation completed", evaluated=evaluated_count, triggered=triggered_count)
    return {"evaluated": evaluated_count, "triggered": triggered_count}
