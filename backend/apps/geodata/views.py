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
        from apps.ports.snapping import snap_port_coordinate

        port_slug = request.query_params.get("port")
        lat = request.query_params.get("latitude")
        lon = request.query_params.get("longitude")
        forecast_days = int(request.query_params.get("forecast_days", 7))

        port_meta = None
        if port_slug:
            slug_clean = port_slug.strip().lower().rstrip("/")
            p = (
                Port.objects.filter(slug=slug_clean).first()
                or Port.objects.filter(slug__iexact=slug_clean).first()
                or Port.objects.filter(slug__istartswith=slug_clean).first()
                or Port.objects.filter(name__icontains=slug_clean).first()
            )
            if not p:
                FALLBACK_PORTS = {
                    "kochi": (9.9656, 76.2711, "Kochi Port", "India"),
                    "cochin": (9.9656, 76.2711, "Kochi Port", "India"),
                    "mumbai": (18.93, 72.84, "Mumbai Harbour", "India"),
                    "chennai": (13.08, 80.28, "Chennai Port", "India"),
                    "vizag": (17.68, 83.22, "Visakhapatnam Port", "India"),
                    "visakhapatnam": (17.68, 83.22, "Visakhapatnam Port", "India"),
                    "paradip": (20.316, 86.611, "Paradip Port", "India"),
                    "kandla": (23.003, 70.219, "Kandla Port", "India"),
                    "kolkata": (22.572, 88.363, "Kolkata Port", "India"),
                    "mangalore": (12.914, 74.856, "New Mangalore Port", "India"),
                    "tuticorin": (8.764, 78.134, "V.O. Chidambaranar Port", "India"),
                    "mormugao": (15.416, 73.800, "Mormugao Port", "India"),
                    "goa": (15.416, 73.800, "Mormugao Port", "India"),
                }
                matched_key = next((k for k in FALLBACK_PORTS if k in slug_clean or slug_clean in k), None)
                if matched_key:
                    f_lat, f_lon, f_name, f_country = FALLBACK_PORTS[matched_key]
                    lat, lon = f_lat, f_lon
                    port_meta = {
                        "slug": slug_clean,
                        "name": f_name,
                        "country": f_country,
                        "port_type": "commercial",
                        "is_coastal": True,
                        "lat": f_lat,
                        "lon": f_lon,
                    }
                else:
                    return Response({"error": f"Port '{port_slug}' not found"}, status=status.HTTP_404_NOT_FOUND)
            else:
                m_lat = getattr(p, "marine_lat", None)
                m_lon = getattr(p, "marine_lon", None)
                if m_lat is not None and m_lon is not None:
                    lat = float(m_lat)
                    lon = float(m_lon)
                else:
                    m_lat, m_lon, _, _ = snap_port_coordinate(float(p.lat), float(p.lon))
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

        elif lat is not None and lon is not None:
            try:
                lat = float(lat)
                lon = float(lon)
            except ValueError:
                return Response({"error": "Invalid latitude or longitude"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Default to Kochi marine coordinates if neither is specified
            lat = 9.9667
            lon = 76.2333

        try:
            data = fetch_openmeteo_marine_telemetry(lat=lat, lon=lon, forecast_days=forecast_days)
            # If coordinates were slightly on land and returned null waves, try snapping to ocean
            if data and data.get("current") and data["current"].get("wave_height_m") is None:
                m_lat, m_lon, _, _ = snap_port_coordinate(lat, lon)
                if m_lat is not None and m_lon is not None and (m_lat != lat or m_lon != lon):
                    snapped_data = fetch_openmeteo_marine_telemetry(lat=m_lat, lon=m_lon, forecast_days=forecast_days)
                    if snapped_data and snapped_data.get("current") and snapped_data["current"].get("wave_height_m") is not None:
                        data = snapped_data

            if port_meta:
                data["port"] = port_meta
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Telemetry fetch failed: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)

