from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.database.models import Reminder, User
from backend.app.core.dependencies import get_current_dev_user
from backend.app.core.exceptions import NotFoundError
from backend.app.schemas.reminder import ReminderCreate, ReminderUpdate, ReminderResponse
from backend.app.schemas.common import SuccessResponse

router = APIRouter(prefix="/reminders", tags=["Reminders"])


@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED, summary="Create a new reminder")
def create_reminder(
    reminder_in: ReminderCreate,
    current_user: User = Depends(get_current_dev_user),
    db: Session = Depends(get_db),
):
    """Schedule a new farming activity or calendar reminder."""
    reminder = Reminder(
        user_id=current_user.id,
        **reminder_in.model_dump(),
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


@router.get("", response_model=List[ReminderResponse], status_code=status.HTTP_200_OK, summary="List all reminders")
def list_reminders(
    current_user: User = Depends(get_current_dev_user),
    db: Session = Depends(get_db),
):
    """Retrieve all reminders for the current user."""
    return db.query(Reminder).filter(Reminder.user_id == current_user.id).order_by(Reminder.due_at.asc()).all()


@router.put("/{reminder_id}", response_model=ReminderResponse, status_code=status.HTTP_200_OK, summary="Update a reminder")
def update_reminder(
    reminder_id: int,
    reminder_in: ReminderUpdate,
    current_user: User = Depends(get_current_dev_user),
    db: Session = Depends(get_db),
):
    """Update title, due date, description, or completed status of a reminder."""
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id).first()
    if not reminder:
        raise NotFoundError(message="Reminder not found.", error="not_found")

    update_data = reminder_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(reminder, field, val)

    db.commit()
    db.refresh(reminder)
    return reminder


@router.delete("/{reminder_id}", response_model=SuccessResponse, status_code=status.HTTP_200_OK, summary="Delete a reminder")
def delete_reminder(
    reminder_id: int,
    current_user: User = Depends(get_current_dev_user),
    db: Session = Depends(get_db),
):
    """Delete a reminder entry."""
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id).first()
    if not reminder:
        raise NotFoundError(message="Reminder not found.", error="not_found")

    db.delete(reminder)
    db.commit()
    return SuccessResponse(success=True, message="Reminder deleted successfully.")
