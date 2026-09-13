from typing import Optional, Any
from pydantic import BaseModel


class ErrorResponse(BaseModel):
    """Structured error contract required by the API specification."""

    success: bool = False
    error: str
    message: str
    details: Optional[Any] = None


class SuccessResponse(BaseModel):
    """Standard success confirmation response."""

    success: bool = True
    message: str
