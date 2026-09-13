"""Authentication and request dependencies.

Contains both development prototyping authentication and production-ready
Firebase Authentication verification via Firebase Admin SDK.
"""

from typing import Optional
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.database.models import User, NotificationPreference
from backend.app.core.exceptions import NotFoundError
from backend.app.services.firebase_auth import firebase_auth_service
from backend.app.schemas.auth import AuthenticatedUser


def get_current_dev_user(
    db: Session = Depends(get_db),
    x_dev_user_id: Optional[int] = Header(
        default=None,
        alias="X-Dev-User-Id",
        description="Optional dev user ID header for testing multiple users (temporary mechanism)",
    ),
) -> User:
    """Resolve the current user in development mode.

    Defaults to the seeded developer farmer (id=1).
    If X-Dev-User-Id is passed, loads or creates that development user.
    """
    target_user_id = x_dev_user_id if x_dev_user_id is not None else 1

    user = db.query(User).filter(User.id == target_user_id).first()
    if not user:
        if x_dev_user_id is not None:
            # If a specific dev user id was requested but not found, create a dev placeholder
            user = User(
                id=target_user_id,
                name=f"Dev User {target_user_id}",
                email=f"devuser{target_user_id}@kisanmitra.ai",
                preferred_language="en",
            )
            db.add(user)
            db.flush()
            pref = NotificationPreference(user_id=user.id)
            db.add(pref)
            db.commit()
            db.refresh(user)
        else:
            raise NotFoundError("Default development user not found. Please run init_db().")

    return user


def get_current_firebase_user(
    authorization: Optional[str] = Header(
        default=None,
        description="Firebase ID Token in 'Bearer <token>' format",
    ),
) -> AuthenticatedUser:
    """Verify incoming Firebase ID Token from Authorization header and extract user identity.

    Does not trust client-supplied UIDs; decodes the cryptographically signed JWT via Firebase Admin SDK.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.strip().split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format. Expected 'Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    id_token = parts[1].strip()
    if not id_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Empty Bearer authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    decoded = firebase_auth_service.verify_id_token(id_token)
    return AuthenticatedUser(
        uid=decoded["uid"],
        email=decoded.get("email"),
        name=decoded.get("name"),
        email_verified=decoded.get("email_verified"),
    )
