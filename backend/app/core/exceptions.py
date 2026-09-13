from typing import Optional, Any


class AppException(Exception):
    """Base application exception for structured API errors."""

    def __init__(
        self,
        status_code: int,
        error: str,
        message: str,
        details: Optional[Any] = None,
    ):
        self.status_code = status_code
        self.error = error
        self.message = message
        self.details = details
        super().__init__(message)


class NotFoundError(AppException):
    """Resource not found exception (HTTP 404)."""

    def __init__(self, message: str = "Resource not found.", error: str = "not_found"):
        super().__init__(status_code=404, error=error, message=message)


class BadRequestError(AppException):
    """Bad request exception (HTTP 400)."""

    def __init__(self, message: str = "Bad request.", error: str = "bad_request", details: Optional[Any] = None):
        super().__init__(status_code=400, error=error, message=message, details=details)


class InvalidCoordinatesError(AppException):
    """Invalid latitude or longitude coordinates (HTTP 400)."""

    def __init__(
        self,
        message: str = "Invalid coordinates. Latitude must be between -90 and 90, and longitude between -180 and 180.",
        error: str = "invalid_coordinates",
    ):
        super().__init__(status_code=400, error=error, message=message)


class WeatherConfigError(AppException):
    """Weather service API key unconfigured (HTTP 503)."""

    def __init__(
        self,
        message: str = "Weather service is unconfigured. WEATHER_API_KEY is missing.",
        error: str = "weather_unconfigured",
    ):
        super().__init__(status_code=503, error=error, message=message)


class WeatherAuthError(AppException):
    """Weather service provider authentication failed (HTTP 502)."""

    def __init__(
        self,
        message: str = "Weather provider authentication failed. Please verify API key.",
        error: str = "weather_auth_error",
    ):
        super().__init__(status_code=502, error=error, message=message)


class WeatherRateLimitError(AppException):
    """Weather service rate limit exceeded (HTTP 429)."""

    def __init__(
        self,
        message: str = "Weather service rate limit exceeded. Please try again later.",
        error: str = "weather_rate_limit",
    ):
        super().__init__(status_code=429, error=error, message=message)


class WeatherUnavailableError(AppException):
    """Weather service upstream failure or timeout (HTTP 503)."""

    def __init__(
        self,
        message: str = "Weather service is temporarily unavailable.",
        error: str = "weather_unavailable",
    ):
        super().__init__(status_code=503, error=error, message=message)


class MandiUnavailableError(AppException):
    """Mandi/Market price service upstream failure or timeout (HTTP 503)."""

    def __init__(
        self,
        message: str = "Market price service is temporarily unavailable.",
        error: str = "mandi_unavailable",
    ):
        super().__init__(status_code=503, error=error, message=message)


class MandiRateLimitError(AppException):
    """Mandi service upstream rate limit exceeded (HTTP 429)."""

    def __init__(
        self,
        message: str = "Market price service rate limit exceeded. Please try again later.",
        error: str = "mandi_rate_limit",
    ):
        super().__init__(status_code=429, error=error, message=message)


class MandiAuthError(AppException):
    """Mandi service provider authentication failure (HTTP 502)."""

    def __init__(
        self,
        message: str = "Market price provider authentication failed.",
        error: str = "mandi_auth_error",
    ):
        super().__init__(status_code=502, error=error, message=message)


