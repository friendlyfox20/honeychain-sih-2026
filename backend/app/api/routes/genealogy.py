from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.genealogy import (
    BatchRelationshipCreate,
    BatchRelationshipResponse,
    GenealogyNode,
    GenealogyGraphResponse
)
from app.services import genealogy_service
from app.core.dependencies import require_roles, get_current_user
from app.models.user import User

router = APIRouter(prefix="/batches", tags=["Batch Genealogy & Traceability"])

@router.post(
    "/relationships",
    response_model=BatchRelationshipResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Link parent and child batches (SPLIT / MERGE / DERIVED / TRANSFER)"
)
def link_batches(
    rel_in: BatchRelationshipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("PROCESSOR", "BEEKEEPER", "COLLECTOR", "ADMIN"))
):
    """
    Establishes a directional lineage link between a parent batch and a child batch.
    Validates non-self parenting, positive transferred quantity, and parent quantity conservation.
    Requires PROCESSOR, BEEKEEPER, COLLECTOR, or ADMIN role.
    """
    return genealogy_service.link_parent_child_batch(db, rel_in, actor_id=current_user.id)

@router.get(
    "/{batch_id}/genealogy",
    response_model=GenealogyGraphResponse,
    status_code=status.HTTP_200_OK,
    summary="Get complete genealogy graph for a batch (ancestors, descendants, links)"
)
def get_genealogy(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns full lineage graph containing upstream ancestors, downstream descendants, and relationship links.
    """
    return genealogy_service.get_genealogy_graph(db, batch_id)

@router.get(
    "/{batch_id}/ancestors",
    response_model=List[GenealogyNode],
    status_code=status.HTTP_200_OK,
    summary="Get all upstream ancestor batches"
)
def get_ancestors(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns list of all upstream parent batches in the genealogy tree.
    """
    return genealogy_service.get_ancestors(db, batch_id)

@router.get(
    "/{batch_id}/descendants",
    response_model=List[GenealogyNode],
    status_code=status.HTTP_200_OK,
    summary="Get all downstream descendant batches"
)
def get_descendants(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns list of all downstream child batches in the genealogy tree.
    """
    return genealogy_service.get_descendants(db, batch_id)
