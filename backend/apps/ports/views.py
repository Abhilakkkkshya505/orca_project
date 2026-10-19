import math
import requests
from django.conf import settings
from django.core.cache import cache
from django.db.models import Case, Count, F, Q, Value, When
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import DomainError
from apps.ports.models import Port
from apps.ports.normalisation import (
    ALIAS_MAP,
    haversine_km,
    to_ascii,
)
from apps.ports.serializers import (
    NearbyPortSerializer,
    PortDetailSerializer,
    PortListSerializer,
)

# Try importing pg_trgm similarity from django
try:
    from django.contrib.postgres.search import TrigramSimilarity
    HAS_TRGM = True
except Exception:
    HAS_TRGM = False


class StandardPortPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class PortListView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="List Ports and Coastal Stations",
        description="Search, filter, and distance-sort worldwide ports and fishing harbours.",
        parameters=[
            OpenApiParameter("q", type=str, description="Fuzzy search by name, alternate name, or alias"),
            OpenApiParameter("country", type=str, description="ISO 3166-1 alpha-2 country code"),
            OpenApiParameter("state", type=str, description="Admin1 state or province name"),
            OpenApiParameter("type", type=str, description="commercial, fishing_harbour, minor, etc."),
            OpenApiParameter("coastal", type=bool, description="Filter coastal vs inland"),
            OpenApiParameter("near", type=str, description="lat,lon to calculate distances and sort"),
            OpenApiParameter("ordering", type=str, description="Sort field (name, -name, distance)"),
            OpenApiParameter("page", type=int, description="Page number"),
            OpenApiParameter("page_size", type=int, description="Items per page (max 100)"),
        ],
        responses={200: PortListSerializer(many=True)},
    )
    def get(self, request):
        qs = Port.objects.filter(is_active=True)

        # 1. Filters
        country = request.query_params.get("country")
        if country:
            qs = qs.filter(country_code__iexact=country.strip())

        state_param = request.query_params.get("state")
        if state_param:
            qs = qs.filter(admin1_name__icontains=state_param.strip())

        port_type = request.query_params.get("type")
        if port_type:
            qs = qs.filter(port_type__iexact=port_type.strip())

        coastal = request.query_params.get("coastal")
        if coastal is not None:
            is_c = coastal.lower() in ("true", "1", "yes")
            qs = qs.filter(is_coastal=is_c)

        # 2. Text Search with Typos and Aliases
        q = request.query_params.get("q", "").strip()
        if q:
            q_clean = to_ascii(q)
            # Find any known alias expansions
            aliases = [q_clean]
            for k, mapped in ALIAS_MAP.items():
                if k == q_clean or q_clean in k or k in q_clean:
                    aliases.extend([to_ascii(m) for m in mapped])

            q_filter = Q()
            for term in set(aliases):
                q_filter |= (
                    Q(name__icontains=term)
                    | Q(name_ascii__icontains=term)
                    | Q(slug__icontains=term)
                    | Q(alt_names__icontains=term)
                )

            sim_cases = []
            for term in set(aliases):
                sim_cases.append(When(name_ascii__iexact=term, then=Value(2.0)))
                sim_cases.append(When(slug__istartswith=f"{term}-", then=Value(1.8)))
                sim_cases.append(When(alt_names__icontains=term, then=Value(1.5)))
                sim_cases.append(When(name_ascii__icontains=term, then=Value(1.2)))

            # If pg_trgm is available on PostgreSQL, score by similarity
            from django.db import connection
            if HAS_TRGM and connection.vendor == "postgresql" and len(q_clean) >= 2:
                try:
                    sim_qs = (
                        qs.annotate(
                            alias_score=Case(*sim_cases, default=Value(0.0)),
                            similarity=TrigramSimilarity("name_ascii", q_clean),
                        )
                        .filter(Q(similarity__gt=0.18) | q_filter)
                        .order_by("-alias_score", "-similarity", "name")
                    )
                    qs = sim_qs
                except Exception:
                    qs = qs.annotate(alias_score=Case(*sim_cases, default=Value(0.0))).filter(q_filter).order_by("-alias_score", "name")
            else:
                import difflib
                fuzzy_ids = []
                if len(q_clean) >= 3:
                    for p in Port.objects.filter(is_active=True).only("id", "name_ascii", "alt_names"):
                        ratios = [difflib.SequenceMatcher(None, q_clean, p.name_ascii).ratio()]
                        for a in (p.alt_names or []):
                            ratios.append(difflib.SequenceMatcher(None, q_clean, to_ascii(a)).ratio())
                        if max(ratios) >= 0.65:
                            fuzzy_ids.append(p.id)

                fuzzy_filter = q_filter
                if fuzzy_ids:
                    fuzzy_filter = fuzzy_filter | Q(id__in=fuzzy_ids)

                qs = qs.annotate(alias_score=Case(*sim_cases, default=Value(0.0))).filter(fuzzy_filter).order_by("-alias_score", "name")

        # 3. Spatial Near Ordering
        near_param = request.query_params.get("near")
        user_coords = None
        if near_param:
            try:
                parts = [float(p.strip()) for p in near_param.split(",")]
                if len(parts) == 2:
                    user_coords = (parts[0], parts[1])
            except ValueError:
                raise DomainError("Invalid 'near' format. Expected 'lat,lon'.", code="invalid_near")

        ordering = request.query_params.get("ordering")
        if not user_coords and ordering in ("name", "-name", "country_code", "-country_code"):
            qs = qs.order_by(ordering)

        # If user supplied 'near', evaluate distance for each item
        if user_coords:
            u_lat, u_lon = user_coords
            ports_list = list(qs)
            for p in ports_list:
                p.distance_km = round(haversine_km(u_lat, u_lon, p.lat, p.lon), 2)
            ports_list.sort(key=lambda x: x.distance_km)

            paginator = StandardPortPagination()
            page = paginator.paginate_queryset(ports_list, request)
            serializer = PortListSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        paginator = StandardPortPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = PortListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class PortDetailView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Get Port Details",
        description="Retrieves comprehensive port metadata, sea point offset, and nearby stations.",
        responses={200: PortDetailSerializer},
    )
    def get(self, request, slug):
        port = Port.objects.filter(slug__iexact=slug).first()
        if not port:
            # Try finding by public_id UUID
            port = Port.objects.filter(public_id__iexact=slug).first()

        if not port:
            raise NotFound(f"Port with slug '{slug}' not found.")

        serializer = PortDetailSerializer(port)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PortNearestView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Find Nearest Ports",
        description="Returns closest ports to given coordinates with distance and bearing.",
        parameters=[
            OpenApiParameter("lat", type=float, required=True, description="Latitude"),
            OpenApiParameter("lon", type=float, required=True, description="Longitude"),
            OpenApiParameter("limit", type=int, description="Max results (default 5, max 50)"),
            OpenApiParameter("max_km", type=float, description="Max distance radius (default 200)"),
        ],
        responses={200: NearbyPortSerializer(many=True)},
    )
    def get(self, request):
        lat_str = request.query_params.get("lat")
        lon_str = request.query_params.get("lon")

        if not lat_str or not lon_str:
            raise DomainError("Both 'lat' and 'lon' query parameters are required.", code="missing_coordinates")

        try:
            lat = float(lat_str)
            lon = float(lon_str)
        except ValueError:
            raise DomainError("Coordinates must be valid numbers.", code="invalid_coordinates")

        try:
            limit = min(int(request.query_params.get("limit", 5)), 50)
            max_km = float(request.query_params.get("max_km", 200.0))
        except ValueError:
            limit = 5
            max_km = 200.0

        # Rough bounding box filter in degrees (~1 deg = 111 km)
        deg_radius = (max_km / 111.0) * 1.5
        candidates = Port.objects.filter(
            is_active=True,
            lat__gte=lat - deg_radius,
            lat__lte=lat + deg_radius,
            lon__gte=lon - deg_radius,
            lon__lte=lon + deg_radius,
        )

        results = []
        for p in candidates:
            dist = haversine_km(lat, lon, p.lat, p.lon)
            if dist <= max_km:
                bearing = p.bearing_to(lat, lon)
                results.append({
                    "id": p.public_id,
                    "slug": p.slug,
                    "name": p.name,
                    "country_code": p.country_code,
                    "admin1_name": p.admin1_name,
                    "lat": p.lat,
                    "lon": p.lon,
                    "distance_km": round(dist, 1),
                    "bearing": bearing,
                    "is_coastal": p.is_coastal,
                })

        # If candidates inside bounding box was empty, search full active ports
        if not results:
            for p in Port.objects.filter(is_active=True)[:500]:
                dist = haversine_km(lat, lon, p.lat, p.lon)
                bearing = p.bearing_to(lat, lon)
                results.append({
                    "id": p.public_id,
                    "slug": p.slug,
                    "name": p.name,
                    "country_code": p.country_code,
                    "admin1_name": p.admin1_name,
                    "lat": p.lat,
                    "lon": p.lon,
                    "distance_km": round(dist, 1),
                    "bearing": bearing,
                    "is_coastal": p.is_coastal,
                })

        results.sort(key=lambda x: x["distance_km"])
        results = results[:limit]

        serializer = NearbyPortSerializer(results, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PortCoverageView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Port Geographic Coverage",
        description="Returns counts of active ports by country and, for India, by coastal state.",
    )
    def get(self, request):
        cache_key = "orca:ports:coverage_counts"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached, status=status.HTTP_200_OK)

        country_counts = (
            Port.objects.filter(is_active=True)
            .values("country_code", "country_name")
            .annotate(port_count=Count("id"))
            .order_by("-port_count")
        )

        india_state_counts = (
            Port.objects.filter(country_code="IN", is_active=True)
            .values("admin1_name")
            .annotate(port_count=Count("id"))
            .order_by("-port_count")
        )

        total_ports = Port.objects.filter(is_active=True).count()
        total_coastal = Port.objects.filter(is_active=True, is_coastal=True).count()

        data = {
            "total_ports": total_ports,
            "total_coastal_ports": total_coastal,
            "by_country": list(country_counts),
            "india_by_state": list(india_state_counts),
        }
        cache.set(cache_key, data, timeout=3600)  # 1 hour cache
        return Response(data, status=status.HTTP_200_OK)


class GeocodeView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Geocode Coastal Places",
        description="Resolves placenames, bays, and islands via Open-Meteo geocoding API with 24h cache.",
        parameters=[
            OpenApiParameter("q", type=str, required=True, description="Query string e.g. Lakshadweep, Malpe"),
        ],
    )
    def get(self, request):
        q = request.query_params.get("q", "").strip()
        if not q or len(q) < 2:
            return Response({"results": []}, status=status.HTTP_200_OK)

        cache_key = f"orca:geocode:{to_ascii(q)}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response({"results": cached}, status=status.HTTP_200_OK)

        url = "https://geocoding-api.open-meteo.com/v1/search"
        params = {"name": q, "count": 10, "language": "en", "format": "json"}

        try:
            resp = requests.get(
                url,
                params=params,
                headers={"User-Agent": "ORCA-Geocode/1.0"},
                timeout=5.0,
            )
            if resp.status_code == 200:
                data = resp.json().get("results", [])
                results = []
                for item in data:
                    results.append({
                        "name": item.get("name"),
                        "lat": item.get("latitude"),
                        "lon": item.get("longitude"),
                        "country": item.get("country"),
                        "country_code": item.get("country_code"),
                        "admin1": item.get("admin1"),
                        "timezone": item.get("timezone"),
                    })
                cache.set(cache_key, results, timeout=86400)  # 24 hours
                return Response({"results": results}, status=status.HTTP_200_OK)
        except Exception as e:
            logger_err = str(e)

        return Response({"results": []}, status=status.HTTP_200_OK)
