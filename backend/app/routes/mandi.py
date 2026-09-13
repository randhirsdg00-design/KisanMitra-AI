"""Mandi / Market Price API routes."""

from typing import Optional
from fastapi import APIRouter, Query, status

from backend.app.schemas.mandi import MandiPricesResponse
from backend.app.services.mandi_service import mandi_service

router = APIRouter(prefix="/mandi", tags=["Mandi / Market Prices"])


@router.get(
    "/prices",
    response_model=MandiPricesResponse,
    status_code=status.HTTP_200_OK,
    summary="Get agricultural market prices with filtering and pagination",
)
def get_mandi_prices(
    commodity: Optional[str] = Query(
        default=None,
        max_length=50,
        description="Filter by commodity or crop name (e.g. Wheat, Rice, Potato)",
    ),
    state: Optional[str] = Query(
        default=None,
        max_length=50,
        description="Filter by state (e.g. Bihar, Uttar Pradesh)",
    ),
    district: Optional[str] = Query(
        default=None,
        max_length=50,
        description="Filter by district (e.g. Patna, Varanasi)",
    ),
    market: Optional[str] = Query(
        default=None,
        max_length=50,
        description="Filter by APMC mandi or market name",
    ),
    limit: int = Query(
        default=50,
        ge=1,
        le=200,
        description="Maximum records to retrieve (1 to 200)",
    ),
):
    """Retrieve current APMC mandi market prices with filtering by commodity, state, district, or market.

    Provides transparent `data_mode` ("LIVE" for verified government API feeds or "DEMO" for curated sample data).
    """
    return mandi_service.get_market_prices(
        commodity=commodity,
        state=state,
        district=district,
        market=market,
        limit=limit,
    )
