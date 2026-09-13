"""Mandi / Market Price Service for KisanMitra AI.

Provides agricultural market price data with a clean provider abstraction:
- DemoMandiProvider: Realistic curated sample market data with explicit 'DEMO' data_mode.
- LiveMandiProvider: Official data.gov.in / Agmarknet live integration with 'LIVE' data_mode.
- MandiService: Coordinates provider selection, caching, query filtering, and validation.
"""

import os
import time
import logging
import threading
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
import httpx
from dotenv import load_dotenv

from backend.app.config import (
    BASE_DIR,
    MANDI_API_KEY,
    MANDI_API_BASE_URL,
    MANDI_DATA_MODE,
    MANDI_CACHE_TTL_SECONDS,
    MANDI_TIMEOUT_SECONDS,
)
from backend.app.schemas.mandi import (
    MandiPriceRecord,
    MandiPricesResponse,
)
from backend.app.core.exceptions import (
    MandiUnavailableError,
    MandiRateLimitError,
    MandiAuthError,
)

logger = logging.getLogger("kisanmitra.mandi")


class MandiProviderBase(ABC):
    """Abstract base class for Mandi price providers."""

    @abstractmethod
    def fetch_prices(
        self,
        commodity: Optional[str] = None,
        state: Optional[str] = None,
        district: Optional[str] = None,
        market: Optional[str] = None,
        limit: int = 50,
    ) -> MandiPricesResponse:
        """Fetch market price records matching query criteria."""
        pass


class DemoMandiProvider(MandiProviderBase):
    """Curated demo market price provider for development and when live API is unconfigured.

    Clearly identified with data_mode='DEMO' to ensure complete transparency.
    """

    PROVIDER_NAME = "Demo Market Provider (Sample Data)"

    def __init__(self):
        self._seed_data = self._generate_seed_records()

    @staticmethod
    def _generate_seed_records() -> List[Dict[str, Any]]:
        """Generate realistic agricultural market price records across major Indian agricultural states."""
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        return [
            # Bihar Mandis
            {"commodity": "Wheat", "market": "Patna", "district": "Patna", "state": "Bihar", "min_price": 2150.0, "max_price": 2320.0, "modal_price": 2240.0, "unit": "quintal", "date": today},
            {"commodity": "Rice", "market": "Patna", "district": "Patna", "state": "Bihar", "min_price": 2800.0, "max_price": 3100.0, "modal_price": 2950.0, "unit": "quintal", "date": today},
            {"commodity": "Maize", "market": "Muzaffarpur", "district": "Muzaffarpur", "state": "Bihar", "min_price": 1850.0, "max_price": 2050.0, "modal_price": 1960.0, "unit": "quintal", "date": today},
            {"commodity": "Potato", "market": "Bihar Sharif", "district": "Nalanda", "state": "Bihar", "min_price": 1200.0, "max_price": 1450.0, "modal_price": 1320.0, "unit": "quintal", "date": today},
            {"commodity": "Onion", "market": "Gaya", "district": "Gaya", "state": "Bihar", "min_price": 1700.0, "max_price": 2100.0, "modal_price": 1920.0, "unit": "quintal", "date": today},
            {"commodity": "Tomato", "market": "Bhagalpur", "district": "Bhagalpur", "state": "Bihar", "min_price": 1500.0, "max_price": 1900.0, "modal_price": 1720.0, "unit": "quintal", "date": today},
            {"commodity": "Mustard", "market": "Gaya", "district": "Gaya", "state": "Bihar", "min_price": 5100.0, "max_price": 5450.0, "modal_price": 5300.0, "unit": "quintal", "date": today},

            # Uttar Pradesh Mandis
            {"commodity": "Wheat", "market": "Varanasi", "district": "Varanasi", "state": "Uttar Pradesh", "min_price": 2200.0, "max_price": 2360.0, "modal_price": 2280.0, "unit": "quintal", "date": today},
            {"commodity": "Rice", "market": "Varanasi", "district": "Varanasi", "state": "Uttar Pradesh", "min_price": 2750.0, "max_price": 3050.0, "modal_price": 2900.0, "unit": "quintal", "date": today},
            {"commodity": "Potato", "market": "Kanpur", "district": "Kanpur Nagar", "state": "Uttar Pradesh", "min_price": 1150.0, "max_price": 1380.0, "modal_price": 1260.0, "unit": "quintal", "date": today},
            {"commodity": "Tomato", "market": "Lucknow", "district": "Lucknow", "state": "Uttar Pradesh", "min_price": 1600.0, "max_price": 2000.0, "modal_price": 1800.0, "unit": "quintal", "date": today},
            {"commodity": "Gram", "market": "Gorakhpur", "district": "Gorakhpur", "state": "Uttar Pradesh", "min_price": 5600.0, "max_price": 6050.0, "modal_price": 5850.0, "unit": "quintal", "date": today},

            # Punjab Mandis
            {"commodity": "Wheat", "market": "Ludhiana", "district": "Ludhiana", "state": "Punjab", "min_price": 2250.0, "max_price": 2400.0, "modal_price": 2325.0, "unit": "quintal", "date": today},
            {"commodity": "Rice", "market": "Amritsar", "district": "Amritsar", "state": "Punjab", "min_price": 3100.0, "max_price": 3450.0, "modal_price": 3280.0, "unit": "quintal", "date": today},
            {"commodity": "Cotton", "market": "Jalandhar", "district": "Jalandhar", "state": "Punjab", "min_price": 6800.0, "max_price": 7400.0, "modal_price": 7150.0, "unit": "quintal", "date": today},

            # Madhya Pradesh Mandis
            {"commodity": "Soybean", "market": "Indore", "district": "Indore", "state": "Madhya Pradesh", "min_price": 4350.0, "max_price": 4750.0, "modal_price": 4580.0, "unit": "quintal", "date": today},
            {"commodity": "Wheat", "market": "Ujjain", "district": "Ujjain", "state": "Madhya Pradesh", "min_price": 2300.0, "max_price": 2550.0, "modal_price": 2420.0, "unit": "quintal", "date": today},
            {"commodity": "Gram", "market": "Bhopal", "district": "Bhopal", "state": "Madhya Pradesh", "min_price": 5700.0, "max_price": 6100.0, "modal_price": 5920.0, "unit": "quintal", "date": today},

            # Maharashtra Mandis
            {"commodity": "Onion", "market": "Lasalgaon", "district": "Nashik", "state": "Maharashtra", "min_price": 1400.0, "max_price": 1950.0, "modal_price": 1700.0, "unit": "quintal", "date": today},
            {"commodity": "Tomato", "market": "Pune", "district": "Pune", "state": "Maharashtra", "min_price": 1450.0, "max_price": 1850.0, "modal_price": 1650.0, "unit": "quintal", "date": today},
            {"commodity": "Cotton", "market": "Nagpur", "district": "Nagpur", "state": "Maharashtra", "min_price": 7000.0, "max_price": 7600.0, "modal_price": 7320.0, "unit": "quintal", "date": today},
        ]

    def fetch_prices(
        self,
        commodity: Optional[str] = None,
        state: Optional[str] = None,
        district: Optional[str] = None,
        market: Optional[str] = None,
        limit: int = 50,
    ) -> MandiPricesResponse:
        filtered: List[MandiPriceRecord] = []

        comm_q = commodity.strip().lower() if commodity else None
        state_q = state.strip().lower() if state else None
        dist_q = district.strip().lower() if district else None
        market_q = market.strip().lower() if market else None

        for item in self._seed_data:
            if comm_q and comm_q not in item["commodity"].lower():
                continue
            if state_q and state_q not in item["state"].lower():
                continue
            if dist_q and dist_q not in item["district"].lower():
                continue
            if market_q and market_q not in item["market"].lower():
                continue

            filtered.append(MandiPriceRecord(**item))
            if len(filtered) >= limit:
                break

        now_iso = datetime.now(timezone.utc).isoformat()
        return MandiPricesResponse(
            success=True,
            data_mode="DEMO",
            provider=self.PROVIDER_NAME,
            last_updated=now_iso,
            total_records=len(filtered),
            prices=filtered,
            cached=False,
        )


class LiveMandiProvider(MandiProviderBase):
    """Live Agmarknet / data.gov.in market price provider."""

    PROVIDER_NAME = "data.gov.in Agmarknet"

    def __init__(self, api_key: str, base_url: str, timeout_seconds: float = 10.0):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds

    def _http_get(self, url: str, params: Dict[str, Any]) -> httpx.Response:
        """Execute HTTP GET request against the government API endpoint."""
        with httpx.Client(timeout=self.timeout_seconds) as client:
            return client.get(url, params=params)

    def fetch_prices(
        self,
        commodity: Optional[str] = None,
        state: Optional[str] = None,
        district: Optional[str] = None,
        market: Optional[str] = None,
        limit: int = 50,
    ) -> MandiPricesResponse:
        params: Dict[str, Any] = {
            "api-key": self.api_key,
            "format": "json",
            "limit": limit,
        }
        if commodity:
            params["filters[commodity]"] = commodity.strip()
        if state:
            params["filters[state]"] = state.strip()
        if district:
            params["filters[district]"] = district.strip()
        if market:
            params["filters[market]"] = market.strip()

        try:
            resp = self._http_get(self.base_url, params=params)
        except httpx.TimeoutException:
            logger.error("Live Mandi API timed out after %s seconds", self.timeout_seconds)
            raise MandiUnavailableError("Market price service request timed out.")
        except httpx.RequestError as exc:
            logger.error("Network error connecting to Live Mandi API: %s", exc)
            raise MandiUnavailableError("Market price service is temporarily unreachable.")

        if resp.status_code == 401:
            logger.error("Mandi API key unauthorized (401)")
            raise MandiAuthError("Market price provider authentication failed.")
        elif resp.status_code == 429:
            logger.warning("Mandi API rate limit exceeded (429)")
            raise MandiRateLimitError("Market price provider rate limit exceeded. Please try again later.")
        elif resp.status_code >= 500:
            logger.error("Mandi API upstream error (%s)", resp.status_code)
            raise MandiUnavailableError("Market price provider is currently experiencing issues.")
        elif resp.status_code != 200:
            logger.error("Mandi API unexpected status: %s", resp.status_code)
            raise MandiUnavailableError(f"Market price provider returned status {resp.status_code}.")

        try:
            data = resp.json()
        except Exception as json_err:
            logger.error("Failed to parse Mandi API response JSON: %s", json_err)
            raise MandiUnavailableError("Malformed response received from market price provider.")

        if not isinstance(data, dict) or "records" not in data:
            logger.error("Malformed Mandi response schema: %s", data)
            raise MandiUnavailableError("Malformed market price data structure received from provider.")

        raw_records = data.get("records", [])
        mapped_prices: List[MandiPriceRecord] = []
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        for r in raw_records:
            try:
                min_p = float(r.get("min_price", 0.0))
                max_p = float(r.get("max_price", 0.0))
                modal_p = float(r.get("modal_price", (min_p + max_p) / 2 if (min_p and max_p) else 0.0))
                record = MandiPriceRecord(
                    commodity=r.get("commodity", "Unknown"),
                    market=r.get("market", "Unknown"),
                    district=r.get("district", "Unknown"),
                    state=r.get("state", "Unknown"),
                    min_price=min_p,
                    max_price=max_p,
                    modal_price=modal_p,
                    unit=r.get("unit", "quintal"),
                    date=r.get("arrival_date", today),
                )
                mapped_prices.append(record)
            except Exception as parse_err:
                logger.warning("Skipping malformed mandi record %s: %s", r, parse_err)
                continue

        now_iso = datetime.now(timezone.utc).isoformat()
        return MandiPricesResponse(
            success=True,
            data_mode="LIVE",
            provider=self.PROVIDER_NAME,
            last_updated=data.get("updated_date", now_iso),
            total_records=len(mapped_prices),
            prices=mapped_prices,
            cached=False,
        )


class MandiService:
    """Service orchestrating Mandi price lookups, caching, and provider delegation."""

    _instance: Optional["MandiService"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MandiService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        self.ttl_seconds = MANDI_CACHE_TTL_SECONDS
        self.timeout_seconds = MANDI_TIMEOUT_SECONDS
        self._cache: Dict[str, Tuple[float, Dict[str, Any]]] = {}
        self._cache_lock = threading.Lock()
        self._demo_provider = DemoMandiProvider()
        self._initialized = True

    def get_api_key(self) -> str:
        """Dynamically retrieve Mandi API key, reloading .env if needed."""
        load_dotenv(BASE_DIR / ".env", override=False)
        key = os.getenv("MANDI_API_KEY", MANDI_API_KEY).strip()
        if not key:
            load_dotenv(BASE_DIR / ".env", override=True)
            key = os.getenv("MANDI_API_KEY", "").strip()
        return key

    def get_data_mode_setting(self) -> str:
        """Get configured data mode setting ('AUTO', 'LIVE', or 'DEMO')."""
        return os.getenv("MANDI_DATA_MODE", MANDI_DATA_MODE).strip().upper()

    def get_active_provider(self) -> MandiProviderBase:
        """Determine active provider based on configuration and available credentials."""
        mode_setting = self.get_data_mode_setting()
        api_key = self.get_api_key()

        if mode_setting == "DEMO":
            return self._demo_provider

        if api_key:
            base_url = os.getenv("MANDI_API_BASE_URL", MANDI_API_BASE_URL).strip()
            return LiveMandiProvider(api_key=api_key, base_url=base_url, timeout_seconds=self.timeout_seconds)

        return self._demo_provider

    def clear_cache(self) -> None:
        """Clear in-memory cache."""
        with self._cache_lock:
            self._cache.clear()

    def _get_cache_key(
        self,
        provider_type: str,
        commodity: Optional[str],
        state: Optional[str],
        district: Optional[str],
        market: Optional[str],
        limit: int,
    ) -> str:
        return f"{provider_type}_{commodity or ''}_{state or ''}_{district or ''}_{market or ''}_{limit}".lower()

    def get_market_prices(
        self,
        commodity: Optional[str] = None,
        state: Optional[str] = None,
        district: Optional[str] = None,
        market: Optional[str] = None,
        limit: int = 50,
    ) -> MandiPricesResponse:
        """Fetch market price records using active provider and short-lived caching."""
        provider = self.get_active_provider()
        provider_key = "live" if isinstance(provider, LiveMandiProvider) else "demo"
        cache_key = self._get_cache_key(provider_key, commodity, state, district, market, limit)
        now = time.time()

        # Check in-memory cache
        with self._cache_lock:
            if cache_key in self._cache:
                cached_at, cached_payload = self._cache[cache_key]
                if now - cached_at < self.ttl_seconds:
                    logger.info("Serving mandi prices from in-memory cache for key: %s", cache_key)
                    resp_data = cached_payload.copy()
                    resp_data["cached"] = True
                    return MandiPricesResponse(**resp_data)
                else:
                    del self._cache[cache_key]

        # Fetch fresh data from provider
        response = provider.fetch_prices(
            commodity=commodity,
            state=state,
            district=district,
            market=market,
            limit=limit,
        )

        # Cache fresh response
        with self._cache_lock:
            if len(self._cache) > 500:
                self._cache.clear()
            self._cache[cache_key] = (now, response.model_dump())

        return response


# Singleton instance
mandi_service = MandiService()
