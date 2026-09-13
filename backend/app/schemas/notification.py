import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class NotificationPreferenceUpdate(BaseModel):
    weather_alerts: Optional[bool] = Field(default=None, description="Enable weather forecast & alert notices")
    mandi_alerts: Optional[bool] = Field(default=None, description="Enable mandi commodity price change alerts")
    scheme_alerts: Optional[bool] = Field(default=None, description="Enable government agricultural scheme alerts")
    disease_alerts: Optional[bool] = Field(default=None, description="Enable localized crop disease outbreak alerts")


class NotificationPreferenceResponse(BaseModel):
    id: int
    user_id: int
    weather_alerts: bool
    mandi_alerts: bool
    scheme_alerts: bool
    disease_alerts: bool
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
