import pytest
from django.urls import reverse
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestCoreEndpoints:
    def setup_method(self):
        self.client = APIClient()

    def test_health_live(self):
        url = reverse("health-live")
        response = self.client.get(url)
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    def test_health_ready(self):
        url = reverse("health-ready")
        response = self.client.get(url)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["checks"]["db"] == "ok"
        assert data["checks"]["redis"] == "ok"

    def test_data_status(self):
        url = reverse("data-status")
        response = self.client.get(url)
        assert response.status_code == 200
        data = response.json()
        assert "sources" in data
        assert isinstance(data["sources"], list)

    def test_csrf_endpoint(self):
        url = reverse("auth-csrf")
        response = self.client.get(url)
        assert response.status_code == 204
        assert "csrftoken" in response.cookies

    def test_request_id_header(self):
        url = reverse("health-live")
        response = self.client.get(url, HTTP_CF_RAY="test-cf-ray-12345")
        assert response.status_code == 200
        assert response.headers.get("X-Request-ID") == "test-cf-ray-12345"

    def test_json_404_handler(self):
        response = self.client.get("/api/v1/nonexistent-route/")
        assert response.status_code == 404
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "not_found"
        assert "request_id" in data["error"]
