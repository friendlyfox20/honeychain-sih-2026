from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.supply_chain import BatchTraceItem
from app.schemas.genealogy import GenealogyGraphResponse
from app.schemas.lab import LabRecordResponse
from app.schemas.evidence import EvidenceResponse
from app.schemas.reconciliation import ReconciliationResponse

class QRVerificationResponse(BaseModel):
    batch_id: str = Field(..., description="Target Batch ID")
    verification_url: str = Field(..., description="Public verification URL represented in QR code")
    qr_image_base64: str = Field(..., description="Base64 encoded PNG QR code image data URL")
    is_active: bool = Field(True, description="Active verification status")
    created_at: datetime = Field(..., description="Timestamp when QR record was created")

    model_config = ConfigDict(from_attributes=True)

class BatchSummary(BaseModel):
    batch_id: str
    source_type: str
    quantity_kg: float
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ConsumerVerificationResponse(BaseModel):
    verified: bool = Field(True, description="Indicates record exists and is active")
    verification_message: str = Field("Verified HoneyChain traceability record", description="Traceability verification claim message")
    batch: BatchSummary = Field(..., description="Public summary of batch")
    trace: List[BatchTraceItem] = Field(default_factory=list, description="Chronological supply chain events")
    genealogy: Optional[GenealogyGraphResponse] = Field(None, description="Upstream & downstream genealogy graph")
    lab_records: List[LabRecordResponse] = Field(default_factory=list, description="Laboratory quality test records")
    evidence: List[EvidenceResponse] = Field(default_factory=list, description="Digital evidence file metadata")
    reconciliations: List[ReconciliationResponse] = Field(default_factory=list, description="Mass conservation reconciliation records")
    has_anomalies: bool = Field(False, description="Flag indicating if any anomalies exist in quality or mass conservation")
    blockchain_status: Optional[str] = Field("NOT_ANCHORED", description="ANCHORED, VERIFIED, or NOT_ANCHORED")
    blockchain_transaction_hash: Optional[str] = Field(None, description="Blockchain transaction hash reference if anchored")
    blockchain_anchored_at: Optional[datetime] = Field(None, description="Timestamp when blockchain anchor was recorded")

    model_config = ConfigDict(from_attributes=True)

