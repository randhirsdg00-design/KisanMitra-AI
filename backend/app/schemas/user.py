import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

# Regular expression for email validation without external email-validator package dependency
EMAIL_REGEX = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"


class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    email: str = Field(..., pattern=EMAIL_REGEX, description="Valid email address")
    preferred_language: str = Field(default="en", max_length=10)


class UserCreate(UserBase):
    external_auth_id: Optional[str] = Field(default=None, max_length=128)


class UserUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=128)
    email: Optional[str] = Field(default=None, pattern=EMAIL_REGEX)
    preferred_language: Optional[str] = Field(default=None, max_length=10)


class UserResponse(UserBase):
    id: int
    external_auth_id: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
