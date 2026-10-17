from django.urls import path
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class DashboardPlaceholder(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"saved_locations": [], "active_advisories_count": 0})


urlpatterns = [
    path("overview/", DashboardPlaceholder.as_view(), name="dashboard-overview"),
]
