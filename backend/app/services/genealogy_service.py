import logging
from typing import List, Set, Dict, Tuple, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.batch import Batch
from app.models.batch_relationship import BatchRelationship
from app.schemas.genealogy import (
    BatchRelationshipCreate,
    BatchRelationshipResponse,
    GenealogyNode,
    GenealogyLink,
    GenealogyGraphResponse
)
from app.services.audit_service import log_audit_event

logger = logging.getLogger(__name__)

VALID_RELATIONSHIP_TYPES = {"SPLIT", "MERGE", "DERIVED", "TRANSFER"}

def link_parent_child_batch(
    db: Session,
    rel_in: BatchRelationshipCreate,
    actor_id: Optional[int] = None
) -> BatchRelationship:
    if rel_in.parent_batch_id == rel_in.child_batch_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A batch cannot be linked as its own parent or child (self-parenting prohibited)."
        )

    if rel_in.quantity_transferred_kg <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity transferred must be greater than 0."
        )

    rel_type = rel_in.relationship_type.upper()
    if rel_type not in VALID_RELATIONSHIP_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid relationship_type '{rel_in.relationship_type}'. Valid types: {sorted(list(VALID_RELATIONSHIP_TYPES))}"
        )

    parent = db.query(Batch).filter(Batch.batch_id == rel_in.parent_batch_id).first()
    if not parent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Parent batch with ID '{rel_in.parent_batch_id}' not found."
        )

    child = db.query(Batch).filter(Batch.batch_id == rel_in.child_batch_id).first()
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Child batch with ID '{rel_in.child_batch_id}' not found."
        )

    # Check for existing duplicate link
    existing_link = db.query(BatchRelationship).filter(
        BatchRelationship.parent_batch_id == rel_in.parent_batch_id,
        BatchRelationship.child_batch_id == rel_in.child_batch_id
    ).first()
    if existing_link:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Relationship link between parent '{rel_in.parent_batch_id}' and child '{rel_in.child_batch_id}' already exists."
        )

    # Validate parent quantity conservation: total transferred to children <= parent quantity
    existing_transferred_sum = sum(
        link.quantity_transferred_kg for link in parent.child_relationships
    )
    new_total = existing_transferred_sum + rel_in.quantity_transferred_kg
    if new_total > parent.quantity_kg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transferred quantity ({new_total:.2f} kg) exceeds parent batch available quantity ({parent.quantity_kg:.2f} kg)."
        )

    relationship = BatchRelationship(
        parent_batch_id=rel_in.parent_batch_id,
        child_batch_id=rel_in.child_batch_id,
        relationship_type=rel_type,
        quantity_transferred_kg=rel_in.quantity_transferred_kg,
        created_by=actor_id,
        notes=rel_in.notes
    )
    db.add(relationship)
    db.flush()

    log_audit_event(
        db=db,
        action="LINK_BATCH_RELATIONSHIP",
        entity_type="BatchRelationship",
        entity_id=str(relationship.id),
        actor_id=actor_id,
        details=f"Linked parent '{rel_in.parent_batch_id}' -> child '{rel_in.child_batch_id}' ({rel_type}, {rel_in.quantity_transferred_kg} kg)"
    )

    db.commit()
    db.refresh(relationship)
    return relationship

def get_ancestors(db: Session, batch_id: str) -> List[GenealogyNode]:
    batch = db.query(Batch).filter(Batch.batch_id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch with ID '{batch_id}' not found."
        )

    ancestors_map: Dict[str, Batch] = {}
    queue = [batch_id]
    visited: Set[str] = {batch_id}

    while queue:
        curr_id = queue.pop(0)
        parent_links = db.query(BatchRelationship).filter(BatchRelationship.child_batch_id == curr_id).all()
        for link in parent_links:
            p_id = link.parent_batch_id
            if p_id not in visited:
                visited.add(p_id)
                p_batch = db.query(Batch).filter(Batch.batch_id == p_id).first()
                if p_batch:
                    ancestors_map[p_id] = p_batch
                    queue.append(p_id)

    return [GenealogyNode.model_validate(b) for b in ancestors_map.values()]

def get_descendants(db: Session, batch_id: str) -> List[GenealogyNode]:
    batch = db.query(Batch).filter(Batch.batch_id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch with ID '{batch_id}' not found."
        )

    descendants_map: Dict[str, Batch] = {}
    queue = [batch_id]
    visited: Set[str] = {batch_id}

    while queue:
        curr_id = queue.pop(0)
        child_links = db.query(BatchRelationship).filter(BatchRelationship.parent_batch_id == curr_id).all()
        for link in child_links:
            c_id = link.child_batch_id
            if c_id not in visited:
                visited.add(c_id)
                c_batch = db.query(Batch).filter(Batch.batch_id == c_id).first()
                if c_batch:
                    descendants_map[c_id] = c_batch
                    queue.append(c_id)

    return [GenealogyNode.model_validate(b) for b in descendants_map.values()]

def get_genealogy_graph(db: Session, batch_id: str) -> GenealogyGraphResponse:
    batch = db.query(Batch).filter(Batch.batch_id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch with ID '{batch_id}' not found."
        )

    ancestors = get_ancestors(db, batch_id)
    descendants = get_descendants(db, batch_id)

    all_node_ids = {batch_id} | {a.batch_id for a in ancestors} | {d.batch_id for d in descendants}
    
    links = db.query(BatchRelationship).filter(
        BatchRelationship.parent_batch_id.in_(all_node_ids),
        BatchRelationship.child_batch_id.in_(all_node_ids)
    ).all()

    link_models = [GenealogyLink.model_validate(l) for l in links]

    return GenealogyGraphResponse(
        batch_id=batch_id,
        current_status=batch.status,
        ancestors=ancestors,
        descendants=descendants,
        links=link_models,
        total_upstream_count=len(ancestors),
        total_downstream_count=len(descendants)
    )
