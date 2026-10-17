import uuid

import structlog
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = structlog.get_logger(__name__)


class DomainError(Exception):
    """Base class for domain-level exceptions."""

    code = "domain_error"
    status_code = status.HTTP_400_BAD_REQUEST

    def __init__(
        self,
        message: str,
        details: dict | None = None,
        code: str | None = None,
        status_code: int | None = None,
    ):
        super().__init__(message)
        self.message = message
        self.details = details or {}
        if code:
            self.code = code
        if status_code:
            self.status_code = status_code


class OutOfCoverage(DomainError):
    code = "out_of_coverage"
    status_code = status.HTTP_400_BAD_REQUEST


class DataUnavailable(DomainError):
    code = "data_unavailable"
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE


class LlmBudgetExceeded(DomainError):
    code = "llm_budget_exceeded"
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE


class TurnstileFailed(DomainError):
    code = "turnstile_failed"
    status_code = status.HTTP_400_BAD_REQUEST


class TurnstileUnavailable(DomainError):
    code = "turnstile_unavailable"
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE


class RiskOutputPaused(DomainError):
    code = "risk_output_paused"
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE


class EmailNotVerified(DomainError):
    code = "email_not_verified"
    status_code = status.HTTP_403_FORBIDDEN


def custom_exception_handler(exc, context):
    """
    Standard DRF exception handler returning uniform error JSON shape:
    { "error": { "code": "...", "message": "...", "details": {...}, "request_id": "..." } }
    """
    request = context.get("request")
    request_id = getattr(request, "request_id", uuid.uuid4().hex)

    # Handle custom DomainError instances
    if isinstance(exc, DomainError):
        payload = {
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
                "request_id": request_id,
            }
        }
        return Response(payload, status=exc.status_code)

    # Let DRF handle standard API exceptions first
    response = exception_handler(exc, context)

    if response is not None:
        code = "error"
        message = "An error occurred."
        details = {}

        if response.status_code == status.HTTP_400_BAD_REQUEST:
            code = "validation_error"
            message = "Check the highlighted fields."
            if isinstance(response.data, dict):
                details = response.data
            elif isinstance(response.data, list):
                details = {"non_field_errors": response.data}
        elif response.status_code == status.HTTP_401_UNAUTHORIZED or (
            response.status_code == status.HTTP_403_FORBIDDEN
            and not (request and getattr(request, "user", None) and request.user.is_authenticated)
        ):
            code = "not_authenticated"
            message = "Authentication credentials were not provided or have expired."
            response.status_code = status.HTTP_401_UNAUTHORIZED
        elif response.status_code == status.HTTP_403_FORBIDDEN:
            code = getattr(exc, "code", "permission_denied")
            message = (
                str(response.data.get("detail", "You do not have permission to perform this action."))
                if isinstance(response.data, dict)
                else str(response.data)
            )
        elif response.status_code == status.HTTP_404_NOT_FOUND:
            code = "not_found"
            message = "The requested resource was not found."
        elif response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
            code = "rate_limited"
            wait = getattr(exc, "wait", None)
            if wait is not None:
                details = {"retry_after_seconds": int(wait)}
                message = f"Too many requests. Try again in {int(wait)} seconds."
            else:
                message = "Too many requests. Please try again later."
        else:
            if isinstance(response.data, dict) and "detail" in response.data:
                message = str(response.data["detail"])
            code = f"http_{response.status_code}"

        response.data = {
            "error": {
                "code": code,
                "message": message,
                "details": details,
                "request_id": request_id,
            }
        }
        return response

    # Unhandled server exceptions
    logger.error("unhandled_exception", error=str(exc), request_id=request_id, exc_info=True)
    payload = {
        "error": {
            "code": "internal_error",
            "message": "An unexpected error occurred. Please try again later.",
            "details": {},
            "request_id": request_id,
        }
    }
    return Response(payload, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
