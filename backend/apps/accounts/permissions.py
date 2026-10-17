from rest_framework.permissions import BasePermission

from apps.core.exceptions import EmailNotVerified


class IsVerified(BasePermission):
    """
    Allows access only to authenticated users who have verified their email address.
    Unverified users receive 403 email_not_verified.
    """

    message = "Your email address has not been verified. Please check your inbox or resend verification."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if not getattr(request.user, "is_email_verified", False):
            raise EmailNotVerified(self.message)
        return True


class GuestOrAuthenticated(BasePermission):
    """
    Allows access to authenticated users OR establishes/validates an anonymous Django session
    for guest users.
    """

    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated:
            return True

        # Ensure session exists for guest user
        if not request.session.session_key:
            request.session.save()
        return True
