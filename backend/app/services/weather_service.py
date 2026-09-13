"""Weather and Geocoding service layer for KisanMitra AI.

Integrates with OpenWeather API for current weather conditions and reverse geocoding.
Features:
- Strict coordinate validation
- In-memory thread-safe short-lived caching with TTL
- Metric conversions (Celsius, km/h)
- Resilient fallback when geocoding is unavailable
- Sanitized structured error propagation (never exposes API keys)
"""

import os
import time
import logging
import threading
from typing import Optional, Dict, Any, Tuple
import httpx
from dotenv import load_dotenv

from backend.app.config import (
    BASE_DIR,
    WEATHER_API_KEY,
    WEATHER_API_BASE_URL,
    GEOCODING_API_BASE_URL,
    WEATHER_CACHE_TTL_SECONDS,
    WEATHER_TIMEOUT_SECONDS,
)
from backend.app.schemas.weather import (
    LocationInfo,
    WeatherData,
    WeatherResponse,
)
from backend.app.core.exceptions import (
    InvalidCoordinatesError,
    WeatherConfigError,
    WeatherAuthError,
    WeatherRateLimitError,
    WeatherUnavailableError,
)

logger = logging.getLogger("kisanmitra.weather")


class WeatherService:
    """Service managing OpenWeather API interactions, reverse geocoding, and caching."""

    _instance: Optional["WeatherService"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(WeatherService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        self.weather_base_url = WEATHER_API_BASE_URL.rstrip("/")
        self.geocoding_base_url = GEOCODING_API_BASE_URL.rstrip("/")
        self.ttl_seconds = WEATHER_CACHE_TTL_SECONDS
        self.timeout_seconds = WEATHER_TIMEOUT_SECONDS
        self._cache: Dict[str, Tuple[float, Dict[str, Any]]] = {}
        self._cache_lock = threading.Lock()
        self._initialized = True

    def get_api_key(self) -> str:
        """Dynamically retrieve OpenWeather API key, reloading .env if needed."""
        load_dotenv(BASE_DIR / ".env", override=False)
        key = os.getenv("WEATHER_API_KEY", WEATHER_API_KEY).strip()
        if not key:
            load_dotenv(BASE_DIR / ".env", override=True)
            key = os.getenv("WEATHER_API_KEY", "").strip()
        return key

    def is_configured(self) -> bool:
        """Check if OpenWeather API key is present."""
        return bool(self.get_api_key())

    def clear_cache(self) -> None:
        """Clear all in-memory cached responses."""
        with self._cache_lock:
            self._cache.clear()

    @staticmethod
    def validate_coordinates(latitude: float, longitude: float) -> None:
        """Validate that latitude and longitude fall within legal geographical ranges.

        Raises:
            InvalidCoordinatesError: If coordinates are out of bounds or non-numeric.
        """
        try:
            lat = float(latitude)
            lon = float(longitude)
        except (ValueError, TypeError):
            raise InvalidCoordinatesError("Coordinates must be valid numbers.")

        if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
            raise InvalidCoordinatesError(
                f"Coordinates out of range: latitude ({lat}) must be in [-90, 90] "
                f"and longitude ({lon}) must be in [-180, 180]."
            )

    def _get_cache_key(self, latitude: float, longitude: float, language: Optional[str]) -> str:
        """Generate normalized cache key rounded to 3 decimal places (~110 meters)."""
        norm_lat = round(latitude, 3)
        norm_lon = round(longitude, 3)
        norm_lang = (language or "en").strip().lower()
        return f"{norm_lat}_{norm_lon}_{norm_lang}"

    def _http_get(self, url: str, params: Dict[str, Any]) -> httpx.Response:
        """Execute HTTP GET request against upstream weather or geocoding APIs."""
        with httpx.Client(timeout=self.timeout_seconds) as client:
            return client.get(url, params=params)

    def _fetch_reverse_geocoding(
        self,
        api_key: str,
        latitude: float,
        longitude: float,
        language: Optional[str] = None,
    ) -> Dict[str, Optional[str]]:
        """Query OpenWeather reverse geocoding API to resolve locality, state, and country.

        Falls back gracefully if geocoding returns an error or empty result.
        """
        result: Dict[str, Optional[str]] = {"name": None, "state": None, "country": None}
        geo_url = f"{self.geocoding_base_url}/reverse"
        params = {
            "lat": latitude,
            "lon": longitude,
            "limit": 1,
            "appid": api_key,
        }

        try:
            geo_resp = self._http_get(geo_url, params=params)
            if geo_resp.status_code == 200:
                geo_data = geo_resp.json()
                if isinstance(geo_data, list) and len(geo_data) > 0:
                    first = geo_data[0]
                    name = first.get("name")
                    # Check for localized name if requested
                    if language and isinstance(first.get("local_names"), dict):
                        name = first["local_names"].get(language, name)
                    result["name"] = name
                    result["state"] = first.get("state")
                    result["country"] = first.get("country")
            else:
                logger.warning(
                    "Reverse geocoding API returned status %s for (%s, %s)",
                    geo_resp.status_code,
                    latitude,
                    longitude,
                )
        except Exception as exc:
            logger.warning("Reverse geocoding failed for (%s, %s): %s", latitude, longitude, exc)

        return result

    def get_current_weather(
        self,
        latitude: float,
        longitude: float,
        language: Optional[str] = None,
    ) -> WeatherResponse:
        """Fetch current weather for coordinates, utilizing short-lived cache and reverse geocoding.

        Raises:
            InvalidCoordinatesError: For out-of-range coordinates.
            WeatherConfigError: If WEATHER_API_KEY is not configured.
            WeatherAuthError: If upstream returns 401 Unauthorized.
            WeatherRateLimitError: If upstream returns 429 Rate Limit.
            WeatherUnavailableError: If upstream returns 5xx, timeouts, or malformed data.
        """
        self.validate_coordinates(latitude, longitude)

        api_key = self.get_api_key()
        if not api_key:
            logger.warning("Weather lookup requested but WEATHER_API_KEY is not configured.")
            raise WeatherConfigError("Weather service is unconfigured. WEATHER_API_KEY is missing.")

        cache_key = self._get_cache_key(latitude, longitude, language)
        now = time.time()

        # Check short-lived cache
        with self._cache_lock:
            if cache_key in self._cache:
                cached_at, cached_payload = self._cache[cache_key]
                if now - cached_at < self.ttl_seconds:
                    logger.info("Serving weather for (%s, %s) from in-memory cache", latitude, longitude)
                    resp_data = cached_payload.copy()
                    resp_data["cached"] = True
                    return WeatherResponse(**resp_data)
                else:
                    del self._cache[cache_key]

        # Fetch from OpenWeather API
        weather_url = f"{self.weather_base_url}/weather"
        weather_params: Dict[str, Any] = {
            "lat": latitude,
            "lon": longitude,
            "appid": api_key,
            "units": "metric",
        }
        if language:
            weather_params["lang"] = language.strip().lower()

        try:
            # 1. Fetch current weather
            try:
                resp = self._http_get(weather_url, params=weather_params)
            except httpx.TimeoutException:
                logger.error("OpenWeather API timed out after %s seconds", self.timeout_seconds)
                raise WeatherUnavailableError("Weather service request timed out.")
            except httpx.RequestError as req_err:
                logger.error("Network error connecting to OpenWeather: %s", req_err)
                raise WeatherUnavailableError("Weather service is temporarily unreachable.")

            # Upstream HTTP status handling
            if resp.status_code == 401:
                logger.error("OpenWeather API key authentication failed (401)")
                raise WeatherAuthError("Weather service authentication failed.")
            elif resp.status_code == 429:
                logger.warning("OpenWeather rate limit exceeded (429)")
                raise WeatherRateLimitError("Weather service rate limit exceeded. Please try again later.")
            elif resp.status_code >= 500:
                logger.error("OpenWeather upstream server error (%s)", resp.status_code)
                raise WeatherUnavailableError("Weather provider is currently experiencing issues.")
            elif resp.status_code != 200:
                logger.error("OpenWeather unexpected status: %s", resp.status_code)
                raise WeatherUnavailableError(f"Weather provider returned status {resp.status_code}.")

            # Parse JSON payload
            try:
                raw_data = resp.json()
            except Exception as json_err:
                logger.error("Failed to parse OpenWeather response JSON: %s", json_err)
                raise WeatherUnavailableError("Malformed response received from weather provider.")

            if not isinstance(raw_data, dict) or "main" not in raw_data:
                logger.error("Malformed OpenWeather response schema: %s", raw_data)
                raise WeatherUnavailableError("Malformed weather data structure received from provider.")

            # 2. Reverse geocode location (with fallback)
            geo_info = self._fetch_reverse_geocoding(
                api_key=api_key,
                latitude=latitude,
                longitude=longitude,
                language=language,
            )


        except (WeatherConfigError, WeatherAuthError, WeatherRateLimitError, WeatherUnavailableError, InvalidCoordinatesError):
            raise
        except Exception as exc:
            logger.error("Unexpected error in weather lookup: %s", exc, exc_info=True)
            raise WeatherUnavailableError("Weather service encountered an unexpected error.")

        # Extract and map weather metrics cleanly
        main_block = raw_data.get("main", {})
        weather_block = raw_data.get("weather", [])
        primary_weather = weather_block[0] if (isinstance(weather_block, list) and weather_block) else {}
        wind_block = raw_data.get("wind", {})
        rain_block = raw_data.get("rain", {})

        # Unit conversions: OpenWeather metric wind speed is in m/s; convert to km/h
        raw_wind_mps = float(wind_block.get("speed", 0.0))
        wind_kmh = round(raw_wind_mps * 3.6, 1)

        # Precipitation volume (mm in past 1h or 3h)
        rain_mm = 0.0
        if isinstance(rain_block, dict):
            rain_mm = float(rain_block.get("1h", rain_block.get("3h", 0.0)))

        # Fallback location name from weather payload if reverse geocoding did not populate
        loc_name = geo_info.get("name") or raw_data.get("name") or None
        loc_state = geo_info.get("state")
        loc_country = geo_info.get("country") or raw_data.get("sys", {}).get("country") or None

        location_obj = LocationInfo(
            name=loc_name,
            state=loc_state,
            country=loc_country,
            latitude=latitude,
            longitude=longitude,
        )

        weather_obj = WeatherData(
            temperature=round(float(main_block.get("temp", 0.0)), 1),
            feels_like=round(float(main_block.get("feels_like", main_block.get("temp", 0.0))), 1),
            condition=primary_weather.get("main", "Unknown"),
            description=primary_weather.get("description", "").capitalize() or "Clear",
            humidity=int(main_block.get("humidity", 0)),
            wind_speed=wind_kmh,
            rain=round(rain_mm, 2),
        )

        fresh_response_dict = {
            "success": True,
            "location": location_obj.model_dump(),
            "weather": weather_obj.model_dump(),
            "provider": "OpenWeather",
            "cached": False,
        }

        # Cache valid response
        with self._cache_lock:
            # Maintain cache size bound
            if len(self._cache) > 500:
                self._cache.clear()
            self._cache[cache_key] = (now, fresh_response_dict)

        return WeatherResponse(**fresh_response_dict)


# Singleton instance
weather_service = WeatherService()
