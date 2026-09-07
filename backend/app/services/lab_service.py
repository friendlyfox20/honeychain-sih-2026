import logging
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.batch import Batch
from app.models.lab_record import LabRecord
from app.schemas.lab import LabRecordCreate
from app.services.audit_service import log_audit_event

logger = logging.getLogger(__name__)

def add_lab_record(
    db: Session,
    batch_id: str,
    record_in: LabRecordCreate,
    actor_id: Optional[int] = None
) -> LabRecord:
    batch = db.query(Batch).filter(Batch.batch_id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch with ID '{batch_id}' not found"
        )

    record = LabRecord(
        batch_id=batch_id,
        test_name=record_in.test_name,
        test_result=record_in.test_result,
        status=record_in.status,
        tested_at=datetime.now(timezone.utc),
        laboratory_name=record_in.laboratory_name,
        notes=record_in.notes
    )
    db.add(record)
    db.flush()

    log_audit_event(
        db=db,
        action="ADD_LAB_RECORD",
        entity_type="LabRecord",
        entity_id=str(record.id),
        actor_id=actor_id,
        details=f"Added lab record '{record_in.test_name}' for batch {batch_id} (Status: {record_in.status})"
    )

    db.commit()
    db.refresh(record)
    return record

def get_lab_records(db: Session, batch_id: str) -> List[LabRecord]:
    batch = db.query(Batch).filter(Batch.batch_id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch with ID '{batch_id}' not found"
        )
    return db.query(LabRecord).filter(LabRecord.batch_id == batch_id).order_by(LabRecord.created_at.desc()).all()
