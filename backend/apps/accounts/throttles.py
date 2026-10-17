from rest_framework.throttling import SimpleRateThrottle


class AuthIpThrottle(SimpleRateThrottle):
    """Throttles auth endpoints per client IP."""

    scope = "auth_ip"

    def get_cache_key(self, request, view):
        ip = getattr(request, "client_ip", request.META.get("REMOTE_ADDR", "127.0.0.1"))
        return f"throttle_auth_ip_{ip}"


class LoginEmailThrottle(SimpleRateThrottle):
    """Throttles login attempts per normalized email address."""

    scope = "auth_email"

    def get_cache_key(self, request, view):
        email = request.data.get("email", "")
        if not email:
            return None
        return f"throttle_login_email_{email.strip().lower()}"


class GuestChatThrottle(SimpleRateThrottle):
    """Throttles guest chat messages per session/IP."""

    scope = "guest_chat"

    def get_cache_key(self, request, view):
        if request.user.is_authenticated:
            return None  # Authenticated users use UserRateThrottle
        session_key = request.session.session_key
        if not session_key:
            return getattr(request, "client_ip", request.META.get("REMOTE_ADDR", "127.0.0.1"))
        return f"throttle_guest_chat_{session_key}"
