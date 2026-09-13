"""Weather API routes for current conditions and location geocoding."""

from typing import Optional
from fastapi import APIRouter, Query, status

from backend.app.schemas.weather import WeatherResponse
from backend.app.services.weather_service import weather_service

router = APIRouter(prefix="/weather", tags=["Weather"])


@router.get(
    "/current",
    response_model=WeatherResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current weather conditions by geographic coordinates",
)
def get_current_weather(
    latitude: float = Query(
        ...,
        description="Latitude coordinate (must be between -90 and 90)",
    ),
    longitude: float = Query(
        ...,
        description="Longitude coordinate (must be between -180 and 180)",
    ),
    language: Optional[str] = Query(
        default=None,
        description="Optional language code for condition descriptions (e.g. 'hi', 'en')",
    ),
):
    """Retrieve real-time weather metrics and reverse-geocoded location details.

    Parameters:
        latitude: Floating point latitude between -90.0 and 90.0
        longitude: Floating point longitude between -180.0 and 180.0
        language: Optional language code for weather descriptions

    Responses:
        200 OK: Weather metrics and geocoded location.
        400 Bad Request: Invalid or out-of-range coordinates.
        429 Rate Limit: Weather provider rate limit exceeded.
        502 Bad Gateway: Upstream authentication failure.
        503 Service Unavailable: Unconfigured API key or upstream provider failure.
    """
    return weather_service.get_current_weather(
        latitude=latitude,
        longitude=longitude,
        language=language,
    )
