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
