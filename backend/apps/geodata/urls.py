from django.urls import path
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class AdvisoriesPlaceholder(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"count": 0, "results": []})


urlpatterns = [
    path("", AdvisoriesPlaceholder.as_view(), name="advisories-list"),
]
