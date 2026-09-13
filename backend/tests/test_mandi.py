"""Unit and integration tests for Mandi / Market Price Service.

Tests:
1. Demo data response
2. Live provider mocked response
3. Commodity filter
4. State filter
5. District filter
6. Market filter
7. Limit validation
8. No results
9. Provider timeout
10. Provider failure (500)
11. Malformed response
12. Missing live API configuration
13. Data mode correctness ('DEMO' vs 'LIVE')
14. Response schema validation
15. Short-lived in-memory caching
"""

from unittest.mock import patch, MagicMock
import pytest
import httpx

from backend.app.services.mandi_service import mandi_service, LiveMandiProvider, DemoMandiProvider


SAMPLE_LIVE_RECORDS = {
    "updated_date": "2026-09-13T08:00:00Z",
    "records": [
        {
            "state": "Bihar",
            "district": "Patna",
            "market": "Patna",
            "commodity": "Wheat",
            "min_price": "2200",
            "max_price": "2400",
            "modal_price": "2300",
            "arrival_date": "2026-09-13",
            "unit": "quintal",
        },
        {
            "state": "Bihar",
            "district": "Patna",
            "market": "Patna",
            "commodity": "Rice",
            "min_price": "2900",
            "max_price": "3200",
            "modal_price": "3050",
            "arrival_date": "2026-09-13",
            "unit": "quintal",
        },
    ],
}


@pytest.fixture(autouse=True)
def reset_mandi_cache_and_env():
    """Ensure cache is empty and default settings are restored before each test."""
    mandi_service.clear_cache()
    yield
    mandi_service.clear_cache()


class TestMandiDemoProvider:
    """Tests 1, 3, 4, 5, 6, 8, 12, 13, 14: Demo provider behavior and filtering."""

    def test_demo_data_response(self, client):
        """Test 1: Default response returns demo dataset with data_mode='DEMO'."""
        with patch.object(mandi_service, "get_api_key", return_value=""):
            response = client.get("/api/mandi/prices")
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["data_mode"] == "DEMO"
            assert "Demo" in data["provider"]
            assert data["total_records"] > 0
            assert len(data["prices"]) == data["total_records"]
            assert data["cached"] is False

    def test_commodity_filter(self, client):
        """Test 3: Commodity query filter matches relevant records only."""
        with patch.object(mandi_service, "get_api_key", return_value=""):
            response = client.get("/api/mandi/prices?commodity=Wheat")
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["total_records"] > 0
            for record in data["prices"]:
                assert "wheat" in record["commodity"].lower()

    def test_state_filter(self, client):
        """Test 4: State filter matches records in that state."""
        with patch.object(mandi_service, "get_api_key", return_value=""):
            response = client.get("/api/mandi/prices?state=Bihar")
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["total_records"] > 0
            for record in data["prices"]:
                assert record["state"] == "Bihar"

    def test_district_filter(self, client):
        """Test 5: District filter matches records in that district."""
        with patch.object(mandi_service, "get_api_key", return_value=""):
            response = client.get("/api/mandi/prices?district=Patna")
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["total_records"] > 0
            for record in data["prices"]:
                assert record["district"] == "Patna"

    def test_market_filter(self, client):
        """Test 6: Market filter matches records in that market."""
        with patch.object(mandi_service, "get_api_key", return_value=""):
            response = client.get("/api/mandi/prices?market=Gaya")
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["total_records"] > 0
            for record in data["prices"]:
                assert record["market"] == "Gaya"

    def test_no_results(self, client):
        """Test 8: Query with no matches returns empty prices with total_records=0."""
        with patch.object(mandi_service, "get_api_key", return_value=""):
            response = client.get("/api/mandi/prices?commodity=DragonfruitXYZ")
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["total_records"] == 0
            assert data["prices"] == []

    def test_missing_live_api_configuration_defaults_to_demo(self, client):
        """Test 12: Missing live API key defaults cleanly to demo provider without crashing."""
        with patch.object(mandi_service, "get_api_key", return_value=""):
            with patch.object(mandi_service, "get_data_mode_setting", return_value="AUTO"):
                active = mandi_service.get_active_provider()
                assert isinstance(active, DemoMandiProvider)
                response = client.get("/api/mandi/prices")
                assert response.status_code == 200
                assert response.json()["data_mode"] == "DEMO"

    def test_data_mode_correctness_demo(self, client):
        """Test 13: data_mode explicitly matches DEMO mode."""
        with patch.object(mandi_service, "get_data_mode_setting", return_value="DEMO"):
            response = client.get("/api/mandi/prices")
            assert response.status_code == 200
            assert response.json()["data_mode"] == "DEMO"

    def test_response_schema(self, client):
        """Test 14: Response conforms to required schema fields and types."""
        with patch.object(mandi_service, "get_api_key", return_value=""):
            response = client.get("/api/mandi/prices?limit=5")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data["data_mode"], str)
            assert isinstance(data["provider"], str)
            assert isinstance(data["last_updated"], str)
            assert isinstance(data["total_records"], int)
            assert isinstance(data["prices"], list)
            if data["prices"]:
                p = data["prices"][0]
                assert "commodity" in p
                assert "market" in p
                assert "district" in p
                assert "state" in p
                assert isinstance(p["min_price"], (int, float))
                assert isinstance(p["max_price"], (int, float))
                assert isinstance(p["modal_price"], (int, float))
                assert p["unit"] == "quintal"
                assert "date" in p


class TestMandiValidationAndCache:
    """Tests 7 & 15: Limit validation and in-memory cache."""

    def test_limit_validation_min(self, client):
        """Test 7: Limit < 1 must return 422 Unprocessable Entity."""
        response = client.get("/api/mandi/prices?limit=0")
        assert response.status_code == 422
        data = response.json()
        assert data["success"] is False
        assert data["error"] == "validation_error"

    def test_limit_validation_max(self, client):
        """Test 7: Limit > 200 must return 422 Unprocessable Entity."""
        response = client.get("/api/mandi/prices?limit=201")
        assert response.status_code == 422
        data = response.json()
        assert data["success"] is False
        assert data["error"] == "validation_error"

    def test_mandi_caching(self, client):
        """Test 15: Identical query within TTL returns cached=True."""
        with patch.object(mandi_service, "get_api_key", return_value=""):
            # First call -> Miss
            r1 = client.get("/api/mandi/prices?commodity=Wheat&state=Bihar")
            assert r1.status_code == 200
            assert r1.json()["cached"] is False

            # Second call -> Hit
            r2 = client.get("/api/mandi/prices?commodity=Wheat&state=Bihar")
            assert r2.status_code == 200
            assert r2.json()["cached"] is True
            assert r2.json()["total_records"] == r1.json()["total_records"]


class TestMandiLiveProviderMocked:
    """Tests 2, 9, 10, 11: Live provider integration and failure modes."""

    def test_live_provider_mocked_response(self, client):
        """Test 2: Mocked live Agmarknet API returns data_mode='LIVE' and mapped records."""
        req = httpx.Request("GET", "https://api.data.gov.in/resource/test")
        mock_resp = httpx.Response(200, json=SAMPLE_LIVE_RECORDS, request=req)

        with patch.object(mandi_service, "get_api_key", return_value="mock_gov_api_key"):
            with patch.object(mandi_service, "get_data_mode_setting", return_value="AUTO"):
                with patch.object(LiveMandiProvider, "_http_get", return_value=mock_resp):
                    response = client.get("/api/mandi/prices?state=Bihar")
                    assert response.status_code == 200
                    data = response.json()
                    assert data["success"] is True
                    assert data["data_mode"] == "LIVE"
                    assert "Agmarknet" in data["provider"]
                    assert data["total_records"] == 2
                    assert data["prices"][0]["commodity"] == "Wheat"
                    assert data["prices"][0]["modal_price"] == 2300.0

    def test_provider_timeout(self, client):
        """Test 9: Live provider timeout maps to 503 mandi_unavailable."""
        with patch.object(mandi_service, "get_api_key", return_value="mock_gov_api_key"):
            with patch.object(mandi_service, "get_data_mode_setting", return_value="AUTO"):
                with patch.object(LiveMandiProvider, "_http_get", side_effect=httpx.TimeoutException("Read timed out")):
                    response = client.get("/api/mandi/prices")
                    assert response.status_code == 503
                    data = response.json()
                    assert data["success"] is False
                    assert data["error"] == "mandi_unavailable"
                    assert "timed out" in data["message"].lower()

    def test_provider_failure(self, client):
        """Test 10: Live provider HTTP 500 maps to 503 mandi_unavailable."""
        req = httpx.Request("GET", "https://api.data.gov.in/resource/test")
        mock_resp = httpx.Response(500, request=req)

        with patch.object(mandi_service, "get_api_key", return_value="mock_gov_api_key"):
            with patch.object(mandi_service, "get_data_mode_setting", return_value="AUTO"):
                with patch.object(LiveMandiProvider, "_http_get", return_value=mock_resp):
                    response = client.get("/api/mandi/prices")
                    assert response.status_code == 503
                    data = response.json()
                    assert data["success"] is False
                    assert data["error"] == "mandi_unavailable"

    def test_malformed_response(self, client):
        """Test 11: Malformed JSON/schema from live provider maps to 503 mandi_unavailable."""
        req = httpx.Request("GET", "https://api.data.gov.in/resource/test")
        mock_resp = httpx.Response(200, json={"unexpected": "schema"}, request=req)

        with patch.object(mandi_service, "get_api_key", return_value="mock_gov_api_key"):
            with patch.object(mandi_service, "get_data_mode_setting", return_value="AUTO"):
                with patch.object(LiveMandiProvider, "_http_get", return_value=mock_resp):
                    response = client.get("/api/mandi/prices")
                    assert response.status_code == 503
                    data = response.json()
                    assert data["success"] is False
                    assert data["error"] == "mandi_unavailable"
