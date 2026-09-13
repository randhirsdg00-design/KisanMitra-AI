"""Pydantic schemas for Mandi / Agricultural Market Prices."""

from typing import List, Optional
from pydantic import BaseModel, Field


class MandiPriceRecord(BaseModel):
    """Individual agricultural market price record."""

    commodity: str = Field(..., description="Crop or commodity name (e.g. Wheat, Rice, Potato)")
    market: str = Field(..., description="Mandi or APMC market yard name")
    district: str = Field(..., description="District name")
    state: str = Field(..., description="State name")
    min_price: float = Field(..., description="Minimum recorded price per unit (INR ₹)")
    max_price: float = Field(..., description="Maximum recorded price per unit (INR ₹)")
    modal_price: float = Field(..., description="Prevailing / modal market price per unit (INR ₹)")
    unit: str = Field("quintal", description="Unit of measurement (default: quintal / 100 kg)")
    date: str = Field(..., description="Reporting date of market prices (YYYY-MM-DD)")


class MandiPricesResponse(BaseModel):
    """Mandi prices response envelope."""

    success: bool = Field(True, description="Indicates whether the request succeeded")
    data_mode: str = Field(..., description="Data mode: 'LIVE' for verified upstream API or 'DEMO' for labeled sample dataset")
    provider: str = Field(..., description="Market data provider name")
    last_updated: str = Field(..., description="Timestamp of latest data update")
    total_records: int = Field(..., description="Total matching price records returned")
    prices: List[MandiPriceRecord] = Field(default_factory=list, description="List of market price records")
    cached: bool = Field(False, description="Whether this response was served from cache")
