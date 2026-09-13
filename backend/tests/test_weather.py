"""Unit and integration tests for Weather and Reverse Geocoding service.

Tests:
1. Valid coordinates
2. Invalid latitude (< -90 or > 90)
3. Invalid longitude (< -180 or > 180)
4. Missing API key (honest configuration error)
5. Mocked successful OpenWeather response
6. Provider timeout
7. Provider 401 Unauthorized
8. Provider 429 Rate Limit
9. Provider 5xx Server Error
10. Geocoding failure (fallback location used, weather still returned)
11. Malformed upstream response
12. Response mapping and metric unit conversion (m/s to km/h, rain mm, Celsius)
13. Short-lived in-memory caching
"""

from unittest.mock import patch, MagicMock
import pytest
import httpx

from backend.app.services.weather_service import weather_service


SAMPLE_WEATHER_DATA = {
    "coord": {"lon": 77.209, "lat": 28.6139},
    "weather": [
        {
            "id": 800,
            "main": "Clear",
            "description": "clear sky",
            "icon": "01d",
        }
    ],
    "main": {
        "temp": 30.5,
        "feels_like": 32.1,
        "humidity": 45,
    },
    "wind": {
        "speed": 5.0,  # 5.0 m/s * 3.6 = 18.0 km/h
        "deg": 90,
    },
    "rain": {
        "1h": 1.25,
    },
    "sys": {
        "country": "IN",
    },
    "name": "Delhi Station",
    "cod": 200,
}

SAMPLE_GEOCODING_DATA = [
    {
        "name": "New Delhi",
        "local_names": {
            "hi": "नई दिल्ली",
            "en": "New Delhi",
        },
        "lat": 28.6139,
        "lon": 77.209,
        "country": "IN",
        "state": "Delhi",
    }
]


def make_mock_http_get(weather_json=None, weather_status=200, geo_json=None, geo_status=200):
    """Create a side_effect function for weather_service._http_get."""
    def _mock_get(url, params=None, **kwargs):
        req = httpx.Request("GET", str(url))
        if "reverse" in str(url):
            if geo_status != 200:
                return httpx.Response(geo_status, request=req)
            return httpx.Response(geo_status, json=geo_json if geo_json is not None else SAMPLE_GEOCODING_DATA, request=req)
        else:
            if weather_status != 200:
                return httpx.Response(weather_status, request=req)
            return httpx.Response(weather_status, json=weather_json if weather_json is not None else SAMPLE_WEATHER_DATA, request=req)
    return _mock_get


@pytest.fixture(autouse=True)
def clear_weather_cache():
    """Ensure in-memory cache is pristine before and after each test."""
    weather_service.clear_cache()
    yield
    weather_service.clear_cache()


class TestWeatherCoordinatesValidation:
    """Tests 2 & 3: Coordinate bounds validation."""

    def test_invalid_latitude_high(self, client):
        """Latitude > 90 must return HTTP 400 with invalid_coordinates error."""
        response = client.get("/api/weather/current?latitude=90.001&longitude=77.209")
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert data["error"] == "invalid_coordinates"
        assert "latitude" in data["message"].lower()

    def test_invalid_latitude_low(self, client):
        """Latitude < -90 must return HTTP 400 with invalid_coordinates error."""
        response = client.get("/api/weather/current?latitude=-90.001&longitude=77.209")
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert data["error"] == "invalid_coordinates"

    def test_invalid_longitude_high(self, client):
        """Longitude > 180 must return HTTP 400 with invalid_coordinates error."""
        response = client.get("/api/weather/current?latitude=28.6139&longitude=180.001")
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert data["error"] == "invalid_coordinates"
        assert "longitude" in data["message"].lower()

    def test_invalid_longitude_low(self, client):
        """Longitude < -180 must return HTTP 400 with invalid_coordinates error."""
        response = client.get("/api/weather/current?latitude=28.6139&longitude=-180.001")
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert data["error"] == "invalid_coordinates"

    def test_missing_coordinates_returns_422(self, client):
        """Missing required coordinate query params must return HTTP 422."""
        response = client.get("/api/weather/current")
        assert response.status_code == 422
        data = response.json()
        assert data["success"] is False
        assert data["error"] == "validation_error"


class TestWeatherConfiguration:
    """Test 4: Missing or unconfigured API key."""

    def test_missing_api_key(self, client):
        """When WEATHER_API_KEY is empty, must return 503 with weather_unconfigured error."""
        with patch.object(weather_service, "get_api_key", return_value=""):
            response = client.get("/api/weather/current?latitude=28.6139&longitude=77.209")
            assert response.status_code == 503
            data = response.json()
            assert data["success"] is False
            assert data["error"] == "weather_unconfigured"
            assert "unconfigured" in data["message"].lower()


class TestWeatherSuccessAndMapping:
    """Tests 1, 5, 12: Successful response mapping, metric units, and valid coordinates."""

    def test_valid_weather_lookup(self, client):
        """Test 1 & 5: Valid coordinates with mocked OpenWeather returns 200 and mapped structure."""
        with patch.object(weather_service, "get_api_key", return_value="mock_api_key_123"):
            with patch.object(weather_service, "_http_get", side_effect=make_mock_http_get()):
                response = client.get("/api/weather/current?latitude=28.6139&longitude=77.209")
                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True
                assert data["provider"] == "OpenWeather"
                assert data["cached"] is False

                # Location checks
                loc = data["location"]
                assert loc["name"] == "New Delhi"
                assert loc["state"] == "Delhi"
                assert loc["country"] == "IN"
                assert loc["latitude"] == 28.6139
                assert loc["longitude"] == 77.209

                # Weather metrics
                w = data["weather"]
                assert w["temperature"] == 30.5
                assert w["feels_like"] == 32.1
                assert w["condition"] == "Clear"
                assert w["description"] == "Clear sky"
                assert w["humidity"] == 45
                assert w["wind_speed"] == 18.0  # 5.0 m/s * 3.6 = 18.0 km/h
                assert w["rain"] == 1.25

    def test_response_mapping_unit_conversions(self, client):
        """Test 12: Ensure m/s to km/h conversion, rain fallback, and temperature rounding."""
        custom_weather = {
            "main": {"temp": 24.56, "feels_like": 25.12, "humidity": 70},
            "weather": [{"main": "Rain", "description": "moderate rain"}],
            "wind": {"speed": 2.5},  # 2.5 * 3.6 = 9.0 km/h
            "rain": {"3h": 4.5},     # 3h rain fallback
            "sys": {"country": "IN"},
            "name": "Station Alpha",
        }
        with patch.object(weather_service, "get_api_key", return_value="mock_api_key_123"):
            with patch.object(weather_service, "_http_get", side_effect=make_mock_http_get(weather_json=custom_weather)):
                response = client.get("/api/weather/current?latitude=20.0&longitude=85.0")
                assert response.status_code == 200
                data = response.json()
                w = data["weather"]
                assert w["temperature"] == 24.6
                assert w["feels_like"] == 25.1
                assert w["wind_speed"] == 9.0
                assert w["rain"] == 4.5
                assert w["condition"] == "Rain"

    def test_short_lived_cache_hit(self, client):
        """Subsequent request within TTL returns cached=True without upstream HTTP calls."""
        with patch.object(weather_service, "get_api_key", return_value="mock_api_key_123"):
            mock_get = MagicMock(side_effect=make_mock_http_get())
            with patch.object(weather_service, "_http_get", mock_get):
                # First call -> Miss
                r1 = client.get("/api/weather/current?latitude=28.6139&longitude=77.209")
                assert r1.status_code == 200
                assert r1.json()["cached"] is False
                first_call_count = mock_get.call_count

                # Second call -> Hit
                r2 = client.get("/api/weather/current?latitude=28.6139&longitude=77.209")
                assert r2.status_code == 200
                assert r2.json()["cached"] is True
                # Upstream was not called again
                assert mock_get.call_count == first_call_count


class TestWeatherErrorHandling:
    """Tests 6, 7, 8, 9, 10, 11: Provider failure modes."""

    def test_provider_timeout(self, client):
        """Test 6: Request timeout returns 503 weather_unavailable."""
        with patch.object(weather_service, "get_api_key", return_value="mock_api_key_123"):
            with patch.object(weather_service, "_http_get", side_effect=httpx.TimeoutException("Read timed out")):
                response = client.get("/api/weather/current?latitude=28.6139&longitude=77.209")
                assert response.status_code == 503
                data = response.json()
                assert data["success"] is False
                assert data["error"] == "weather_unavailable"
                assert "timed out" in data["message"].lower()

    def test_provider_401_unauthorized(self, client):
        """Test 7: Provider 401 returns 502 with weather_auth_error."""
        with patch.object(weather_service, "get_api_key", return_value="mock_api_key_123"):
            with patch.object(weather_service, "_http_get", side_effect=make_mock_http_get(weather_status=401)):
                response = client.get("/api/weather/current?latitude=28.6139&longitude=77.209")
                assert response.status_code == 502
                data = response.json()
                assert data["success"] is False
                assert data["error"] == "weather_auth_error"

    def test_provider_429_rate_limit(self, client):
        """Test 8: Provider 429 returns 429 with weather_rate_limit."""
        with patch.object(weather_service, "get_api_key", return_value="mock_api_key_123"):
            with patch.object(weather_service, "_http_get", side_effect=make_mock_http_get(weather_status=429)):
                response = client.get("/api/weather/current?latitude=28.6139&longitude=77.209")
                assert response.status_code == 429
                data = response.json()
                assert data["success"] is False
                assert data["error"] == "weather_rate_limit"

    def test_provider_5xx_server_error(self, client):
        """Test 9: Provider 500/503 returns 503 with weather_unavailable."""
        with patch.object(weather_service, "get_api_key", return_value="mock_api_key_123"):
            with patch.object(weather_service, "_http_get", side_effect=make_mock_http_get(weather_status=500)):
                response = client.get("/api/weather/current?latitude=28.6139&longitude=77.209")
                assert response.status_code == 503
                data = response.json()
                assert data["success"] is False
                assert data["error"] == "weather_unavailable"

    def test_geocoding_failure_fallback(self, client):
        """Test 10: When reverse geocoding fails, fallback location is used and weather succeeds."""
        with patch.object(weather_service, "get_api_key", return_value="mock_api_key_123"):
            # Geocoding returns 500 but weather returns 200
            with patch.object(weather_service, "_http_get", side_effect=make_mock_http_get(geo_status=500)):
                response = client.get("/api/weather/current?latitude=28.6139&longitude=77.209")
                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True
                # Location falls back to weather data payload ("Delhi Station", "IN")
                assert data["location"]["name"] == "Delhi Station"
                assert data["location"]["country"] == "IN"
                assert data["location"]["state"] is None
                assert data["weather"]["temperature"] == 30.5

    def test_malformed_upstream_response(self, client):
        """Test 11: Malformed JSON/schema from provider returns 503 weather_unavailable."""
        malformed_data = {"unexpected_key": "unexpected_value"}
        with patch.object(weather_service, "get_api_key", return_value="mock_api_key_123"):
            with patch.object(weather_service, "_http_get", side_effect=make_mock_http_get(weather_json=malformed_data)):
                response = client.get("/api/weather/current?latitude=28.6139&longitude=77.209")
                assert response.status_code == 503
                data = response.json()
                assert data["success"] is False
                assert data["error"] == "weather_unavailable"
