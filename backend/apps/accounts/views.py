from django.contrib.auth import logout
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsVerified
from apps.accounts.serializers import (
    DeleteAccountSerializer,
    LoginSerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    ProfileUpdateSerializer,
    ResendVerificationSerializer,
    SignupSerializer,
    UserSerializer,
    VerifyEmailSerializer,
)
from apps.accounts.services import (
    change_password,
    confirm_password_reset,
    delete_user_account,
    login_user,
    register_user,
    request_password_reset,
    resend_verification,
    verify_email,
)
from apps.accounts.throttles import AuthIpThrottle, LoginEmailThrottle


class SignupView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthIpThrottle]

    @extend_schema(
        summary="User Registration",
        description="Registers a new user account with Turnstile verification. Always returns 201 anti-enumeration response.",
        request=SignupSerializer,
        responses={201: dict},
    )
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ip = getattr(request, "client_ip", request.META.get("REMOTE_ADDR"))
        result = register_user(serializer.validated_data, ip=ip)
        return Response(result, status=status.HTTP_201_CREATED)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthIpThrottle]

    @extend_schema(
        summary="Verify Email Address",
        description="Validates a timestamped verification token.",
        request=VerifyEmailSerializer,
        responses={200: dict},
    )
    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = verify_email(serializer.validated_data["token"])
        return Response(result, status=status.HTTP_200_OK)


class ResendVerificationView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthIpThrottle]

    @extend_schema(
        summary="Resend Email Verification",
        description="Resends verification email with anti-enumeration protection.",
        request=ResendVerificationSerializer,
        responses={200: dict},
    )
    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ip = getattr(request, "client_ip", request.META.get("REMOTE_ADDR"))
        result = resend_verification(
            serializer.validated_data["email"],
            serializer.validated_data["turnstile_token"],
            ip=ip,
        )
        return Response(result, status=status.HTTP_200_OK)


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthIpThrottle, LoginEmailThrottle]

    @extend_schema(
        summary="User Login",
        description="Authenticates user with session cookie and optional guest-thread claiming.",
        request=LoginSerializer,
        responses={200: UserSerializer},
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ip = getattr(request, "client_ip", request.META.get("REMOTE_ADDR"))
        user = login_user(request, serializer.validated_data, ip=ip)
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="User Logout",
        description="Flushes the current session cookie.",
        responses={204: None},
    )
    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Current Authenticated User",
        description="Returns the profile of the currently logged-in user.",
        responses={200: UserSerializer},
    )
    def get(self, request):
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthIpThrottle]

    @extend_schema(
        summary="Request Password Reset",
        description="Triggers password reset email with anti-enumeration protection.",
        request=PasswordResetRequestSerializer,
        responses={200: dict},
    )
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ip = getattr(request, "client_ip", request.META.get("REMOTE_ADDR"))
        result = request_password_reset(
            serializer.validated_data["email"],
            serializer.validated_data["turnstile_token"],
            ip=ip,
        )
        return Response(result, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthIpThrottle]

    @extend_schema(
        summary="Confirm Password Reset",
        description="Resets the password and revokes all active user sessions.",
        request=PasswordResetConfirmSerializer,
        responses={200: dict},
    )
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = confirm_password_reset(serializer.validated_data)
        return Response(result, status=status.HTTP_200_OK)


class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated, IsVerified]

    @extend_schema(
        summary="Change Password",
        description="Updates password for authenticated and verified user.",
        request=PasswordChangeSerializer,
        responses={200: dict},
    )
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = change_password(
            request.user,
            serializer.validated_data["current_password"],
            serializer.validated_data["new_password"],
            request,
        )
        return Response(result, status=status.HTTP_200_OK)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated, IsVerified]

    @extend_schema(
        summary="Update Profile",
        description="Updates user display name, preferred units, or vessel class.",
        request=ProfileUpdateSerializer,
        responses={200: UserSerializer},
    )
    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Delete Account",
        description="Permanently deletes the user account and associated personal data.",
        request=DeleteAccountSerializer,
        responses={204: None},
    )
    def delete(self, request):
        serializer = DeleteAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        delete_user_account(request.user, serializer.validated_data["password"], request)
        return Response(status=status.HTTP_204_NO_CONTENT)
