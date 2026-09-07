import logging
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from app.models.batch import Batch
from app.schemas.batch import BatchCreate
from app.services.audit_service import log_audit_event

logger = logging.getLogger(__name__)

def create_batch(db: Session, batch_in: BatchCreate, actor_id: Optional[int] = None) -> Batch:
    if batch_in.quantity_kg <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be greater than 0"
        )
        
    existing = db.query(Batch).filter(Batch.batch_id == batch_in.batch_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Batch ID '{batch_in.batch_id}' already exists"
        )

    batch = Batch(
        batch_id=batch_in.batch_id,
        source_type=batch_in.source_type,
        source_reference=batch_in.source_reference,
        quantity_kg=batch_in.quantity_kg,
        status="CREATED"
    )
    db.add(batch)
    db.flush()

    log_audit_event(
        db=db,
        action="CREATE_BATCH",
        entity_type="Batch",
        entity_id=batch.batch_id,
        actor_id=actor_id,
        details=f"Created batch {batch.batch_id} with initial quantity {batch.quantity_kg} kg"
    )
    
    db.commit()
    db.refresh(batch)
    return batch

def get_batch_by_id(db: Session, batch_id: str) -> Batch:
    batch = db.query(Batch).options(
        joinedload(Batch.events),
        joinedload(Batch.lab_records),
        joinedload(Batch.evidences),
        joinedload(Batch.reconciliations)
    ).filter(Batch.batch_id == batch_id).first()

    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch with ID '{batch_id}' not found"
        )
    return batch

def list_batches(
    db: Session,
    page: int = 1,
    size: int = 10,
    status_filter: Optional[str] = None,
    source_type_filter: Optional[str] = None
) -> Tuple[List[Batch], int]:
    query = db.query(Batch)

    if status_filter:
        query = query.filter(Batch.status == status_filter)
    if source_type_filter:
        query = query.filter(Batch.source_type == source_type_filter)

    total = query.count()
    offset = (page - 1) * size
    items = query.order_by(Batch.created_at.desc()).offset(offset).limit(size).all()

    return items, total
