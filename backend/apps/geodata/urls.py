from django.urls import path

from apps.geodata.views import AdvisoriesListView, AdvisoryDetailView, MarineTelemetryView

urlpatterns = [
    path("", AdvisoriesListView.as_view(), name="advisories-list"),
    path("marine/", MarineTelemetryView.as_view(), name="marine-telemetry"),
    path("<uuid:public_id>/", AdvisoryDetailView.as_view(), name="advisory-detail"),
]

