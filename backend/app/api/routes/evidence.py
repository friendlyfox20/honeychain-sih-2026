from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.evidence import EvidenceCreate, EvidenceResponse
from app.services import evidence_service
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User

router = APIRouter(prefix="/batches", tags=["Evidence & Documents"])

@router.post("/{batch_id}/evidence", response_model=EvidenceResponse, status_code=status.HTTP_201_CREATED, summary="Attach evidence metadata to batch")
def add_evidence(
    batch_id: str,
    evidence_in: EvidenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("LAB", "PROCESSOR", "BEEKEEPER", "COLLECTOR", "ADMIN"))
):
    """
    Attaches evidence file reference and metadata to a batch. Requires authenticated supply chain role.
    """
    return evidence_service.add_evidence(db, batch_id, evidence_in, actor_id=current_user.id)

@router.get("/{batch_id}/evidence", response_model=List[EvidenceResponse], summary="Get evidence records for batch")
def get_evidence(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves evidence file references associated with a batch. Requires authentication.
    """
    return evidence_service.get_evidence(db, batch_id)
