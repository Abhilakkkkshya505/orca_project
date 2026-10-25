from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.pagination import StandardPageNumberPagination
from apps.geodata.models import Advisory
from apps.geodata.serializers import AdvisoryDetailSerializer, AdvisoryListSerializer
from apps.geodata.services import get_advisories_queryset


class AdvisoriesListView(APIView):
    permission_classes = [AllowAny]
    pagination_class = StandardPageNumberPagination

    @extend_schema(
        summary="List Official Marine Advisories",
        description="Returns paginated list of official marine weather and ocean state warnings with server-side filtering.",
        parameters=[
            OpenApiParameter("active", type=bool, description="Return unexpired advisories only (default true)"),
            OpenApiParameter("severity", type=str, description="Filter by severity (info, watch, warning, severe)"),
            OpenApiParameter("q", type=str, description="Search term in headline"),
            OpenApiParameter("ordering", type=str, description="Sort order (-issued_at, expires_at, etc.)"),
            OpenApiParameter("page", type=int, description="Page number"),
            OpenApiParameter("page_size", type=int, description="Page size"),
        ],
        responses={200: AdvisoryListSerializer(many=True)},
    )
    def get(self, request):
        active_param = request.query_params.get("active", "true").lower() != "false"
        severity = request.query_params.get("severity")
        source = request.query_params.get("source")
        search = request.query_params.get("q")
        ordering = request.query_params.get("ordering", "-issued_at")

        near_coords = None
        near_param = request.query_params.get("near")
        if near_param:
            try:
                parts = near_param.split(",")
                near_coords = (float(parts[0].strip()), float(parts[1].strip()))
            except (ValueError, IndexError):
                near_coords = None

        qs = get_advisories_queryset(
            active_only=active_param,
            severity=severity,
            search=search,
            ordering=ordering,
            near=near_coords,
            source_slug=source,
        )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = AdvisoryListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class AdvisoryDetailView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Advisory Details",
        description="Returns full advisory narrative and geographical bounding box.",
        responses={200: AdvisoryDetailSerializer},
    )
    def get(self, request, public_id):
        advisory = get_object_or_404(Advisory.objects.select_related("source"), public_id=public_id)
        serializer = AdvisoryDetailSerializer(advisory)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MarineTelemetryView(APIView):
    """
    Direct Open-Meteo marine wave and swell telemetry endpoint.
    Accepts latitude and longitude or port slug, and returns 7-day hourly oceanographic data.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Live Open-Meteo Marine Telemetry",
        description="Returns live 7-day hourly ocean wave, swell, and sea-level telemetry directly from Open-Meteo API.",
        parameters=[
            OpenApiParameter("latitude", type=float, description="Latitude (e.g. 54.544587)"),
            OpenApiParameter("longitude", type=float, description="Longitude (e.g. 10.227487)"),
            OpenApiParameter("port", type=str, description="Port slug (e.g. kochi-in, mumbai-in)"),
            OpenApiParameter("forecast_days", type=int, description="Forecast days (1 to 7, default 7)"),
        ],
    )
    def get(self, request):
        from apps.geodata.marine_service import fetch_openmeteo_marine_telemetry
        from apps.ports.models import Port

        port_slug = request.query_params.get("port")
        lat = request.query_params.get("latitude")
        lon = request.query_params.get("longitude")
        forecast_days = int(request.query_params.get("forecast_days", 7))

        port_meta = None
        if port_slug:
            try:
                p = Port.objects.get(slug=port_slug)
                m_lat = getattr(p, "marine_lat", None)
                m_lon = getattr(p, "marine_lon", None)
                lat = float(m_lat if m_lat is not None else p.lat)
                lon = float(m_lon if m_lon is not None else p.lon)
                port_meta = {
                    "slug": p.slug,
                    "name": p.name,
                    "country": p.country_name,
                    "port_type": p.port_type,
                    "is_coastal": p.is_coastal,
                    "lat": float(p.lat),
                    "lon": float(p.lon),
                }
            except Port.DoesNotExist:
                return Response({"error": f"Port '{port_slug}' not found"}, status=status.HTTP_404_NOT_FOUND)

        elif lat is not None and lon is not None:
            try:
                lat = float(lat)
                lon = float(lon)
            except ValueError:
                return Response({"error": "Invalid latitude or longitude"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Default to user's example: Baltic Sea (54.544587, 10.227487)
            lat = 54.544587
            lon = 10.227487

        try:
            data = fetch_openmeteo_marine_telemetry(lat=lat, lon=lon, forecast_days=forecast_days)
            if port_meta:
                data["port"] = port_meta
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Telemetry fetch failed: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)

