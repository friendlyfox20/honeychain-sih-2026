from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.qr import QRVerificationResponse, ConsumerVerificationResponse
from app.services import qr_service
from app.core.dependencies import require_roles, get_current_user
from app.models.user import User

router = APIRouter(tags=["QR Code & Consumer Verification"])

@router.post(
    "/batches/{batch_id}/qr",
    response_model=QRVerificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate or retrieve QR code for a honey batch"
)
def generate_batch_qr(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("BEEKEEPER", "PROCESSOR", "ADMIN"))
):
    """
    Generates a secure verification token and Base64 PNG QR code for a batch.
    Requires BEEKEEPER, PROCESSOR, or ADMIN role.
    Maintains invariant: Returns existing active QR verification record if present.
    """
    return qr_service.generate_qr_for_batch(db, batch_id, actor_id=current_user.id)

@router.get(
    "/batches/{batch_id}/qr",
    response_model=QRVerificationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get active QR code metadata for a honey batch"
)
def get_batch_qr(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves the active QR verification code metadata for a batch.
    Requires authentication.
    """
    return qr_service.get_qr_for_batch(db, batch_id)

@router.post(
    "/batches/{batch_id}/qr/revoke",
    response_model=QRVerificationResponse,
    status_code=status.HTTP_200_OK,
    summary="Revoke active QR code for a honey batch"
)
def revoke_batch_qr(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("PROCESSOR", "ADMIN"))
):
    """
    Deactivates and revokes the active QR code for a batch.
    Requires PROCESSOR or ADMIN role.
    """
    return qr_service.revoke_qr_verification(db, batch_id, actor_id=current_user.id)

@router.get(
    "/verify/{verification_token}",
    response_model=ConsumerVerificationResponse,
    status_code=status.HTTP_200_OK,
    summary="Public consumer verification endpoint (No authentication required)"
)
def public_consumer_verify(
    verification_token: str,
    db: Session = Depends(get_db)
):
    """
    Public unauthenticated endpoint for consumers scanning honey jar QR codes.
    Returns sanitized batch traceability record including genealogy, lab results, reconciliation, and anomaly status.
    Strictly read-only; does not expose internal credentials, tokens, or user details.
    """
    return qr_service.get_public_verification(db, verification_token)

