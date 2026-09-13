from fastapi import APIRouter, status
from backend.app.schemas.assistant import (
    AssistantChatRequest,
    AssistantChatResponse,
    AssistantStatusResponse,
)
from backend.app.services.gemini_service import gemini_service

router = APIRouter(prefix="/assistant", tags=["KisanMitra AI Assistant"])


@router.get(
    "/status",
    response_model=AssistantStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Get AI assistant service status",
)
def get_assistant_status():
    """Check configuration readiness of the Gemini AI integration without revealing secrets."""
    is_conf = gemini_service.is_configured()
    return AssistantStatusResponse(
        configured=is_conf,
        api_key_present=is_conf,
        provider="Gemini",
        mode="ONLINE_AI" if is_conf else "NOT_CONFIGURED",
        status="ready" if is_conf else "not_configured",
    )


@router.post(
    "/chat",
    response_model=AssistantChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Chat with KisanMitra agricultural AI assistant",
)
def chat_with_assistant(request: AssistantChatRequest):
    """Generate agricultural advisory response using Google Gemini AI.

    Provides localized agricultural guidance, crop diagnostics precautions,
    farm-specific personalization, and multi-language support.
    """
    response_data = gemini_service.generate_chat_response(request)
    return response_data
