from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class BatchRelationshipCreate(BaseModel):
    parent_batch_id: str = Field(..., json_schema_extra={"example": "BATCH-H001"}, description="Parent Batch ID")
    child_batch_id: str = Field(..., json_schema_extra={"example": "BATCH-P001"}, description="Child Batch ID")
    relationship_type: str = Field("SPLIT", json_schema_extra={"example": "SPLIT"}, description="Relationship type: SPLIT, MERGE, DERIVED, TRANSFER")
    quantity_transferred_kg: float = Field(..., gt=0, json_schema_extra={"example": 50.0}, description="Transferred quantity in kg (> 0)")
    notes: Optional[str] = Field(None, json_schema_extra={"example": "Harvest split into processing batch"}, description="Optional notes")

class BatchRelationshipResponse(BaseModel):
    id: int
    parent_batch_id: str
    child_batch_id: str
    relationship_type: str
    quantity_transferred_kg: float
    timestamp: datetime
    created_by: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class GenealogyNode(BaseModel):
    batch_id: str
    source_type: str
    quantity_kg: float
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class GenealogyLink(BaseModel):
    parent_batch_id: str
    child_batch_id: str
    relationship_type: str
    quantity_transferred_kg: float
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class GenealogyGraphResponse(BaseModel):
    batch_id: str
    current_status: str
    ancestors: List[GenealogyNode]
    descendants: List[GenealogyNode]
    links: List[GenealogyLink]
    total_upstream_count: int
    total_downstream_count: int
