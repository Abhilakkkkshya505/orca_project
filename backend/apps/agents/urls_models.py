"""URL routing for Model Registry and Model Cards."""

from django.urls import path
from apps.agents.views_models import ModelListView, ModelCardView

urlpatterns = [
    path("", ModelListView.as_view(), name="model-list"),
    path("<str:model_id>/card/", ModelCardView.as_view(), name="model-card"),
]
