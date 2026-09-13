from typing import Optional
from pydantic import BaseModel, Field


class AuthenticatedUser(BaseModel):
    """Authenticated user context extracted from verified Firebase ID token."""

    uid: str = Field(..., description="Firebase Unique User Identifier")
    email: Optional[str] = Field(default=None, description="User email address")
    name: Optional[str] = Field(default=None, description="Display name if present")
    email_verified: Optional[bool] = Field(default=None, description="Email verification flag")


class AuthMeResponse(BaseModel):
    """Payload returned by the protected /api/auth/me verification endpoint."""

    authenticated: bool = Field(default=True, description="Authentication confirmation")
    uid: str = Field(..., description="Firebase User UID")
    email: Optional[str] = Field(default=None, description="User email address")
    name: Optional[str] = Field(default=None, description="Display name if present")


class AuthStatusResponse(BaseModel):
    """Readiness status of the Firebase Authentication backend configuration."""

    firebase_auth_configured: bool = Field(
        ..., description="Whether valid Firebase Admin credentials are loaded"
    )
    provider: str = Field(default="Firebase", description="Identity provider name")
