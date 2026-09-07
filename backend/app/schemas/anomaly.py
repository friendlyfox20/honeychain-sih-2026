from pydantic import BaseModel, Field

class AnomalyCheckRequest(BaseModel):
    batch_id: str = Field(..., json_schema_extra={"example": "BATCH-001"}, description="Unique Batch Identifier")
    harvest_quantity_kg: float = Field(..., ge=0, json_schema_extra={"example": 50.0}, description="Harvested quantity (kg)")
    processing_quantity_kg: float = Field(..., ge=0, json_schema_extra={"example": 48.0}, description="Processed quantity (kg)")
    bottled_quantity_kg: float = Field(..., ge=0, json_schema_extra={"example": 47.0}, description="Bottled quantity (kg)")
    dispatched_quantity_kg: float = Field(..., ge=0, json_schema_extra={"example": 45.0}, description="Dispatched quantity (kg)")

class RuleCheckDetails(BaseModel):
    processing_vs_harvest: str = Field(..., json_schema_extra={"example": "PASS"}, description="PASS if Processing <= Harvest, else FAIL")
    bottled_vs_processing: str = Field(..., json_schema_extra={"example": "PASS"}, description="PASS if Bottled <= Processing, else FAIL")
    dispatched_vs_bottled: str = Field(..., json_schema_extra={"example": "PASS"}, description="PASS if Dispatched <= Bottled, else FAIL")

class GapDetails(BaseModel):
    processing_gap_kg: float = Field(..., json_schema_extra={"example": -2.0}, description="Processing - Harvest (kg)")
    bottling_gap_kg: float = Field(..., json_schema_extra={"example": -1.0}, description="Bottled - Processing (kg)")
    dispatch_gap_kg: float = Field(..., json_schema_extra={"example": -2.0}, description="Dispatched - Bottled (kg)")

class AnomalyCheckResponse(BaseModel):
    batch_id: str = Field(..., json_schema_extra={"example": "BATCH-001"})
    rule_check: RuleCheckDetails
    gaps: GapDetails
    ml_prediction: str = Field(..., json_schema_extra={"example": "NORMAL"}, description="NORMAL or ANOMALY")
    final_status: str = Field(..., json_schema_extra={"example": "NORMAL"}, description="NORMAL or ANOMALY")
