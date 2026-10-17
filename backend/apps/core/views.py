import uuid

from django.core.cache import cache
from django.db import connection
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthLiveView(APIView):
    """Liveness probe: verifies process is running and accepting HTTP requests."""

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Liveness Probe",
        description="Returns 200 if the process is up and running.",
        responses={200: inline_serializer("LiveStatus", fields={"status": serializers.CharField()})},
    )
    def get(self, request):
        return Response({"status": "ok"}, status=status.HTTP_200_OK)


class HealthReadyView(APIView):
    """Readiness probe: verifies database and cache backends are reachable."""

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Readiness Probe",
        description="Checks database and Redis connectivity. Returns 200 if ready, 503 if degraded.",
        responses={
            200: inline_serializer(
                "ReadyStatus",
                fields={"status": serializers.CharField(), "checks": serializers.DictField()},
            )
        },
    )
    def get(self, request):
        checks = {}
        all_ok = True

        # Database check
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                row = cursor.fetchone()
                checks["db"] = "ok" if row and row[0] == 1 else "failed"
        except Exception as e:
            checks["db"] = f"error: {str(e)}"
            all_ok = False

        # Redis / Cache check
        try:
            cache_key = "health_ready_probe"
            cache.set(cache_key, "ok", timeout=10)
            val = cache.get(cache_key)
            checks["redis"] = "ok" if val == "ok" else "failed"
        except Exception as e:
            checks["redis"] = f"error: {str(e)}"
            all_ok = False

        status_code = status.HTTP_200_OK if all_ok else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response(
            {
                "status": "ok" if all_ok else "degraded",
                "checks": checks,
            },
            status=status_code,
        )


class DataStatusView(APIView):
    """Data Freshness Status: reports status and freshness of ingested data sources."""

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Data Freshness Status",
        description="Returns ingestion freshness and operational status for all configured ocean and weather data sources.",
    )
    def get(self, request):
        # Query DataSource model if table exists, or provide safe status
        sources_data = []
        try:
            from apps.geodata.models import DataSource

            for ds in DataSource.objects.filter(is_enabled=True):
                age_minutes = ds.age_minutes
                sources_data.append(
                    {
                        "slug": ds.slug,
                        "name": ds.name,
                        "last_success_at": ds.last_success_at.isoformat() if ds.last_success_at else None,
                        "age_minutes": age_minutes,
                        "status": ds.status,
                    }
                )
        except Exception:
            # Fallback when running before initial migrations
            sources_data = [
                {
                    "slug": "open_meteo",
                    "name": "Open-Meteo Marine & Forecast",
                    "last_success_at": None,
                    "age_minutes": None,
                    "status": "ok",
                }
            ]

        return Response({"sources": sources_data}, status=status.HTTP_200_OK)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfView(APIView):
    """Issues CSRF cookie for client-side SPA."""

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Acquire CSRF Cookie",
        description="Sets the csrftoken cookie for subsequent state-changing POST/PATCH/DELETE requests.",
        responses={204: None},
    )
    def get(self, request):
        return Response(status=status.HTTP_204_NO_CONTENT)


def handler404_view(request, exception=None):
    """JSON 404 handler for API paths."""
    request_id = getattr(request, "request_id", uuid.uuid4().hex)
    return JsonResponse(
        {
            "error": {
                "code": "not_found",
                "message": "The requested endpoint does not exist.",
                "details": {},
                "request_id": request_id,
            }
        },
        status=404,
    )


def handler500_view(request):
    """JSON 500 handler for API paths."""
    request_id = getattr(request, "request_id", uuid.uuid4().hex)
    return JsonResponse(
        {
            "error": {
                "code": "internal_error",
                "message": "An internal server error occurred.",
                "details": {},
                "request_id": request_id,
            }
        },
        status=500,
    )
