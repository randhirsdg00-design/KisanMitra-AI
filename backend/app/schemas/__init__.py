"""Schemas package re-exporting all API transfer models."""

from backend.app.schemas.common import ErrorResponse, SuccessResponse
from backend.app.schemas.user import UserBase, UserCreate, UserUpdate, UserResponse
from backend.app.schemas.farm import FarmBase, FarmCreate, FarmUpdate, FarmResponse
from backend.app.schemas.history import ScanHistoryCreate, ScanHistoryResponse
from backend.app.schemas.advice import SavedAdviceCreate, SavedAdviceResponse
from backend.app.schemas.reminder import (
    ReminderBase,
    ReminderCreate,
    ReminderUpdate,
    ReminderResponse,
)
from backend.app.schemas.notification import (
    NotificationPreferenceUpdate,
    NotificationPreferenceResponse,
)
from backend.app.schemas.assistant import (
    ChatMessage,
    FarmContext,
    AssistantChatRequest,
    AssistantChatResponse,
    AssistantStatusResponse,
)
from backend.app.schemas.auth import (
    AuthenticatedUser,
    AuthMeResponse,
    AuthStatusResponse,
)
from backend.app.schemas.weather import (
    LocationInfo,
    WeatherData,
    WeatherResponse,
)
from backend.app.schemas.mandi import (
    MandiPriceRecord,
    MandiPricesResponse,
)

__all__ = [
    "ErrorResponse",
    "SuccessResponse",
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "FarmBase",
    "FarmCreate",
    "FarmUpdate",
    "FarmResponse",
    "ScanHistoryCreate",
    "ScanHistoryResponse",
    "SavedAdviceCreate",
    "SavedAdviceResponse",
    "ReminderBase",
    "ReminderCreate",
    "ReminderUpdate",
    "ReminderResponse",
    "NotificationPreferenceUpdate",
    "NotificationPreferenceResponse",
    "ChatMessage",
    "FarmContext",
    "AssistantChatRequest",
    "AssistantChatResponse",
    "AssistantStatusResponse",
    "AuthenticatedUser",
    "AuthMeResponse",
    "AuthStatusResponse",
    "LocationInfo",
    "WeatherData",
    "WeatherResponse",
    "MandiPriceRecord",
    "MandiPricesResponse",
]
