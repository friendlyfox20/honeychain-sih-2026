from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class LabRecordCreate(BaseModel):
    test_name: str = Field(..., json_schema_extra={"example": "Purity Test"}, description="Name of laboratory test")
    test_result: Optional[str] = Field(None, json_schema_extra={"example": "Pass"}, description="Test output or reading details")
    status: str = Field("PASSED", json_schema_extra={"example": "PASSED"}, description="PENDING, PASSED, or FAILED")
    laboratory_name: Optional[str] = Field(None, json_schema_extra={"example": "Lab A"}, description="Name of testing laboratory")
    notes: Optional[str] = Field(None, json_schema_extra={"example": "Sample verified"}, description="Additional test notes")

class LabRecordResponse(BaseModel):
    id: int
    batch_id: str
    test_name: str
    test_result: Optional[str] = None
    status: str
    tested_at: datetime
    laboratory_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
