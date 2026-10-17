import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.tokens import generate_email_verification_token, generate_password_reset_token

User = get_user_model()


@pytest.mark.django_db
class TestAuthenticationFlows:
    def setup_method(self):
        from django.core.cache import cache

        cache.clear()
        self.client = APIClient()
        self.valid_turnstile = "1x00000000000000000000AA"
        self.failing_turnstile = "2x00000000000000000000AB"

    def test_signup_anti_enumeration(self):
        """Signup returns identical 201 response whether email exists or not."""
        url = reverse("auth-signup")
        payload = {
            "email": "fisherman1@orca.example",
            "display_name": "Ramesh",
            "password": "StrongPassword123!",
            "turnstile_token": self.valid_turnstile,
        }

        # First signup -> creates user
        res1 = self.client.post(url, payload, format="json")
        assert res1.status_code == 201
        assert res1.json() == {"detail": "Check your email to verify your account."}

        user = User.objects.get(email="fisherman1@orca.example")
        assert user.is_email_verified is False

        # Second signup with same email -> identical response, no duplicate created
        res2 = self.client.post(url, payload, format="json")
        assert res2.status_code == 201
        assert res2.json() == {"detail": "Check your email to verify your account."}
        assert User.objects.filter(email="fisherman1@orca.example").count() == 1

    def test_turnstile_fail_blocks_signup(self):
        url = reverse("auth-signup")
        payload = {
            "email": "bot@orca.example",
            "display_name": "Bot",
            "password": "StrongPassword123!",
            "turnstile_token": self.failing_turnstile,
        }
        res = self.client.post(url, payload, format="json")
        assert res.status_code == 400
        assert res.json()["error"]["code"] == "turnstile_failed"

    def test_email_verification_flow(self):
        user = User.objects.create_user(
            email="arun@orca.example",
            password="StrongPassword123!",
            display_name="Arun",
            is_email_verified=False,
        )
        token = generate_email_verification_token(user)

        url = reverse("auth-verify-email")
        res = self.client.post(url, {"token": token}, format="json")
        assert res.status_code == 200
        assert res.json() == {"detail": "Email verified."}

        user.refresh_from_db()
        assert user.is_email_verified is True

    def test_login_unverified_user_returns_403(self):
        User.objects.create_user(
            email="unverified@orca.example",
            password="StrongPassword123!",
            display_name="Unverified",
            is_email_verified=False,
        )
        url = reverse("auth-login")
        res = self.client.post(
            url,
            {
                "email": "unverified@orca.example",
                "password": "StrongPassword123!",
                "turnstile_token": self.valid_turnstile,
            },
            format="json",
        )

        assert res.status_code == 403
        assert res.json()["error"]["code"] == "email_not_verified"

    def test_login_success_and_session_rotation(self):
        User.objects.create_user(
            email="verified@orca.example",
            password="StrongPassword123!",
            display_name="Captain Mohan",
            is_email_verified=True,
        )

        url = reverse("auth-login")
        res = self.client.post(
            url,
            {
                "email": "verified@orca.example",
                "password": "StrongPassword123!",
                "turnstile_token": self.valid_turnstile,
            },
            format="json",
        )

        assert res.status_code == 200
        data = res.json()
        assert data["email"] == "verified@orca.example"
        assert data["display_name"] == "Captain Mohan"
        assert "sessionid" in self.client.cookies

        # Check me endpoint
        me_res = self.client.get(reverse("auth-me"))
        assert me_res.status_code == 200
        assert me_res.json()["email"] == "verified@orca.example"

        # Logout
        logout_res = self.client.post(reverse("auth-logout"))
        assert logout_res.status_code == 204

        # Me endpoint now 401
        me_after = self.client.get(reverse("auth-me"))
        assert me_after.status_code == 401

    def test_login_invalid_credentials(self):
        url = reverse("auth-login")
        res = self.client.post(
            url,
            {
                "email": "nonexistent@orca.example",
                "password": "WrongPassword123!",
                "turnstile_token": self.valid_turnstile,
            },
            format="json",
        )
        assert res.status_code == 400
        assert res.json()["error"]["code"] == "invalid_credentials"

    def test_password_reset_flow(self):
        user = User.objects.create_user(
            email="resetme@orca.example",
            password="OldPassword123!",
            display_name="ResetUser",
            is_email_verified=True,
        )

        # 1. Request reset
        req_url = reverse("auth-password-reset")
        req_res = self.client.post(
            req_url,
            {
                "email": "resetme@orca.example",
                "turnstile_token": self.valid_turnstile,
            },
            format="json",
        )
        assert req_res.status_code == 200

        # 2. Confirm reset
        uid, token = generate_password_reset_token(user)
        conf_url = reverse("auth-password-reset-confirm")
        conf_res = self.client.post(
            conf_url,
            {
                "uid": uid,
                "token": token,
                "new_password": "NewStrongPassword456!",
            },
            format="json",
        )
        assert conf_res.status_code == 200

        # 3. Old password fails, new password succeeds
        login_old = self.client.post(
            reverse("auth-login"),
            {
                "email": "resetme@orca.example",
                "password": "OldPassword123!",
                "turnstile_token": self.valid_turnstile,
            },
            format="json",
        )
        assert login_old.status_code == 400

        login_new = self.client.post(
            reverse("auth-login"),
            {
                "email": "resetme@orca.example",
                "password": "NewStrongPassword456!",
                "turnstile_token": self.valid_turnstile,
            },
            format="json",
        )
        assert login_new.status_code == 200
