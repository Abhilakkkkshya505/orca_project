"""Views for locations and alert subscriptions."""

import uuid

from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsVerifiedUser
from apps.locations.models import AlertSubscription, SavedLocation
from apps.locations.serializers import AlertSubscriptionSerializer, SavedLocationSerializer


class SavedLocationListCreateView(APIView):
    """
    GET /locations/: List user saved locations.
    POST /locations/: Create saved location (up to 20).
    """

    permission_classes = [IsAuthenticated, IsVerifiedUser]
    serializer_class = SavedLocationSerializer

    def get(self, request):
        locations = SavedLocation.objects.filter(user=request.user).order_by("name")
        serializer = SavedLocationSerializer(locations, many=True, context={"request": request})
        return Response({"results": serializer.data, "count": locations.count()})

    def post(self, request):
        serializer = SavedLocationSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        loc = serializer.save()
        return Response(
            SavedLocationSerializer(loc, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class SavedLocationDetailView(APIView):
    """
    GET /locations/{id}/: Retrieve location.
    PATCH /locations/{id}/: Update location.
    DELETE /locations/{id}/: Delete location.
    """

    permission_classes = [IsAuthenticated, IsVerifiedUser]
    serializer_class = SavedLocationSerializer

    def _get_object(self, request, location_id: str) -> SavedLocation:
        try:
            uuid_obj = uuid.UUID(str(location_id))
        except (ValueError, TypeError):
            raise NotFound(detail="Location not found.")
        try:
            return SavedLocation.objects.get(public_id=uuid_obj, user=request.user)
        except SavedLocation.DoesNotExist:
            raise NotFound(detail="Location not found.")

    def get(self, request, location_id):
        location = self._get_object(request, location_id)
        return Response(SavedLocationSerializer(location, context={"request": request}).data)

    def patch(self, request, location_id):
        location = self._get_object(request, location_id)
        serializer = SavedLocationSerializer(
            location,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, location_id):
        location = self._get_object(request, location_id)
        location.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AlertSubscriptionListCreateView(APIView):
    """
    GET /alerts/subscriptions/: List subscriptions.
    POST /alerts/subscriptions/: Subscribe to alerts for location.
    """

    permission_classes = [IsAuthenticated, IsVerifiedUser]
    serializer_class = AlertSubscriptionSerializer

    def get(self, request):
        subs = AlertSubscription.objects.filter(user=request.user).select_related("location").order_by("-created_at")
        serializer = AlertSubscriptionSerializer(subs, many=True, context={"request": request})
        return Response({"results": serializer.data, "count": subs.count()})

    def post(self, request):
        serializer = AlertSubscriptionSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        sub = serializer.save()
        return Response(
            AlertSubscriptionSerializer(sub, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class AlertSubscriptionDetailView(APIView):
    """
    PATCH /alerts/subscriptions/{id}/: Update subscription min_level or is_active.
    DELETE /alerts/subscriptions/{id}/: Unsubscribe.
    """

    permission_classes = [IsAuthenticated, IsVerifiedUser]
    serializer_class = AlertSubscriptionSerializer

    def _get_object(self, request, sub_id: str) -> AlertSubscription:
        try:
            uuid_obj = uuid.UUID(str(sub_id))
        except (ValueError, TypeError):
            raise NotFound(detail="Alert subscription not found.")
        try:
            return AlertSubscription.objects.get(public_id=uuid_obj, user=request.user)
        except AlertSubscription.DoesNotExist:
            raise NotFound(detail="Alert subscription not found.")

    def patch(self, request, sub_id):
        sub = self._get_object(request, sub_id)
        serializer = AlertSubscriptionSerializer(
            sub,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, sub_id):
        sub = self._get_object(request, sub_id)
        sub.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
