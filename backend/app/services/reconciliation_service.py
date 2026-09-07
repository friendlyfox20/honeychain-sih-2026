import logging
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.batch import Batch
from app.models.reconciliation import ReconciliationRecord
from app.models.batch_relationship import BatchRelationship
from app.schemas.reconciliation import ReconciliationRequest, ReconciliationResponse
from app.services.audit_service import log_audit_event
from app.services.anomaly_service import anomaly_service
from app.schemas.anomaly import AnomalyCheckRequest

logger = logging.getLogger(__name__)

def reconcile_batch(
    db: Session,
    batch_id: str,
    req: ReconciliationRequest,
    actor_id: Optional[int] = None
) -> ReconciliationResponse:
    batch = db.query(Batch).filter(Batch.batch_id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch with ID '{batch_id}' not found"
        )

    inp = float(req.input_quantity_kg)
    out = float(req.output_quantity_kg)
    loss = inp - out

    # Check genealogy child relationships sum
    child_links = db.query(BatchRelationship).filter(BatchRelationship.parent_batch_id == batch_id).all()
    total_child_transferred = sum(link.quantity_transferred_kg for link in child_links)

    status_val = "PASS"
    reason_parts = []

    # Layer 1: Deterministic Mass-Conservation Rules (Authoritative)
    if out > inp:
        status_val = "ANOMALY"
        reason_parts.append(f"Output quantity ({out:.2f} kg) exceeds input quantity ({inp:.2f} kg) by {-loss:.2f} kg.")

    if total_child_transferred > inp:
        status_val = "ANOMALY"
        reason_parts.append(f"Total child batches quantity ({total_child_transferred:.2f} kg) exceeds parent input quantity ({inp:.2f} kg).")

    if loss > (0.5 * inp) and inp > 0 and status_val != "ANOMALY":
        status_val = "WARNING"
        reason_parts.append(f"Loss quantity ({loss:.2f} kg) exceeds 50% of input quantity.")

    # Supplementary ML Anomaly Check
    try:
        anomaly_req = AnomalyCheckRequest(
            batch_id=batch_id,
            harvest_quantity_kg=max(inp, batch.quantity_kg),
            processing_quantity_kg=out,
            bottled_quantity_kg=min(out, batch.quantity_kg),
            dispatched_quantity_kg=min(out, batch.quantity_kg)
        )
        ml_res = anomaly_service.check_batch_anomaly(anomaly_req)
        if ml_res.final_status == "ANOMALY" and status_val != "ANOMALY":
            status_val = "ANOMALY"
            reason_parts.append(f"ML Anomaly Model flagged inconsistency: {ml_res.ml_prediction}.")
    except Exception as e:
        logger.warning(f"ML anomaly evaluation skipped during reconciliation: {e}")

    if not reason_parts:
        reason = "Quantity conservation check passed cleanly."
    else:
        reason = " | ".join(reason_parts)

    rec_record = ReconciliationRecord(
        batch_id=batch_id,
        input_quantity_kg=inp,
        output_quantity_kg=out,
        loss_quantity_kg=round(loss, 4),
        status=status_val,
        reason=reason,
        checked_at=datetime.now(timezone.utc)
    )
    db.add(rec_record)

    if status_val == "ANOMALY":
        batch.status = "FLAGGED"

    db.flush()

    log_audit_event(
        db=db,
        action="RECONCILE_BATCH",
        entity_type="ReconciliationRecord",
        entity_id=str(rec_record.id),
        actor_id=actor_id,
        details=f"Reconciled batch {batch_id}: Status={status_val}, Loss={loss:.2f} kg"
    )

    db.commit()
    db.refresh(rec_record)

    return ReconciliationResponse(
        id=rec_record.id,
        batch_id=batch_id,
        input_quantity_kg=rec_record.input_quantity_kg,
        output_quantity_kg=rec_record.output_quantity_kg,
        loss_quantity_kg=rec_record.loss_quantity_kg,
        status=rec_record.status,
        reason=rec_record.reason,
        checked_at=rec_record.checked_at
    )
