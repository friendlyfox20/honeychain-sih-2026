import logging
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.batch import Batch
from app.models.supply_chain_event import SupplyChainEvent
from app.models.user import User
from app.schemas.supply_chain import SupplyChainEventCreate, BatchTraceResponse, BatchTraceItem
from app.services.audit_service import log_audit_event

logger = logging.getLogger(__name__)

VALID_EVENT_TYPES = {
    "HARVEST", "COLLECTION", "PROCESSING", "LAB_SUBMISSION",
    "LAB_RESULT", "PACKAGING", "DISPATCH", "TRANSFER"
}

EVENT_ROLE_PERMISSIONS = {
    "HARVEST": {"BEEKEEPER", "ADMIN"},
    "COLLECTION": {"COLLECTOR", "BEEKEEPER", "ADMIN"},
    "PROCESSING": {"PROCESSOR", "ADMIN"},
    "PACKAGING": {"PROCESSOR", "ADMIN"},
    "DISPATCH": {"PROCESSOR", "ADMIN"},
    "TRANSFER": {"PROCESSOR", "COLLECTOR", "ADMIN"},
    "LAB_SUBMISSION": {"LAB", "ADMIN"},
    "LAB_RESULT": {"LAB", "ADMIN"}
}

STATUS_TRANSITIONS = {
    "HARVEST": "IN_COLLECTION",
    "COLLECTION": "IN_COLLECTION",
    "PROCESSING": "IN_PROCESSING",
    "LAB_SUBMISSION": "IN_LAB",
    "PACKAGING": "PACKAGED",
    "DISPATCH": "DISPATCHED"
}

def add_supply_chain_event(
    db: Session,
    batch_id: str,
    event_in: SupplyChainEventCreate,
    current_user: Optional[User] = None
) -> SupplyChainEvent:
    if event_in.event_type not in VALID_EVENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid event_type '{event_in.event_type}'. Valid types: {sorted(list(VALID_EVENT_TYPES))}"
        )

    if event_in.quantity_kg <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be greater than 0"
        )

    # Validate Role permissions for specific event type
    if current_user:
        user_role = current_user.role.upper()
        allowed_roles = EVENT_ROLE_PERMISSIONS.get(event_in.event_type, {"ADMIN"})
        if user_role != "ADMIN" and user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: User role '{user_role}' is not authorized to create '{event_in.event_type}' events."
            )

    batch = db.query(Batch).filter(Batch.batch_id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch with ID '{batch_id}' not found"
        )

    actor_id = current_user.id if current_user else event_in.actor_id

    event = SupplyChainEvent(
        batch_id=batch_id,
        event_type=event_in.event_type,
        location=event_in.location,
        actor_id=actor_id,
        quantity_kg=event_in.quantity_kg,
        timestamp=datetime.now(timezone.utc),
        notes=event_in.notes
    )
    db.add(event)

    new_status = STATUS_TRANSITIONS.get(event_in.event_type)
    if new_status:
        batch.status = new_status

    db.flush()

    log_audit_event(
        db=db,
        action="ADD_SUPPLY_CHAIN_EVENT",
        entity_type="SupplyChainEvent",
        entity_id=str(event.id),
        actor_id=actor_id,
        details=f"Event '{event_in.event_type}' added for batch {batch_id}. Status updated to {batch.status}."
    )

    db.commit()
    db.refresh(event)
    return event

def get_batch_trace(db: Session, batch_id: str) -> BatchTraceResponse:
    batch = db.query(Batch).filter(Batch.batch_id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch with ID '{batch_id}' not found"
        )

    events = db.query(SupplyChainEvent)\
        .filter(SupplyChainEvent.batch_id == batch_id)\
        .order_by(SupplyChainEvent.timestamp.asc()).all()

    trace_items = [
        BatchTraceItem(
            event_type=evt.event_type,
            quantity_kg=evt.quantity_kg,
            location=evt.location,
            timestamp=evt.timestamp,
            notes=evt.notes
        )
        for evt in events
    ]

    # Genealogy
    from app.services.genealogy_service import get_genealogy_graph
    try:
        genealogy = get_genealogy_graph(db, batch_id)
    except Exception:
        genealogy = None

    # Lab Records
    from app.models.lab_record import LabRecord
    from app.schemas.lab import LabRecordResponse
    lab_records_db = db.query(LabRecord).filter(LabRecord.batch_id == batch_id).all()
    lab_records = [LabRecordResponse.model_validate(r) for r in lab_records_db]

    # Evidence
    from app.models.evidence import Evidence
    from app.schemas.evidence import EvidenceResponse
    evidence_db = db.query(Evidence).filter(Evidence.batch_id == batch_id).all()
    evidence = [EvidenceResponse.model_validate(e) for e in evidence_db]

    # Reconciliations
    from app.models.reconciliation import ReconciliationRecord
    from app.schemas.reconciliation import ReconciliationResponse
    reconciliations_db = db.query(ReconciliationRecord).filter(ReconciliationRecord.batch_id == batch_id).all()
    reconciliations = [ReconciliationResponse.model_validate(r) for r in reconciliations_db]

    # Compute has_anomalies
    has_anomalies = False
    if any(r.status == "FAILED" for r in lab_records):
        has_anomalies = True
    if any(r.status == "ANOMALY" for r in reconciliations):
        has_anomalies = True

    # Blockchain Anchor Status
    from app.models.blockchain_anchor import BlockchainAnchor
    latest_anchor = db.query(BlockchainAnchor).filter(BlockchainAnchor.batch_id == batch_id).order_by(BlockchainAnchor.anchored_at.desc()).first()
    bc_status = latest_anchor.status if latest_anchor else "NOT_ANCHORED"
    bc_tx = latest_anchor.transaction_hash if latest_anchor else None
    bc_time = latest_anchor.anchored_at if latest_anchor else None

    return BatchTraceResponse(
        batch_id=batch_id,
        current_status=batch.status,
        trace=trace_items,
        genealogy=genealogy,
        lab_records=lab_records,
        evidence=evidence,
        reconciliations=reconciliations,
        has_anomalies=has_anomalies,
        blockchain_status=bc_status,
        blockchain_transaction_hash=bc_tx,
        blockchain_anchored_at=bc_time
    )


