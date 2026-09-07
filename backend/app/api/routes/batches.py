from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.batch import BatchCreate, BatchResponse, BatchDetailResponse, BatchListResponse
from app.services import batch_service
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User

router = APIRouter(prefix="/batches", tags=["Batch Management"])

@router.post("", response_model=BatchResponse, status_code=status.HTTP_201_CREATED, summary="Create a new honey batch")
def create_batch(
    batch_in: BatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("BEEKEEPER", "ADMIN", "COLLECTOR", "PROCESSOR"))
):
    """
    Creates a new traceable honey batch. Requires BEEKEEPER, COLLECTOR, PROCESSOR, or ADMIN role.
    """
    return batch_service.create_batch(db, batch_in, actor_id=current_user.id)

@router.get("/{batch_id}", response_model=BatchDetailResponse, summary="Get batch details by ID")
def get_batch(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns batch information including events, lab records, evidences, and reconciliations. Requires authentication.
    """
    return batch_service.get_batch_by_id(db, batch_id)

@router.get("", response_model=BatchListResponse, summary="List batches with pagination and filtering")
def list_batches(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    source_type: Optional[str] = Query(None, description="Filter by source type"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns a paginated list of batches with optional status and source_type filtering. Requires authentication.
    """
    items, total = batch_service.list_batches(
        db=db,
        page=page,
        size=size,
        status_filter=status,
        source_type_filter=source_type
    )
    return BatchListResponse(
        items=items,
        total=total,
        page=page,
        size=size
    )
