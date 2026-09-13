"""Pydantic schemas for Weather and Geocoding APIs."""

from typing import Optional
from pydantic import BaseModel, Field


class LocationInfo(BaseModel):
    """Geocoded location information."""

    name: Optional[str] = Field(None, description="City, town, or locality name")
    state: Optional[str] = Field(None, description="State or province name")
    country: Optional[str] = Field(None, description="ISO two-letter country code")
    latitude: float = Field(..., description="Latitude coordinate")
    longitude: float = Field(..., description="Longitude coordinate")


class WeatherData(BaseModel):
    """Current weather metrics in metric units."""

    temperature: float = Field(..., description="Current temperature in Celsius (°C)")
    feels_like: float = Field(..., description="Perceived temperature in Celsius (°C)")
    condition: str = Field(..., description="Primary weather condition (e.g. Clear, Clouds, Rain)")
    description: str = Field(..., description="Detailed weather description")
    humidity: int = Field(..., description="Relative humidity percentage (0-100)")
    wind_speed: float = Field(..., description="Wind speed in kilometers per hour (km/h)")
    rain: float = Field(0.0, description="Precipitation volume in millimeters (mm)")


class WeatherResponse(BaseModel):
    """Structured weather response envelope."""

    success: bool = Field(True, description="Indicates whether the request succeeded")
    location: LocationInfo = Field(..., description="Geocoded location details")
    weather: WeatherData = Field(..., description="Atmospheric weather details")
    provider: str = Field("OpenWeather", description="Weather data provider")
    cached: bool = Field(False, description="Whether this response was served from cache")
