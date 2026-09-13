import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ScanHistoryCreate(BaseModel):
    crop: str = Field(..., min_length=1, max_length=64, description="Diagnosed crop")
    disease: str = Field(..., min_length=1, max_length=128, description="Identified disease or condition")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model prediction confidence score (0.0 - 1.0)")
    model_mode: str = Field(default="standard", min_length=1, max_length=64, description="Diagnosis mode")
    image_reference: Optional[str] = Field(default=None, max_length=512, description="Image path or cloud URL (optional)")
    user_id: Optional[int] = Field(default=None, description="User ID if authenticated, or null for guest scans")


class ScanHistoryResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    crop: str
    disease: str
    confidence: float
    model_mode: str
    image_reference: Optional[str] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
