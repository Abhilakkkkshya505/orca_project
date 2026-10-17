import structlog
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login, update_session_auth_hash
from django.contrib.sessions.models import Session
from django.core.mail import send_mail
from django.db import transaction

from apps.accounts.tokens import (
    generate_email_verification_token,
    generate_password_reset_token,
    verify_email_verification_token,
    verify_password_reset_token,
)
from apps.accounts.turnstile import verify_turnstile
from apps.core.exceptions import DomainError, EmailNotVerified

logger = structlog.get_logger(__name__)
User = get_user_model()


def register_user(validated_data: dict, ip: str | None = None) -> dict:
    """
    Registers a new user and sends verification email.
    Follows anti-enumeration rules: returns identical 201 message even if email exists.
    """
    email = validated_data["email"].lower().strip()
    turnstile_token = validated_data["turnstile_token"]
    verify_turnstile(turnstile_token, ip=ip)

    existing_user = User.objects.filter(email=email).first()
    if existing_user:
        # Anti-enumeration: Send account exists notification email instead of failing API call
        logger.info("signup_duplicate_email_prevented", email_domain=email.split("@")[-1])
        try:
            send_mail(
                subject="ORCA Account Notice",
                message=(
                    f"Hello,\n\nAn account with email {email} already exists on ORCA.\n"
                    "If you forgot your password, please use the reset password option.\n"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=True,
            )
        except Exception as e:
            logger.warning("email_send_failed", error=str(e))

        return {"detail": "Check your email to verify your account."}

    with transaction.atomic():
        user = User.objects.create_user(
            email=email,
            password=validated_data["password"],
            display_name=validated_data["display_name"],
            is_email_verified=False,
        )

        token = generate_email_verification_token(user)
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"

        try:
            send_mail(
                subject="Verify your ORCA Account",
                message=(
                    f"Welcome to ORCA, {user.display_name}!\n\n"
                    f"Please verify your email by clicking the link below:\n{verification_url}\n\n"
                    "This link is valid for 24 hours."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=True,
            )
        except Exception as e:
            logger.warning("verification_email_send_failed", error=str(e))

        logger.info("user_registered", user_id=str(user.public_id))

    return {"detail": "Check your email to verify your account."}


def verify_email(token: str) -> dict:
    """Verifies a user's email address using a signed timestamp token."""
    user = verify_email_verification_token(token)
    if not user.is_email_verified:
        user.is_email_verified = True
        user.save(update_fields=["is_email_verified", "updated_at"])
        logger.info("email_verified", user_id=str(user.public_id))
    return {"detail": "Email verified."}


def resend_verification(email: str, turnstile_token: str, ip: str | None = None) -> dict:
    """Resends verification email. Anti-enumeration: returns identical message regardless."""
    verify_turnstile(turnstile_token, ip=ip)
    email = email.lower().strip()
    user = User.objects.filter(email=email).first()

    if user and not user.is_email_verified:
        token = generate_email_verification_token(user)
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        try:
            send_mail(
                subject="Verify your ORCA Account",
                message=(
                    f"Hello {user.display_name},\n\n"
                    f"Here is your new verification link:\n{verification_url}\n\n"
                    "This link is valid for 24 hours."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=True,
            )
        except Exception as e:
            logger.warning("resend_email_failed", error=str(e))

    return {"detail": "If an unverified account exists with this email, a verification link has been sent."}


def login_user(request, validated_data: dict, ip: str | None = None):
    """
    Authenticates user, verifies Turnstile, enforces verified email,
    rotates session key, and optionally claims guest threads.
    """
    email = validated_data["email"].lower().strip()
    password = validated_data["password"]
    turnstile_token = validated_data["turnstile_token"]
    claim_guest_threads = validated_data.get("claim_guest_threads", False)

    verify_turnstile(turnstile_token, ip=ip)

    user = authenticate(request, email=email, password=password)
    if user is None:
        logger.warning("login_failed_invalid_credentials", ip=ip)
        raise DomainError("Invalid email or password.", code="invalid_credentials", status_code=400)

    if not user.is_active:
        logger.warning("login_inactive_user", user_id=str(user.public_id))
        raise DomainError("This account has been deactivated.", code="account_inactive", status_code=403)

    if not user.is_email_verified:
        logger.warning("login_unverified_email", user_id=str(user.public_id))
        raise EmailNotVerified("Your email address has not been verified.")

    # Record guest session before login key rotation if claiming threads
    guest_session_key = request.session.session_key

    # Django login rotates session key to prevent session fixation attacks
    login(request, user)

    # Claim guest chat threads if requested
    if claim_guest_threads and guest_session_key:
        try:
            from apps.chat.models import Thread

            Thread.objects.filter(session_key=guest_session_key, user__isnull=True).update(user=user)
        except Exception as e:
            logger.warning("claim_guest_threads_failed", error=str(e))

    logger.info("login_success", user_id=str(user.public_id))
    return user


def request_password_reset(email: str, turnstile_token: str, ip: str | None = None) -> dict:
    """Initiates password reset flow with anti-enumeration protection."""
    verify_turnstile(turnstile_token, ip=ip)
    email = email.lower().strip()
    user = User.objects.filter(email=email, is_active=True).first()

    if user:
        uid, token = generate_password_reset_token(user)
        reset_url = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
        try:
            send_mail(
                subject="Reset your ORCA Password",
                message=(
                    f"Hello {user.display_name},\n\n"
                    "You requested to reset your ORCA password.\n"
                    f"Click the link below to set a new password:\n{reset_url}\n\n"
                    "This link is valid for 1 hour. If you did not make this request, ignore this email."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=True,
            )
        except Exception as e:
            logger.warning("password_reset_email_failed", error=str(e))

    return {"detail": "If an active account exists with this email, password reset instructions have been sent."}


def confirm_password_reset(validated_data: dict) -> dict:
    """Verifies reset token, sets new password, marks email verified, and invalidates other sessions."""
    uid = validated_data["uid"]
    token = validated_data["token"]
    new_password = validated_data["new_password"]

    user = verify_password_reset_token(uid, token)

    with transaction.atomic():
        user.set_password(new_password)
        # Reset proves inbox ownership
        user.is_email_verified = True
        user.save(update_fields=["password", "is_email_verified", "updated_at"])

        # Invalidate all existing sessions for this user
        for s in Session.objects.iterator():
            data = s.get_decoded()
            if data.get("_auth_user_id") == str(user.pk):
                s.delete()

    logger.info("password_reset_confirmed", user_id=str(user.public_id))
    return {"detail": "Password has been reset successfully. Please log in with your new password."}


def change_password(user, current_password: str, new_password: str, request) -> dict:
    """Changes password for an authenticated user and preserves current session."""
    if not user.check_password(current_password):
        raise DomainError("Current password is incorrect.", code="invalid_credentials", status_code=400)

    user.set_password(new_password)
    user.save(update_fields=["password", "updated_at"])
    update_session_auth_hash(request, user)

    logger.info("password_changed", user_id=str(user.public_id))
    return {"detail": "Password updated successfully."}


def delete_user_account(user, password: str, request) -> None:
    """
    Executes full account deletion compliant with GDPR and India DPDP Act.
    Removes personal data, saved locations, alert subscriptions, chat threads.
    """
    if not user.check_password(password):
        raise DomainError("Password confirmation is incorrect.", code="invalid_credentials", status_code=400)

    with transaction.atomic():
        user_id_str = str(user.public_id)

        # Anonymize audit entries
        try:
            from apps.auditlog.models import AuditEntry

            AuditEntry.objects.filter(actor=user).update(actor=None)
        except Exception:
            pass

        # Flush user session
        request.session.flush()

        # Delete user (cascades locations, subscriptions, threads)
        user.delete()
        logger.info("user_account_deleted", user_id=user_id_str)
