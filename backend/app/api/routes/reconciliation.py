from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.reconciliation import ReconciliationRequest, ReconciliationResponse
from app.services import reconciliation_service
from app.core.dependencies import require_roles
from app.models.user import User

router = APIRouter(prefix="/batches", tags=["Quantity Reconciliation"])

@router.post("/{batch_id}/reconcile", response_model=ReconciliationResponse, status_code=status.HTTP_201_CREATED, summary="Perform mass-conservation quantity reconciliation")
def reconcile_batch(
    batch_id: str,
    request: ReconciliationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("PROCESSOR", "BEEKEEPER", "ADMIN"))
):
    """
    Evaluates mass conservation rules (Output <= Input). Requires PROCESSOR, BEEKEEPER, or ADMIN role.
    """
    return reconciliation_service.reconcile_batch(db, batch_id, request, actor_id=current_user.id)
