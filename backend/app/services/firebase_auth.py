import os
import logging
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
import firebase_admin
from firebase_admin import auth, credentials
from dotenv import load_dotenv

from backend.app.config import (
    BASE_DIR,
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
)

logger = logging.getLogger("kisanmitra.auth")


class FirebaseAuthService:
    """Service for managing Firebase Admin SDK initialization and ID token verification."""

    _instance: Optional["FirebaseAuthService"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FirebaseAuthService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._app: Optional[firebase_admin.App] = None
        self._initialized = True
        self._try_initialize()

    def _get_credentials_data(self) -> Optional[Dict[str, str]]:
        """Retrieve Firebase Admin credentials dynamically from environment, reloading .env if needed."""
        # Check current process environment, fallback to fresh reload from backend/.env
        load_dotenv(BASE_DIR / ".env", override=False)

        project_id = os.getenv("FIREBASE_PROJECT_ID", FIREBASE_PROJECT_ID).strip()
        client_email = os.getenv("FIREBASE_CLIENT_EMAIL", FIREBASE_CLIENT_EMAIL).strip()
        raw_key = os.getenv("FIREBASE_PRIVATE_KEY", FIREBASE_PRIVATE_KEY).strip()

        if not (project_id and client_email and raw_key):
            load_dotenv(BASE_DIR / ".env", override=True)
            project_id = os.getenv("FIREBASE_PROJECT_ID", "").strip()
            client_email = os.getenv("FIREBASE_CLIENT_EMAIL", "").strip()
            raw_key = os.getenv("FIREBASE_PRIVATE_KEY", "").strip()

        if project_id and client_email and raw_key:
            # Normalize escaped newlines in private key
            private_key = raw_key.replace("\\n", "\n")
            return {
                "type": "service_account",
                "project_id": project_id,
                "client_email": client_email,
                "private_key": private_key,
                "token_uri": "https://oauth2.googleapis.com/token",
            }

        # Check if a credentials JSON file path was supplied
        cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "").strip()
        if cred_path and os.path.exists(cred_path):
            return {"file_path": cred_path}

        return None

    def _try_initialize(self) -> bool:
        """Attempt to initialize Firebase Admin SDK if not already initialized and credentials exist."""
        if firebase_admin._apps:
            self._app = firebase_admin.get_app()
            return True

        cred_data = self._get_credentials_data()
        if not cred_data:
            logger.info("Firebase Admin credentials not found. Backend running in unconfigured auth mode.")
            return False

        try:
            if "file_path" in cred_data:
                cred = credentials.Certificate(cred_data["file_path"])
            else:
                cred = credentials.Certificate(cred_data)

            self._app = firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK initialized successfully for project: %s", cred_data.get("project_id", "custom"))
            return True
        except Exception as exc:
            logger.error("Failed to initialize Firebase Admin SDK: %s", exc)
            return False

    def is_configured(self) -> bool:
        """Check whether Firebase Admin authentication is configured and active."""
        if firebase_admin._apps:
            return True
        return self._try_initialize()

    def verify_id_token(self, id_token: str) -> Dict[str, Any]:
        """Verify Firebase ID token and extract claims.

        Raises:
            HTTPException (401 / 503) on invalid, expired, revoked, or unconfigured states.
        """
        if not self.is_configured():
            logger.warning("Authentication attempt while Firebase Admin is unconfigured.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication service is currently unconfigured.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not id_token or not isinstance(id_token, str):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or empty authentication token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        try:
            # Cryptographically verify the ID token with Firebase
            decoded_token = auth.verify_id_token(id_token)
            return decoded_token
        except auth.ExpiredIdTokenError:
            logger.info("Authentication failed: Expired ID token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Firebase ID token has expired. Please refresh your session.",
                headers={"WWW-Authenticate": "Bearer error=\"invalid_token\", error_description=\"Token expired\""},
            )
        except (auth.InvalidIdTokenError, auth.RevokedIdTokenError, ValueError) as inv_err:
            logger.info("Authentication failed: Invalid ID token (%s)", type(inv_err).__name__)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Firebase ID token.",
                headers={"WWW-Authenticate": "Bearer error=\"invalid_token\""},
            )
        except Exception as exc:
            logger.error("Unexpected error during Firebase token verification: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to authenticate token.",
                headers={"WWW-Authenticate": "Bearer"},
            )


# Singleton instance
firebase_auth_service = FirebaseAuthService()
