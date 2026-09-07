from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.supply_chain import SupplyChainEventCreate, SupplyChainEventResponse, BatchTraceResponse
from app.services import supply_chain_service
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/batches", tags=["Supply-Chain Events & Traceability"])

@router.post("/{batch_id}/events", response_model=SupplyChainEventResponse, status_code=status.HTTP_201_CREATED, summary="Add supply-chain movement/transformation event")
def add_event(
    batch_id: str,
    event_in: SupplyChainEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Records a supply-chain event and updates batch status. Enforces role permissions per event type.
    """
    return supply_chain_service.add_supply_chain_event(db, batch_id, event_in, current_user=current_user)

@router.get("/{batch_id}/trace", response_model=BatchTraceResponse, summary="Get chronological trace history of batch")
def get_batch_trace(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the complete chronological history of supply chain events for a batch. Requires authentication.
    """
    return supply_chain_service.get_batch_trace(db, batch_id)
