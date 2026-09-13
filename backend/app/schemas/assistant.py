from typing import Optional, List, Literal
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """A single dialogue turn in the conversation history."""

    role: Literal["user", "assistant", "model", "system"] = Field(
        ..., description="Speaker role in dialogue"
    )
    content: str = Field(..., min_length=1, max_length=2000, description="Message content")


class FarmContext(BaseModel):
    """Optional contextual data describing the farmer's active farm."""

    farm_name: Optional[str] = Field(default=None, max_length=128)
    crop: Optional[str] = Field(default=None, max_length=64)
    area: Optional[float] = Field(default=None, gt=0)
    soil_type: Optional[str] = Field(default=None, max_length=64)
    irrigation_type: Optional[str] = Field(default=None, max_length=64)
    sowing_date: Optional[str] = Field(default=None, max_length=64)
    location: Optional[str] = Field(default=None, max_length=255)


class AssistantChatRequest(BaseModel):
    """Request payload for KisanMitra AI Assistant."""

    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="User query or message directed to KisanMitra AI",
    )
    ui_language: Optional[str] = Field(
        default="en",
        max_length=20,
        description="Frontend UI language (does not constrain conversation language)",
    )
    conversation_language: Optional[str] = Field(
        default=None,
        max_length=50,
        description="Requested conversation language (e.g., 'Hindi', 'Bhojpuri', 'English')",
    )
    auto_detect: bool = Field(
        default=True,
        description="Automatically detect the user's message language if true",
    )
    mode_preference: Optional[str] = Field(
        default="standard",
        max_length=50,
        description="Inference mode preference ('standard', 'expert', etc.)",
    )
    language: Optional[str] = Field(
        default=None,
        max_length=50,
        description="Convenience alias for conversation_language",
    )
    conversation_history: Optional[List[ChatMessage]] = Field(
        default=None,
        max_length=10,
        description="Optional prior conversation turns (max 10 for rate/token protection)",
    )
    farm_context: Optional[FarmContext] = Field(
        default=None,
        description="Optional farm details to personalize agricultural recommendations",
    )


class AssistantChatResponse(BaseModel):
    """Structured response from the KisanMitra AI Assistant."""

    success: bool
    reply: Optional[str] = None
    mode: str = Field(..., description="'ONLINE_AI' or 'ERROR'")
    engine: str = "Gemini"
    provider: str = "Gemini"
    language: str
    tts_language: str
    detected_language: str
    model_info: str
    error: Optional[str] = None


class AssistantStatusResponse(BaseModel):
    """Health and configuration readiness status of the Gemini AI integration."""

    configured: bool
    api_key_present: bool
    provider: str = "Gemini"
    mode: str
    status: str
