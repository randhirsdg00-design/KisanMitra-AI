"""Unit and integration tests for Firebase Authentication backend.

Tests token verification, error scenarios, unconfigured states, and protected endpoints.
Uses mocked Firebase tokens and admin SDK to test without live GCP credentials.
"""

from unittest.mock import patch
import pytest
from fastapi import HTTPException
from firebase_admin import auth

from backend.app.core.dependencies import get_current_firebase_user
from backend.app.schemas.auth import AuthenticatedUser
from backend.app.services.firebase_auth import firebase_auth_service


class TestAuthStatus:
    """Tests for GET /api/auth/status."""

    def test_auth_status_unconfigured(self, client):
        """When Firebase credentials are not set, status returns 200 with configured=False."""
        with patch.object(firebase_auth_service, "is_configured", return_value=False):
            response = client.get("/api/auth/status")
            assert response.status_code == 200
            data = response.json()
            assert data["firebase_auth_configured"] is False
            assert data["provider"] == "Firebase"

    def test_auth_status_configured(self, client):
        """When Firebase credentials are present and initialized, configured is True."""
        with patch.object(firebase_auth_service, "is_configured", return_value=True):
            response = client.get("/api/auth/status")
            assert response.status_code == 200
            data = response.json()
            assert data["firebase_auth_configured"] is True
            assert data["provider"] == "Firebase"


class TestAuthMeProtectedEndpoint:
    """Tests for GET /api/auth/me token verification and error states."""

    def test_missing_authorization_header(self, client):
        """Requests without Authorization header must receive 401 with structured error."""
        response = client.get("/api/auth/me")
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"] == "unauthorized"
        assert "Missing Authorization header" in data["message"]
        assert "Bearer" in response.headers.get("www-authenticate", "")

    def test_malformed_authorization_header_non_bearer(self, client):
        """Requests with non-Bearer tokens must receive 401."""
        response = client.get("/api/auth/me", headers={"Authorization": "Basic dXNlcjpwYXNz"})
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"] == "unauthorized"
        assert "Bearer" in data["message"]

    def test_malformed_authorization_header_single_word(self, client):
        """Requests with 'Bearer' and no token must receive 401."""
        response = client.get("/api/auth/me", headers={"Authorization": "Bearer"})
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"] == "unauthorized"
        assert "Invalid Authorization header format" in data["message"]

    def test_unconfigured_firebase_service_returns_401(self, client):
        """When Firebase Admin is unconfigured, token verification returns 401."""
        with patch.object(firebase_auth_service, "is_configured", return_value=False):
            response = client.get("/api/auth/me", headers={"Authorization": "Bearer sample_token_123"})
            assert response.status_code == 401
            data = response.json()
            assert data["success"] is False
            assert data["error"] == "unauthorized"
            assert "unconfigured" in data["message"].lower()

    def test_invalid_firebase_token(self, client):
        """An invalid Firebase ID token must return 401 Unauthorized."""
        with patch.object(firebase_auth_service, "is_configured", return_value=True):
            with patch("firebase_admin.auth.verify_id_token", side_effect=auth.InvalidIdTokenError("Invalid token format")):
                response = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid_jwt_token"})
                assert response.status_code == 401
                data = response.json()
                assert data["success"] is False
                assert data["error"] == "unauthorized"
                assert "Invalid Firebase ID token" in data["message"]

    def test_expired_firebase_token(self, client):
        """An expired Firebase ID token must return 401 with an expired explanation."""
        with patch.object(firebase_auth_service, "is_configured", return_value=True):
            with patch("firebase_admin.auth.verify_id_token", side_effect=auth.ExpiredIdTokenError("Expired", None)):
                response = client.get("/api/auth/me", headers={"Authorization": "Bearer expired_jwt_token"})
                assert response.status_code == 401
                data = response.json()
                assert data["success"] is False
                assert data["error"] == "unauthorized"
                assert "expired" in data["message"].lower()

    def test_valid_firebase_token_returns_user_profile(self, client):
        """A verified Firebase ID token must decode claims and return user profile with 200 OK."""
        mock_claims = {
            "uid": "fb_user_kisan_123",
            "email": "farmer.ramesh@kisanmitra.ai",
            "name": "Ramesh Patel",
            "email_verified": True,
        }
        with patch.object(firebase_auth_service, "is_configured", return_value=True):
            with patch("firebase_admin.auth.verify_id_token", return_value=mock_claims):
                response = client.get("/api/auth/me", headers={"Authorization": "Bearer valid_firebase_token_xyz"})
                assert response.status_code == 200
                data = response.json()
                assert data["authenticated"] is True
                assert data["uid"] == "fb_user_kisan_123"
                assert data["email"] == "farmer.ramesh@kisanmitra.ai"
                assert data["name"] == "Ramesh Patel"


class TestFirebaseAuthDependencyDirect:
    """Direct unit tests for the get_current_firebase_user FastAPI dependency."""

    def test_dependency_no_header_raises_401(self):
        with pytest.raises(HTTPException) as exc_info:
            get_current_firebase_user(authorization=None)
        assert exc_info.value.status_code == 401
        assert "Missing" in exc_info.value.detail

    def test_dependency_empty_token_raises_401(self):
        with pytest.raises(HTTPException) as exc_info:
            get_current_firebase_user(authorization="Bearer ")
        assert exc_info.value.status_code == 401

    def test_dependency_success(self):
        mock_claims = {
            "uid": "uid_456",
            "email": "test@kisanmitra.ai",
            "name": "Test User",
            "email_verified": True,
        }
        with patch.object(firebase_auth_service, "verify_id_token", return_value=mock_claims):
            user = get_current_firebase_user(authorization="Bearer test_token")
            assert isinstance(user, AuthenticatedUser)
            assert user.uid == "uid_456"
            assert user.email == "test@kisanmitra.ai"
            assert user.name == "Test User"
            assert user.email_verified is True
