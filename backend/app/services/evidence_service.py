import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.batch import Batch
from app.models.evidence import Evidence
from app.schemas.evidence import EvidenceCreate
from app.services.audit_service import log_audit_event

logger = logging.getLogger(__name__)

def add_evidence(
    db: Session,
    batch_id: str,
    evidence_in: EvidenceCreate,
    actor_id: Optional[int] = None
) -> Evidence:
    batch = db.query(Batch).filter(Batch.batch_id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch with ID '{batch_id}' not found"
        )

    uploader = actor_id if actor_id is not None else evidence_in.uploaded_by

    evidence = Evidence(
        batch_id=batch_id,
        evidence_type=evidence_in.evidence_type,
        file_reference=evidence_in.file_reference,
        description=evidence_in.description,
        uploaded_by=uploader
    )
    db.add(evidence)
    db.flush()

    log_audit_event(
        db=db,
        action="ADD_EVIDENCE",
        entity_type="Evidence",
        entity_id=str(evidence.id),
        actor_id=uploader,
        details=f"Added evidence metadata ({evidence_in.evidence_type}) for batch {batch_id}"
    )

    db.commit()
    db.refresh(evidence)
    return evidence

def get_evidence(db: Session, batch_id: str) -> List[Evidence]:
    batch = db.query(Batch).filter(Batch.batch_id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch with ID '{batch_id}' not found"
        )
    return db.query(Evidence).filter(Evidence.batch_id == batch_id).order_by(Evidence.created_at.desc()).all()
