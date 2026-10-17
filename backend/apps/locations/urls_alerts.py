from django.urls import path
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class AlertsPlaceholder(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"results": []})


urlpatterns = [
    path("subscriptions/", AlertsPlaceholder.as_view(), name="alerts-subscriptions"),
]
