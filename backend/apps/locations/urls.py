from django.urls import path
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class LocationsPlaceholder(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"results": []})


urlpatterns = [
    path("", LocationsPlaceholder.as_view(), name="locations-list"),
]
