from django.urls import path

from apps.geodata.views import AdvisoriesListView, AdvisoryDetailView

urlpatterns = [
    path("", AdvisoriesListView.as_view(), name="advisories-list"),
    path("<uuid:public_id>/", AdvisoryDetailView.as_view(), name="advisory-detail"),
]
