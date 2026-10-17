from django.urls import path
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class ChatPlaceholder(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"threads": []})


urlpatterns = [
    path("threads/", ChatPlaceholder.as_view(), name="chat-threads"),
]
