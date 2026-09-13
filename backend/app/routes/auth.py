from fastapi import APIRouter, Depends, status
from backend.app.core.dependencies import get_current_firebase_user
from backend.app.schemas.auth import (
    AuthenticatedUser,
    AuthMeResponse,
    AuthStatusResponse,
)
from backend.app.services.firebase_auth import firebase_auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get(
    "/status",
    response_model=AuthStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Firebase Authentication backend status",
)
def get_auth_status():
    """Report readiness of Firebase Authentication backend without exposing credentials."""
    return AuthStatusResponse(
        firebase_auth_configured=firebase_auth_service.is_configured(),
        provider="Firebase",
    )


@router.get(
    "/me",
    response_model=AuthMeResponse,
    status_code=status.HTTP_200_OK,
    summary="Get authenticated user profile from verified Firebase token",
)
def get_authenticated_user(
    current_user: AuthenticatedUser = Depends(get_current_firebase_user),
):
    """Protected endpoint verifying caller identity from Firebase ID Token.

    Requires:
        Authorization: Bearer <firebase_id_token>
    """
    return AuthMeResponse(
        authenticated=True,
        uid=current_user.uid,
        email=current_user.email,
        name=current_user.name,
    )
