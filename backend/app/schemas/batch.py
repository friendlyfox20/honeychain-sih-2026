from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class BatchCreate(BaseModel):
    batch_id: str = Field(..., json_schema_extra={"example": "BATCH-2026-0001"}, description="Unique Batch Identifier")
    source_type: str = Field("HIVE", json_schema_extra={"example": "HIVE"}, description="Source type: HIVE, HARVEST, COLLECTION, MERGED_BATCH")
    source_reference: Optional[str] = Field(None, json_schema_extra={"example": "HIVE-001"}, description="Optional reference string")
    quantity_kg: float = Field(..., gt=0, json_schema_extra={"example": 50.0}, description="Batch quantity in kg (> 0)")

class BatchResponse(BaseModel):
    id: int
    batch_id: str
    source_type: str
    source_reference: Optional[str] = None
    quantity_kg: float
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BatchDetailResponse(BatchResponse):
    events: List["SupplyChainEventResponse"] = []
    lab_records: List["LabRecordResponse"] = []
    evidences: List["EvidenceResponse"] = []
    reconciliations: List["ReconciliationResponse"] = []

    model_config = ConfigDict(from_attributes=True)

class BatchListResponse(BaseModel):
    items: List[BatchResponse]
    total: int
    page: int
    size: int

from app.schemas.supply_chain import SupplyChainEventResponse
from app.schemas.lab import LabRecordResponse
from app.schemas.evidence import EvidenceResponse
from app.schemas.reconciliation import ReconciliationResponse

BatchDetailResponse.model_rebuild()
