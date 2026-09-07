from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class BlockchainAnchorRequest(BaseModel):
    record_type: str = Field("BATCH_FULL", json_schema_extra={"example": "BATCH_FULL"}, description="BATCH_FULL, BATCH_CREATION, SUPPLY_CHAIN_EVENT, LAB_RECORD, RECONCILIATION, GENEALOGY")
    record_id: Optional[str] = Field(None, json_schema_extra={"example": "EVT-101"}, description="Optional specific entity ID within batch")

class BlockchainAnchorResponse(BaseModel):
    id: int
    batch_id: str
    record_type: str
    record_id: Optional[str] = None
    payload_hash: str = Field(..., description="Canonical SHA-256 hash of authoritative DB record")
    blockchain_provider: str
    network: str
    transaction_hash: str
    block_number: Optional[int] = None
    status: str
    anchored_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BlockchainVerificationResponse(BaseModel):
    verified: bool = Field(..., description="True if current DB record hash matches anchored blockchain hash")
    integrity_status: str = Field(..., json_schema_extra={"example": "VERIFIED"}, description="VERIFIED, TAMPERED, NOT_ANCHORED")
    batch_id: str
    current_payload_hash: str = Field(..., description="SHA-256 hash calculated from current DB state")
    anchored_payload_hash: Optional[str] = Field(None, description="SHA-256 hash stored at time of anchoring")
    transaction_hash: Optional[str] = Field(None, description="Blockchain transaction reference hash")
    network: Optional[str] = Field(None, description="Blockchain network name")
    message: str = Field(..., description="Human-readable verification result message")

    model_config = ConfigDict(from_attributes=True)

class TransactionDetailResponse(BaseModel):
    transaction_hash: str
    network: str
    provider: str
    block_number: Optional[int] = None
    payload_hash: str
    status: str
    anchored_at: datetime

    model_config = ConfigDict(from_attributes=True)
