from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.database.models import Farm, User
from backend.app.core.dependencies import get_current_dev_user
from backend.app.core.exceptions import NotFoundError
from backend.app.schemas.farm import FarmCreate, FarmUpdate, FarmResponse
from backend.app.schemas.common import SuccessResponse

router = APIRouter(prefix="/farms", tags=["Farms"])


@router.post("", response_model=FarmResponse, status_code=status.HTTP_201_CREATED, summary="Create a new farm")
def create_farm(
    farm_in: FarmCreate,
    current_user: User = Depends(get_current_dev_user),
    db: Session = Depends(get_db),
):
    """Register a new farm profile for the current user."""
    farm = Farm(
        user_id=current_user.id,
        **farm_in.model_dump(),
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm


@router.get("", response_model=List[FarmResponse], status_code=status.HTTP_200_OK, summary="List all farms")
def list_farms(
    current_user: User = Depends(get_current_dev_user),
    db: Session = Depends(get_db),
):
    """Retrieve all farm profiles owned by the current user."""
    return db.query(Farm).filter(Farm.user_id == current_user.id).all()


@router.get("/{farm_id}", response_model=FarmResponse, status_code=status.HTTP_200_OK, summary="Get farm by ID")
def get_farm(
    farm_id: int,
    current_user: User = Depends(get_current_dev_user),
    db: Session = Depends(get_db),
):
    """Retrieve details of a specific farm by its ID."""
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise NotFoundError(message="Farm not found.", error="not_found")
    return farm


@router.put("/{farm_id}", response_model=FarmResponse, status_code=status.HTTP_200_OK, summary="Update farm details")
def update_farm(
    farm_id: int,
    farm_in: FarmUpdate,
    current_user: User = Depends(get_current_dev_user),
    db: Session = Depends(get_db),
):
    """Update fields of an existing farm."""
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise NotFoundError(message="Farm not found.", error="not_found")

    update_data = farm_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(farm, field, val)

    db.commit()
    db.refresh(farm)
    return farm


@router.delete("/{farm_id}", response_model=SuccessResponse, status_code=status.HTTP_200_OK, summary="Delete farm")
def delete_farm(
    farm_id: int,
    current_user: User = Depends(get_current_dev_user),
    db: Session = Depends(get_db),
):
    """Delete a farm profile."""
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise NotFoundError(message="Farm not found.", error="not_found")

    db.delete(farm)
    db.commit()
    return SuccessResponse(success=True, message="Farm deleted successfully.")
