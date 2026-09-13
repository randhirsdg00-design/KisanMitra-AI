import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ReminderBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Reminder task title")
    description: Optional[str] = Field(default=None, max_length=1000, description="Task details")
    due_at: datetime.datetime = Field(..., description="Target due date and time")
    completed: bool = Field(default=False, description="Completion status flag")


class ReminderCreate(ReminderBase):
    pass


class ReminderUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    due_at: Optional[datetime.datetime] = None
    completed: Optional[bool] = None


class ReminderResponse(ReminderBase):
    id: int
    user_id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
