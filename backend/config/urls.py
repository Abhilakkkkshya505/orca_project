"""
URL configuration for ORCA project.
"""

from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.core.views import CsrfView, DataStatusView, HealthLiveView, HealthReadyView

api_v1_patterns = [
    # Health and Status
    path("health/live/", HealthLiveView.as_view(), name="health-live"),
    path("health/ready/", HealthReadyView.as_view(), name="health-ready"),
    path("data-status/", DataStatusView.as_view(), name="data-status"),
    path("auth/csrf/", CsrfView.as_view(), name="auth-csrf"),
    # Auth & Profile
    path("auth/", include("apps.accounts.urls")),
    path("me/", include("apps.accounts.urls_me")),
    # Geodata & Advisories
    path("advisories/", include("apps.geodata.urls")),
    # Risk Engine
    path("risk/", include("apps.risk.urls")),
    # Chat & SSE Streaming
    path("chat/", include("apps.chat.urls")),
    # Locations & Alerts
    path("locations/", include("apps.locations.urls")),
    path("alerts/", include("apps.locations.urls_alerts")),
    # Dashboard
    path("dashboard/", include("apps.dashboard.urls")),
    # OpenAPI Schema & Docs
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(api_v1_patterns)),
]

handler404 = "apps.core.views.handler404_view"
handler500 = "apps.core.views.handler500_view"
