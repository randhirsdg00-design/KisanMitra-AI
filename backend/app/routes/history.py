from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.database.models import ScanHistory, User
from backend.app.core.dependencies import get_current_dev_user
from backend.app.core.exceptions import NotFoundError
from backend.app.schemas.history import ScanHistoryCreate, ScanHistoryResponse

router = APIRouter(prefix="/history", tags=["Diagnosis History"])


@router.post("", response_model=ScanHistoryResponse, status_code=status.HTTP_201_CREATED, summary="Record a scan diagnosis")
def create_scan_history(
    scan_in: ScanHistoryCreate,
    current_user: User = Depends(get_current_dev_user),
    db: Session = Depends(get_db),
):
    """Record a crop scan diagnosis result. Supports both authenticated user and guest scans."""
    user_id = scan_in.user_id if scan_in.user_id is not None else current_user.id
    scan_data = scan_in.model_dump(exclude={"user_id"})

    scan_record = ScanHistory(
        user_id=user_id,
        **scan_data,
    )
    db.add(scan_record)
    db.commit()
    db.refresh(scan_record)
    return scan_record


@router.get("", response_model=List[ScanHistoryResponse], status_code=status.HTTP_200_OK, summary="List scan diagnoses")
def list_scan_history(
    current_user: User = Depends(get_current_dev_user),
    db: Session = Depends(get_db),
):
    """Retrieve scan history for the current user."""
    return db.query(ScanHistory).filter(ScanHistory.user_id == current_user.id).order_by(ScanHistory.created_at.desc()).all()


@router.get("/{scan_id}", response_model=ScanHistoryResponse, status_code=status.HTTP_200_OK, summary="Get scan diagnosis by ID")
def get_scan_history(
    scan_id: int,
    current_user: User = Depends(get_current_dev_user),
    db: Session = Depends(get_db),
):
    """Retrieve details of a specific crop scan by ID."""
    scan_record = db.query(ScanHistory).filter(ScanHistory.id == scan_id).first()
    if not scan_record:
        raise NotFoundError(message="Scan record not found.", error="not_found")
    return scan_record
