from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.blockchain import (
    BlockchainAnchorRequest,
    BlockchainAnchorResponse,
    BlockchainVerificationResponse,
    TransactionDetailResponse
)
from app.services import blockchain_service
from app.core.dependencies import require_roles, get_current_user
from app.models.user import User

router = APIRouter(tags=["Blockchain Integrity Layer"])

@router.post(
    "/batches/{batch_id}/blockchain/anchor",
    response_model=BlockchainAnchorResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Anchor canonical cryptographic proof hash of batch on blockchain"
)
def anchor_batch_blockchain(
    batch_id: str,
    req_in: BlockchainAnchorRequest = BlockchainAnchorRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("BEEKEEPER", "PROCESSOR", "LAB", "ADMIN"))
):
    """
    Computes canonical SHA-256 hash of authoritative DB batch state and anchors cryptographic proof on active blockchain provider.
    Requires BEEKEEPER, PROCESSOR, LAB, or ADMIN role.
    """
    return blockchain_service.anchor_batch_integrity(
        db=db,
        batch_id=batch_id,
        record_type=req_in.record_type,
        actor_id=current_user.id
    )

@router.get(
    "/batches/{batch_id}/blockchain",
    response_model=List[BlockchainAnchorResponse],
    status_code=status.HTTP_200_OK,
    summary="Get blockchain anchor records for a batch"
)
def get_batch_blockchain_anchors(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns history of blockchain anchor proofs recorded for a batch. Requires authentication.
    """
    return blockchain_service.get_blockchain_anchors_for_batch(db, batch_id)

@router.post(
    "/batches/{batch_id}/blockchain/verify",
    response_model=BlockchainVerificationResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify current database record integrity against anchored blockchain proof"
)
def verify_batch_blockchain(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Recalculates canonical SHA-256 hash from current DB state and compares against anchored blockchain proof.
    Reports VERIFIED (matching) or TAMPERED (mismatch / database record altered after anchoring).
    Requires authentication.
    """
    return blockchain_service.verify_batch_integrity(db, batch_id, actor_id=current_user.id)

@router.get(
    "/blockchain/transactions/{transaction_hash}",
    response_model=TransactionDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get transaction details by blockchain transaction hash"
)
def get_blockchain_transaction(
    transaction_hash: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves transaction status and block details from active blockchain provider by transaction hash.
    Requires authentication.
    """
    return blockchain_service.get_transaction_by_hash(db, transaction_hash)
