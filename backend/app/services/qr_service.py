import io
import base64
import secrets
import logging
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import qrcode

from app.core.config import settings
from app.models.batch import Batch
from app.models.qr_verification import QRVerification
from app.schemas.qr import (
    QRVerificationResponse,
    BatchSummary,
    ConsumerVerificationResponse
)
from app.services.supply_chain_service import get_batch_trace
from app.services.audit_service import log_audit_event

logger = logging.getLogger(__name__)

def _generate_qr_base64(url: str) -> str:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    img_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{img_str}"

def generate_qr_for_batch(
    db: Session,
    batch_id: str,
    actor_id: Optional[int] = None
) -> QRVerificationResponse:
    batch = db.query(Batch).filter(Batch.batch_id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch with ID '{batch_id}' not found"
        )

    # Invariant check: Check for existing active QR verification record
    existing_qr = db.query(QRVerification).filter(
        QRVerification.batch_id == batch_id,
        QRVerification.is_active == True
    ).first()

    if existing_qr:
        verification_url = f"{settings.VERIFICATION_BASE_URL}/{existing_qr.verification_token}"
        qr_image = _generate_qr_base64(verification_url)
        return QRVerificationResponse(
            batch_id=batch_id,
            verification_url=verification_url,
            qr_image_base64=qr_image,
            is_active=True,
            created_at=existing_qr.created_at
        )

    token = secrets.token_urlsafe(32)
    qr_rec = QRVerification(
        batch_id=batch_id,
        verification_token=token,
        is_active=True,
        created_by=actor_id
    )
    db.add(qr_rec)
    db.flush()

    log_audit_event(
        db=db,
        action="GENERATE_QR_CODE",
        entity_type="QRVerification",
        entity_id=str(qr_rec.id),
        actor_id=actor_id,
        details=f"Generated active QR code for batch '{batch_id}'"
    )

    db.commit()
    db.refresh(qr_rec)

    verification_url = f"{settings.VERIFICATION_BASE_URL}/{token}"
    qr_image = _generate_qr_base64(verification_url)

    return QRVerificationResponse(
        batch_id=batch_id,
        verification_url=verification_url,
        qr_image_base64=qr_image,
        is_active=True,
        created_at=qr_rec.created_at
    )

def get_qr_for_batch(db: Session, batch_id: str) -> QRVerificationResponse:
    batch = db.query(Batch).filter(Batch.batch_id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch with ID '{batch_id}' not found"
        )

    existing_qr = db.query(QRVerification).filter(
        QRVerification.batch_id == batch_id,
        QRVerification.is_active == True
    ).first()

    if not existing_qr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active QR verification code found for batch '{batch_id}'"
        )

    verification_url = f"{settings.VERIFICATION_BASE_URL}/{existing_qr.verification_token}"
    qr_image = _generate_qr_base64(verification_url)

    return QRVerificationResponse(
        batch_id=batch_id,
        verification_url=verification_url,
        qr_image_base64=qr_image,
        is_active=True,
        created_at=existing_qr.created_at
    )

def revoke_qr_verification(db: Session, batch_id: str, actor_id: Optional[int] = None) -> QRVerificationResponse:
    batch = db.query(Batch).filter(Batch.batch_id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch with ID '{batch_id}' not found"
        )

    existing_qr = db.query(QRVerification).filter(
        QRVerification.batch_id == batch_id,
        QRVerification.is_active == True
    ).first()

    if not existing_qr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active QR verification code found to revoke for batch '{batch_id}'"
        )

    existing_qr.is_active = False
    existing_qr.revoked_at = datetime.now(timezone.utc)
    db.flush()

    log_audit_event(
        db=db,
        action="REVOKE_QR_CODE",
        entity_type="QRVerification",
        entity_id=str(existing_qr.id),
        actor_id=actor_id,
        details=f"Revoked QR code for batch '{batch_id}'"
    )

    db.commit()
    db.refresh(existing_qr)

    verification_url = f"{settings.VERIFICATION_BASE_URL}/{existing_qr.verification_token}"
    qr_image = _generate_qr_base64(verification_url)

    return QRVerificationResponse(
        batch_id=batch_id,
        verification_url=verification_url,
        qr_image_base64=qr_image,
        is_active=False,
        created_at=existing_qr.created_at
    )

def get_public_verification(db: Session, token: str) -> ConsumerVerificationResponse:
    qr_rec = db.query(QRVerification).filter(
        QRVerification.verification_token == token,
        QRVerification.is_active == True
    ).first()

    if not qr_rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification record not found or has been revoked."
        )

    batch = db.query(Batch).filter(Batch.batch_id == qr_rec.batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch record associated with verification token not found."
        )

    trace_data = get_batch_trace(db, batch.batch_id)

    batch_summary = BatchSummary(
        batch_id=batch.batch_id,
        source_type=batch.source_type,
        quantity_kg=batch.quantity_kg,
        status=batch.status,
        created_at=batch.created_at
    )

    return ConsumerVerificationResponse(
        verified=True,
        verification_message="Verified HoneyChain traceability record",
        batch=batch_summary,
        trace=trace_data.trace,
        genealogy=trace_data.genealogy,
        lab_records=trace_data.lab_records,
        evidence=trace_data.evidence,
        reconciliations=trace_data.reconciliations,
        has_anomalies=trace_data.has_anomalies,
        blockchain_status=trace_data.blockchain_status,
        blockchain_transaction_hash=trace_data.blockchain_transaction_hash,
        blockchain_anchored_at=trace_data.blockchain_anchored_at
    )

