from django.urls import path

from apps.accounts.views import ProfileView

urlpatterns = [
    path("", ProfileView.as_view(), name="profile"),
]
