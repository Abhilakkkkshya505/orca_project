"""URLs for alert subscriptions."""

from django.urls import path

from apps.locations.views import AlertSubscriptionDetailView, AlertSubscriptionListCreateView

urlpatterns = [
    path("subscriptions/", AlertSubscriptionListCreateView.as_view(), name="alert-subscriptions-list-create"),
    path("subscriptions/<uuid:sub_id>/", AlertSubscriptionDetailView.as_view(), name="alert-subscriptions-detail"),
]
