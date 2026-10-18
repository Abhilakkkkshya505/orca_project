"""URLs for locations app."""

from django.urls import path

from apps.locations.views import SavedLocationDetailView, SavedLocationListCreateView

urlpatterns = [
    path("", SavedLocationListCreateView.as_view(), name="locations-list-create"),
    path("<uuid:location_id>/", SavedLocationDetailView.as_view(), name="locations-detail"),
]
