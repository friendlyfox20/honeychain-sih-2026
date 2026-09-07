from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.lab import LabRecordResponse
from app.schemas.evidence import EvidenceResponse
from app.schemas.reconciliation import ReconciliationResponse
from app.schemas.genealogy import GenealogyGraphResponse

class SupplyChainEventCreate(BaseModel):
    event_type: str = Field(..., json_schema_extra={"example": "HARVEST"}, description="HARVEST, COLLECTION, PROCESSING, LAB_SUBMISSION, LAB_RESULT, PACKAGING, DISPATCH, TRANSFER")
    location: Optional[str] = Field(None, json_schema_extra={"example": "Nashik"}, description="Event location")
    quantity_kg: float = Field(..., gt=0, json_schema_extra={"example": 50.0}, description="Quantity in kg (> 0)")
    actor_id: Optional[int] = Field(None, description="ID of the actor/user performing the event")
    notes: Optional[str] = Field(None, json_schema_extra={"example": "Honey harvested from hive"}, description="Additional notes")

class SupplyChainEventResponse(BaseModel):
    id: int
    batch_id: str
    event_type: str
    location: Optional[str] = None
    actor_id: Optional[int] = None
    quantity_kg: float
    timestamp: datetime
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BatchTraceItem(BaseModel):
    event_type: str
    quantity_kg: float
    location: Optional[str] = None
    timestamp: datetime
    notes: Optional[str] = None

class BatchTraceResponse(BaseModel):
    batch_id: str
    current_status: str
    trace: List[BatchTraceItem]
    genealogy: Optional[GenealogyGraphResponse] = None
    lab_records: List[LabRecordResponse] = Field(default_factory=list)
    evidence: List[EvidenceResponse] = Field(default_factory=list)
    reconciliations: List[ReconciliationResponse] = Field(default_factory=list)
    has_anomalies: bool = False
    blockchain_status: Optional[str] = None
    blockchain_transaction_hash: Optional[str] = None
    blockchain_anchored_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


