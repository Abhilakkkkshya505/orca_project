from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from apps.core.exceptions import DomainError

EMAIL_VERIFICATION_MAX_AGE = 86400  # 24 hours
PASSWORD_RESET_MAX_AGE = getattr(settings, "PASSWORD_RESET_TIMEOUT", 3600)  # 1 hour

_email_signer = TimestampSigner(salt="orca-email-verification")
_password_reset_generator = PasswordResetTokenGenerator()


def generate_email_verification_token(user) -> str:
    """Generates a secure timestamp-signed token for email verification."""
    return _email_signer.sign(str(user.public_id))


def verify_email_verification_token(token: str, max_age: int = EMAIL_VERIFICATION_MAX_AGE):
    """
    Unsigns email verification token.
    Returns the User instance if valid, or raises a DomainError.
    """
    User = get_user_model()
    try:
        public_id_str = _email_signer.unsign(token, max_age=max_age)
    except SignatureExpired:
        raise DomainError("Verification link has expired. Please request a new one.", code="token_expired")
    except BadSignature:
        raise DomainError("Invalid verification link.", code="invalid_token")

    try:
        user = User.objects.get(public_id=public_id_str)
    except (User.DoesNotExist, ValueError):
        raise DomainError("User associated with token not found.", code="invalid_token")

    return user


def generate_password_reset_token(user) -> tuple[str, str]:
    """Generates (uidb64, token) tuple for password reset."""
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = _password_reset_generator.make_token(user)
    return uid, token


def verify_password_reset_token(uidb64: str, token: str):
    """
    Validates password reset token and uid.
    Returns the User instance if valid, or raises a DomainError.
    """
    User = get_user_model()
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        raise DomainError("Invalid password reset link.", code="invalid_token")

    if not _password_reset_generator.check_token(user, token):
        raise DomainError("Password reset link is invalid or has expired.", code="invalid_token")

    return user
