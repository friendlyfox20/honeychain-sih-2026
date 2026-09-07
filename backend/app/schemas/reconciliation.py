from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class ReconciliationRequest(BaseModel):
    input_quantity_kg: float = Field(..., ge=0, json_schema_extra={"example": 50.0}, description="Input batch quantity (kg)")
    output_quantity_kg: float = Field(..., ge=0, json_schema_extra={"example": 47.0}, description="Output processed/packaged quantity (kg)")

class ReconciliationResponse(BaseModel):
    id: Optional[int] = None
    batch_id: str
    input_quantity_kg: float
    output_quantity_kg: float
    loss_quantity_kg: float
    status: str = Field(..., json_schema_extra={"example": "PASS"}, description="PASS, WARNING, or ANOMALY")
    reason: Optional[str] = None
    checked_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
