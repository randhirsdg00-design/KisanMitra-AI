import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class FarmBase(BaseModel):
    farm_name: str = Field(..., min_length=1, max_length=128, description="Name of the farm")
    crop: str = Field(..., min_length=1, max_length=64, description="Primary crop cultivated")
    land_area: float = Field(..., gt=0, description="Area of farm land (must be positive)")
    land_unit: str = Field(default="acres", min_length=1, max_length=32, description="Unit of measurement (acres, hectares, bigha)")
    soil_type: str = Field(..., min_length=1, max_length=64, description="Soil classification (e.g. Alluvial, Black, Red)")
    irrigation_type: str = Field(..., min_length=1, max_length=64, description="Irrigation method (e.g. Drip, Canal, Rainfed)")
    location: str = Field(..., min_length=1, max_length=255, description="Geographic location or village/district")
    sowing_date: Optional[datetime.datetime] = Field(default=None, description="Date and time of crop sowing")


class FarmCreate(FarmBase):
    pass


class FarmUpdate(BaseModel):
    farm_name: Optional[str] = Field(default=None, min_length=1, max_length=128)
    crop: Optional[str] = Field(default=None, min_length=1, max_length=64)
    land_area: Optional[float] = Field(default=None, gt=0)
    land_unit: Optional[str] = Field(default=None, min_length=1, max_length=32)
    soil_type: Optional[str] = Field(default=None, min_length=1, max_length=64)
    irrigation_type: Optional[str] = Field(default=None, min_length=1, max_length=64)
    location: Optional[str] = Field(default=None, min_length=1, max_length=255)
    sowing_date: Optional[datetime.datetime] = None


class FarmResponse(FarmBase):
    id: int
    user_id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
