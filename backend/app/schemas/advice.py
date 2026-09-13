import datetime
from pydantic import BaseModel, ConfigDict, Field


class SavedAdviceCreate(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000, description="Farmer's query")
    answer: str = Field(..., min_length=1, max_length=4000, description="Provided agricultural advisory")
    language: str = Field(default="en", max_length=10, description="Language code")


class SavedAdviceResponse(BaseModel):
    id: int
    user_id: int
    question: str
    answer: str
    language: str
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
