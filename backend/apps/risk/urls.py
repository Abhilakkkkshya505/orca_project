from django.urls import path
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class RiskPlaceholder(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"status": "placeholder"})


urlpatterns = [
    path("", RiskPlaceholder.as_view(), name="risk-assessment"),
]
