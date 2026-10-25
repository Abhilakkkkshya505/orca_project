from django.urls import path
from apps.geodata.views import MarineTelemetryView

urlpatterns = [
    path("", MarineTelemetryView.as_view(), name="marine-telemetry-direct"),
]
