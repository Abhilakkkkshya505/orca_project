from django.urls import path
from apps.ports.views import (
    GeocodeView,
    PortCoverageView,
    PortDetailView,
    PortListView,
    PortNearestView,
)

app_name = "ports"

urlpatterns = [
    path("ports/", PortListView.as_view(), name="port-list"),
    path("ports/nearest/", PortNearestView.as_view(), name="port-nearest"),
    path("ports/coverage/", PortCoverageView.as_view(), name="port-coverage"),
    path("ports/<slug:slug>/", PortDetailView.as_view(), name="port-detail"),
    path("geocode/", GeocodeView.as_view(), name="geocode"),
]
