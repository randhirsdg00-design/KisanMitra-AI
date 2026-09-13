from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.database.models import NotificationPreference, User
from backend.app.core.dependencies import get_current_dev_user
from backend.app.schemas.notification import (
    NotificationPreferenceUpdate,
    NotificationPreferenceResponse,
)

router = APIRouter(prefix="/notification-preferences", tags=["Notification Preferences"])


@router.get("", response_model=NotificationPreferenceResponse, status_code=status.HTTP_200_OK, summary="Get notification preferences")
def get_notification_preferences(
    current_user: User = Depends(get_current_dev_user),
    db: Session = Depends(get_db),
):
    """Retrieve the notification alerts preferences for the current user."""
    pref = db.query(NotificationPreference).filter(NotificationPreference.user_id == current_user.id).first()
    if not pref:
        pref = NotificationPreference(user_id=current_user.id)
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref


@router.put("", response_model=NotificationPreferenceResponse, status_code=status.HTTP_200_OK, summary="Update notification preferences")
def update_notification_preferences(
    pref_in: NotificationPreferenceUpdate,
    current_user: User = Depends(get_current_dev_user),
    db: Session = Depends(get_db),
):
    """Update toggle settings for weather, mandi, scheme, or disease alerts."""
    pref = db.query(NotificationPreference).filter(NotificationPreference.user_id == current_user.id).first()
    if not pref:
        pref = NotificationPreference(user_id=current_user.id)
        db.add(pref)
        db.flush()

    update_data = pref_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(pref, field, val)

    db.commit()
    db.refresh(pref)
    return pref
