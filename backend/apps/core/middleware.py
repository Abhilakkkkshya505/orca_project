import uuid

import structlog


class RequestIDMiddleware:
    """
    Assigns a unique request ID to each incoming HTTP request,
    prioritizing Cloudflare's CF-Ray header or generating a UUID hex.
    Binds the request_id to structlog context and adds X-Request-ID to the response.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        cf_ray = request.headers.get("CF-Ray")
        request_id = cf_ray if cf_ray else uuid.uuid4().hex
        request.request_id = request_id

        # Bind to structlog context
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)

        response = self.get_response(request)
        response["X-Request-ID"] = request_id
        return response
