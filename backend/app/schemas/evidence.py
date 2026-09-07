from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class EvidenceCreate(BaseModel):
    evidence_type: str = Field(..., json_schema_extra={"example": "PHOTO"}, description="PHOTO, DOCUMENT, CERTIFICATE, RECEIPT, OTHER")
    file_reference: str = Field(..., json_schema_extra={"example": "storage/path/example.jpg"}, description="Path or identifier for file")
    description: Optional[str] = Field(None, json_schema_extra={"example": "Harvest photograph"}, description="Description of evidence")
    uploaded_by: Optional[int] = Field(None, description="ID of uploader user")

class EvidenceResponse(BaseModel):
    id: int
    batch_id: str
    evidence_type: str
    file_reference: str
    description: Optional[str] = None
    uploaded_by: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
