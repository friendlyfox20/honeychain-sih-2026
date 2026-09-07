from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.lab import LabRecordCreate, LabRecordResponse
from app.services import lab_service
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User

router = APIRouter(prefix="/batches", tags=["Laboratory Records"])

@router.post("/{batch_id}/lab", response_model=LabRecordResponse, status_code=status.HTTP_201_CREATED, summary="Add lab test record for batch")
def add_lab_record(
    batch_id: str,
    record_in: LabRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("LAB", "ADMIN"))
):
    """
    Creates a laboratory test record for a batch. Requires LAB or ADMIN role.
    """
    return lab_service.add_lab_record(db, batch_id, record_in, actor_id=current_user.id)

@router.get("/{batch_id}/lab", response_model=List[LabRecordResponse], summary="Get lab test records for batch")
def get_lab_records(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves laboratory test records associated with a batch. Requires authentication.
    """
    return lab_service.get_lab_records(db, batch_id)
