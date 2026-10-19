from datetime import timedelta

from django.utils import timezone
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import DomainError
from apps.ports.models import Port
from apps.risk.serializers import RiskAssessmentSerializer
from apps.risk.services import evaluate_and_record_risk


class RiskAssessmentView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Evaluate Ocean Risk",
        description="Calculates deterministic risk assessment and productive fishing zones for a port or coastal point.",
        parameters=[
            OpenApiParameter("port", type=str, required=False, description="Port slug (e.g. 'mumbai-in', 'rotterdam-nl')"),
            OpenApiParameter("lat", type=float, required=False, description="Latitude in decimal degrees"),
            OpenApiParameter("lon", type=float, required=False, description="Longitude in decimal degrees"),
            OpenApiParameter("from", type=str, description="Window start time (ISO 8601 UTC)"),
            OpenApiParameter("to", type=str, description="Window end time (ISO 8601 UTC)"),
            OpenApiParameter("vessel_class", type=str, description="small_craft or mechanised"),
        ],
        responses={200: RiskAssessmentSerializer},
    )
    def get(self, request):
        port_slug = request.query_params.get("port")
        lat = None
        lon = None
        resolved_port = None

        if port_slug:
            resolved_port = Port.objects.filter(slug__iexact=port_slug.strip()).first()
            if not resolved_port:
                resolved_port = Port.objects.filter(public_id__iexact=port_slug.strip()).first()

            if not resolved_port:
                raise DomainError(f"Port with slug '{port_slug}' not found.", code="port_not_found")

            lat = resolved_port.lat
            lon = resolved_port.lon
        else:
            lat_str = request.query_params.get("lat")
            lon_str = request.query_params.get("lon")

            if not lat_str or not lon_str:
                raise DomainError(
                    "Either 'port' or both 'lat' and 'lon' query parameters are required.",
                    code="missing_coordinates",
                )

            try:
                lat = float(lat_str)
                lon = float(lon_str)
            except ValueError:
                raise DomainError(
                    "Latitude and longitude must be valid floating point numbers.",
                    code="invalid_coordinates",
                )

        now = timezone.now()
        from_str = request.query_params.get("from")
        to_str = request.query_params.get("to")

        if from_str:
            try:
                valid_from = timezone.datetime.fromisoformat(from_str)
                if timezone.is_naive(valid_from):
                    valid_from = timezone.make_aware(valid_from, timezone.utc)
            except ValueError:
                raise DomainError("Invalid 'from' timestamp format. Use ISO 8601.", code="invalid_timestamp")
        else:
            valid_from = now

        if to_str:
            try:
                valid_to = timezone.datetime.fromisoformat(to_str)
                if timezone.is_naive(valid_to):
                    valid_to = timezone.make_aware(valid_to, timezone.utc)
            except ValueError:
                raise DomainError("Invalid 'to' timestamp format. Use ISO 8601.", code="invalid_timestamp")
        else:
            valid_to = valid_from + timedelta(hours=12)

        # Validate window length
        if valid_to <= valid_from:
            raise DomainError("'to' timestamp must be strictly after 'from'.", code="invalid_window")
        if (valid_to - valid_from).total_seconds() > 48 * 3600:
            raise DomainError("Forecast window cannot exceed 48 hours.", code="window_exceeded")

        # Vessel class
        vessel_class = request.query_params.get("vessel_class")
        if not vessel_class:
            if request.user and request.user.is_authenticated and request.user.default_vessel_class:
                vessel_class = request.user.default_vessel_class
            else:
                vessel_class = "small_craft"

        if vessel_class not in ("small_craft", "mechanised"):
            raise DomainError(
                "Invalid vessel class. Choose 'small_craft' or 'mechanised'.",
                code="invalid_vessel_class",
            )

        assessment = evaluate_and_record_risk(
            lat=lat,
            lon=lon,
            valid_from=valid_from,
            valid_to=valid_to,
            vessel_class=vessel_class,
            user=request.user,
            port_slug=resolved_port.slug if resolved_port else (port_slug or None),
        )

        serializer = RiskAssessmentSerializer(assessment)
        return Response(serializer.data, status=status.HTTP_200_OK)
