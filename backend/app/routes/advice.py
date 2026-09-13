from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.database.models import SavedAdvice, User
from backend.app.core.dependencies import get_current_dev_user
from backend.app.core.exceptions import NotFoundError
from backend.app.schemas.advice import SavedAdviceCreate, SavedAdviceResponse
from backend.app.schemas.common import SuccessResponse

router = APIRouter(prefix="/saved-advice", tags=["Saved Advice"])


@router.post("", response_model=SavedAdviceResponse, status_code=status.HTTP_201_CREATED, summary="Save agricultural advice")
def create_saved_advice(
    advice_in: SavedAdviceCreate,
    current_user: User = Depends(get_current_dev_user),
    db: Session = Depends(get_db),
):
    """Bookmark an AI agricultural advisory response for quick reference."""
    advice = SavedAdvice(
        user_id=current_user.id,
        **advice_in.model_dump(),
    )
    db.add(advice)
    db.commit()
    db.refresh(advice)
    return advice


@router.get("", response_model=List[SavedAdviceResponse], status_code=status.HTTP_200_OK, summary="List saved advice")
def list_saved_advice(
    current_user: User = Depends(get_current_dev_user),
    db: Session = Depends(get_db),
):
    """Retrieve all saved advisories for the current user."""
    return db.query(SavedAdvice).filter(SavedAdvice.user_id == current_user.id).order_by(SavedAdvice.created_at.desc()).all()


@router.delete("/{advice_id}", response_model=SuccessResponse, status_code=status.HTTP_200_OK, summary="Delete saved advice")
def delete_saved_advice(
    advice_id: int,
    current_user: User = Depends(get_current_dev_user),
    db: Session = Depends(get_db),
):
    """Remove a saved agricultural advisory entry."""
    advice = db.query(SavedAdvice).filter(SavedAdvice.id == advice_id, SavedAdvice.user_id == current_user.id).first()
    if not advice:
        raise NotFoundError(message="Saved advice not found.", error="not_found")

    db.delete(advice)
    db.commit()
    return SuccessResponse(success=True, message="Saved advice deleted successfully.")
