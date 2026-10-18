from django.urls import path

from apps.risk.views import RiskAssessmentView

urlpatterns = [
    path("", RiskAssessmentView.as_view(), name="risk-assessment"),
]
