from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict

class AnalyticsOverviewResponse(BaseModel):
    total_users: int
    active_users: int
    users_by_role: Dict[str, int]
    total_batches: int
    active_batches: int
    completed_batches: int
    total_supply_chain_events: int
    total_lab_records: int
    total_evidence_records: int
    total_reconciliations: int
    total_flagged_anomalies: int
    total_blockchain_anchors: int
    verified_blockchain_anchors: int
    tampered_blockchain_records: int
    failed_blockchain_anchors: int
    qr_enabled_batches: int
    predictions_tracked: bool = False
    prediction_requests_stored: int = 0

class DateTrendItem(BaseModel):
    date: str
    count: int

class BatchSummaryItem(BaseModel):
    batch_id: str
    source_type: str
    quantity_kg: float
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BatchAnalyticsResponse(BaseModel):
    total_matching_batches: int
    total_quantity_kg: float
    counts_by_status: Dict[str, int]
    counts_by_source_type: Dict[str, int]
    batch_creation_trend: List[DateTrendItem]
    items: List[BatchSummaryItem]
    page: int
    page_size: int
    total_pages: int

class QuantityFlowStats(BaseModel):
    total_harvest_kg: float
    total_processed_kg: float
    total_dispatched_kg: float

class SupplyChainAnalyticsResponse(BaseModel):
    total_supply_chain_events: int
    events_by_type: Dict[str, int]
    events_by_date: List[DateTrendItem]
    batches_with_incomplete_traces: int
    reconciliation_counts: Dict[str, int]
    reconciliation_discrepancies_total_loss_kg: float
    quantity_flow_stats: QuantityFlowStats
    anomaly_events_count: int

class RecentAnomalyItem(BaseModel):
    batch_id: str
    anomaly_type: str
    description: str
    flagged_at: datetime
    detection_mechanism: str  # RULE_BASED or ML_BASED

class AnomalyAnalyticsResponse(BaseModel):
    total_anomaly_records: int
    flagged_batches_count: int
    normal_batches_count: int
    anomaly_count_by_type: Dict[str, int]
    anomaly_count_by_batch: Dict[str, int]
    detection_mechanism_breakdown: Dict[str, int]
    recent_anomalies: List[RecentAnomalyItem]

class ModelMetadataItem(BaseModel):
    model_name: str
    type: str
    dataset: str
    status: str

class PredictionAnalyticsResponse(BaseModel):
    predictions_persisted: bool = False
    total_prediction_records: int = 0
    inference_capability: Dict[str, bool]
    model_metadata: List[ModelMetadataItem]

class RecentAnchorItem(BaseModel):
    batch_id: str
    record_type: str
    blockchain_provider: str
    network: str
    transaction_hash: str
    status: str
    anchored_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BlockchainAnalyticsResponse(BaseModel):
    total_anchors: int
    anchors_by_provider: Dict[str, int]
    anchors_by_network: Dict[str, int]
    anchors_by_status: Dict[str, int]
    verified_count: int
    failed_count: int
    tampered_count: int
    latest_anchor_timestamp: Optional[datetime] = None
    recent_anchors: List[RecentAnchorItem]

class UserSummaryItem(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserAnalyticsResponse(BaseModel):
    total_users: int
    active_users: int
    inactive_users: int
    count_by_role: Dict[str, int]
    recently_created_users: List[UserSummaryItem]

class AuditLogItem(BaseModel):
    id: int
    actor_id: Optional[int] = None
    action: str
    entity_type: str
    entity_id: str
    timestamp: datetime
    details: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AuditLogQueryResponse(BaseModel):
    items: List[AuditLogItem]
    page: int
    page_size: int
    total: int
    total_pages: int

class SubsystemStatus(BaseModel):
    status: str
    details: Optional[Dict[str, Any]] = None

class SystemMonitoringResponse(BaseModel):
    application_status: str
    version: str
    timestamp: datetime
    database: SubsystemStatus
    ml_models: SubsystemStatus
    blockchain: SubsystemStatus
    qr_capability: SubsystemStatus
    voice_stt: SubsystemStatus
