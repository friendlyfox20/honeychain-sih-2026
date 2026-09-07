import os
import math
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy import func, cast, Date, or_
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.config import settings
from app.models.user import User
from app.models.batch import Batch
from app.models.supply_chain_event import SupplyChainEvent
from app.models.lab_record import LabRecord
from app.models.evidence import Evidence
from app.models.reconciliation import ReconciliationRecord
from app.models.blockchain_anchor import BlockchainAnchor
from app.models.qr_verification import QRVerification
from app.models.audit_log import AuditLog

from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    BatchAnalyticsResponse,
    BatchSummaryItem,
    DateTrendItem,
    SupplyChainAnalyticsResponse,
    QuantityFlowStats,
    AnomalyAnalyticsResponse,
    RecentAnomalyItem,
    PredictionAnalyticsResponse,
    ModelMetadataItem,
    BlockchainAnalyticsResponse,
    RecentAnchorItem,
    UserAnalyticsResponse,
    UserSummaryItem,
    AuditLogQueryResponse,
    AuditLogItem,
    SystemMonitoringResponse,
    SubsystemStatus
)

logger = logging.getLogger(__name__)

def parse_iso_date(date_str: Optional[str]) -> Optional[datetime]:
    if not date_str or not date_str.strip():
        return None
    try:
        # Handle trailing Z or timezone offsets
        clean_str = date_str.replace("Z", "+00:00")
        dt = datetime.fromisoformat(clean_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid ISO date format: '{date_str}'. Expected format: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS"
        )

def validate_date_range(start_date: Optional[str], end_date: Optional[str]) -> Tuple[Optional[datetime], Optional[datetime]]:
    start_dt = parse_iso_date(start_date)
    end_dt = parse_iso_date(end_date)
    if start_dt and end_dt and start_dt > end_dt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date range: start_date ({start_date}) cannot be after end_date ({end_date})."
        )
    return start_dt, end_dt

def validate_pagination(page: int, page_size: int):
    if page < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="page must be greater than or equal to 1"
        )
    if page_size < 1 or page_size > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="page_size must be between 1 and 100"
        )

def format_date_str(d: Any) -> Optional[str]:
    if d is None:
        return None
    if hasattr(d, "strftime"):
        return d.strftime("%Y-%m-%d")
    s = str(d)
    return s[:10] if len(s) >= 10 else s

def get_analytics_overview(db: Session) -> AnalyticsOverviewResponse:
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
    
    users_by_role_rows = db.query(User.role, func.count(User.id)).group_by(User.role).all()
    users_by_role = {role: count for role, count in users_by_role_rows}

    total_batches = db.query(func.count(Batch.id)).scalar() or 0
    active_batches = db.query(func.count(Batch.id)).filter(Batch.status != "COMPLETED").scalar() or 0
    completed_batches = db.query(func.count(Batch.id)).filter(Batch.status == "COMPLETED").scalar() or 0

    total_events = db.query(func.count(SupplyChainEvent.id)).scalar() or 0
    total_lab = db.query(func.count(LabRecord.id)).scalar() or 0
    total_evidence = db.query(func.count(Evidence.id)).scalar() or 0
    total_reconciliations = db.query(func.count(ReconciliationRecord.id)).scalar() or 0

    flagged_batches = db.query(func.count(Batch.id)).filter(Batch.status == "FLAGGED").scalar() or 0
    anomaly_reconciliations = db.query(func.count(ReconciliationRecord.id)).filter(ReconciliationRecord.status == "ANOMALY").scalar() or 0
    failed_lab = db.query(func.count(LabRecord.id)).filter(LabRecord.status == "FAILED").scalar() or 0
    total_flagged_anomalies = flagged_batches + anomaly_reconciliations + failed_lab

    total_anchors = db.query(func.count(BlockchainAnchor.id)).scalar() or 0
    verified_anchors = db.query(func.count(BlockchainAnchor.id)).filter(BlockchainAnchor.status == "VERIFIED").scalar() or 0
    tampered_anchors = db.query(func.count(BlockchainAnchor.id)).filter(BlockchainAnchor.status == "TAMPERED").scalar() or 0
    failed_anchors = db.query(func.count(BlockchainAnchor.id)).filter(BlockchainAnchor.status == "FAILED").scalar() or 0

    qr_enabled_batches = db.query(func.count(func.distinct(QRVerification.batch_id))).filter(QRVerification.is_active == True).scalar() or 0

    return AnalyticsOverviewResponse(
        total_users=total_users,
        active_users=active_users,
        users_by_role=users_by_role,
        total_batches=total_batches,
        active_batches=active_batches,
        completed_batches=completed_batches,
        total_supply_chain_events=total_events,
        total_lab_records=total_lab,
        total_evidence_records=total_evidence,
        total_reconciliations=total_reconciliations,
        total_flagged_anomalies=total_flagged_anomalies,
        total_blockchain_anchors=total_anchors,
        verified_blockchain_anchors=verified_anchors,
        tampered_blockchain_records=tampered_anchors,
        failed_blockchain_anchors=failed_anchors,
        qr_enabled_batches=qr_enabled_batches,
        predictions_tracked=False,
        prediction_requests_stored=0
    )

def get_batch_analytics(
    db: Session,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    batch_status: Optional[str] = None,
    source_type: Optional[str] = None,
    page: int = 1,
    page_size: int = 20
) -> BatchAnalyticsResponse:
    start_dt, end_dt = validate_date_range(start_date, end_date)
    validate_pagination(page, page_size)

    query = db.query(Batch)
    if start_dt:
        query = query.filter(Batch.created_at >= start_dt)
    if end_dt:
        query = query.filter(Batch.created_at <= end_dt)
    if batch_status:
        query = query.filter(Batch.status == batch_status.upper())
    if source_type:
        query = query.filter(Batch.source_type == source_type.upper())

    total_matching = query.count()
    total_pages = math.ceil(total_matching / page_size) if total_matching > 0 else 1

    # Total quantity
    sum_query = db.query(func.sum(Batch.quantity_kg))
    if start_dt:
        sum_query = sum_query.filter(Batch.created_at >= start_dt)
    if end_dt:
        sum_query = sum_query.filter(Batch.created_at <= end_dt)
    if batch_status:
        sum_query = sum_query.filter(Batch.status == batch_status.upper())
    if source_type:
        sum_query = sum_query.filter(Batch.source_type == source_type.upper())
    total_qty_val = sum_query.scalar()
    total_qty = float(total_qty_val) if total_qty_val is not None else 0.0

    # Counts by status
    status_q = db.query(Batch.status, func.count(Batch.id))
    if start_dt:
        status_q = status_q.filter(Batch.created_at >= start_dt)
    if end_dt:
        status_q = status_q.filter(Batch.created_at <= end_dt)
    if source_type:
        status_q = status_q.filter(Batch.source_type == source_type.upper())
    counts_by_status = {st: cnt for st, cnt in status_q.group_by(Batch.status).all() if st is not None}

    # Counts by source type
    source_q = db.query(Batch.source_type, func.count(Batch.id))
    if start_dt:
        source_q = source_q.filter(Batch.created_at >= start_dt)
    if end_dt:
        source_q = source_q.filter(Batch.created_at <= end_dt)
    if batch_status:
        source_q = source_q.filter(Batch.status == batch_status.upper())
    counts_by_source_type = {src: cnt for src, cnt in source_q.group_by(Batch.source_type).all() if src is not None}

    # Creation trend
    date_col = func.date(Batch.created_at)
    trend_q = db.query(date_col, func.count(Batch.id))
    if start_dt:
        trend_q = trend_q.filter(Batch.created_at >= start_dt)
    if end_dt:
        trend_q = trend_q.filter(Batch.created_at <= end_dt)
    if batch_status:
        trend_q = trend_q.filter(Batch.status == batch_status.upper())
    if source_type:
        trend_q = trend_q.filter(Batch.source_type == source_type.upper())
    
    trend_rows = trend_q.group_by(date_col).order_by(date_col.asc()).all()
    batch_creation_trend = [
        DateTrendItem(date=format_date_str(d), count=cnt)
        for d, cnt in trend_rows if d is not None
    ]

    # Paginated items
    offset = (page - 1) * page_size
    items_db = query.order_by(Batch.created_at.desc()).offset(offset).limit(page_size).all()
    items = [BatchSummaryItem.model_validate(b) for b in items_db]

    return BatchAnalyticsResponse(
        total_matching_batches=total_matching,
        total_quantity_kg=total_qty,
        counts_by_status=counts_by_status,
        counts_by_source_type=counts_by_source_type,
        batch_creation_trend=batch_creation_trend,
        items=items,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

def get_supply_chain_analytics(
    db: Session,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> SupplyChainAnalyticsResponse:
    start_dt, end_dt = validate_date_range(start_date, end_date)

    query = db.query(SupplyChainEvent)
    if start_dt:
        query = query.filter(SupplyChainEvent.timestamp >= start_dt)
    if end_dt:
        query = query.filter(SupplyChainEvent.timestamp <= end_dt)

    total_events = query.count()

    # Events by type
    type_q = db.query(SupplyChainEvent.event_type, func.count(SupplyChainEvent.id))
    if start_dt:
        type_q = type_q.filter(SupplyChainEvent.timestamp >= start_dt)
    if end_dt:
        type_q = type_q.filter(SupplyChainEvent.timestamp <= end_dt)
    events_by_type = {evt_type: cnt for evt_type, cnt in type_q.group_by(SupplyChainEvent.event_type).all() if evt_type is not None}

    # Events by date
    date_col = func.date(SupplyChainEvent.timestamp)
    date_q = db.query(date_col, func.count(SupplyChainEvent.id))
    if start_dt:
        date_q = date_q.filter(SupplyChainEvent.timestamp >= start_dt)
    if end_dt:
        date_q = date_q.filter(SupplyChainEvent.timestamp <= end_dt)
    events_by_date = [
        DateTrendItem(date=format_date_str(d), count=cnt)
        for d, cnt in date_q.group_by(date_col).order_by(date_col.asc()).all() if d is not None
    ]

    # Batches with incomplete traces (no events or not PACKAGED/DISPATCHED/COMPLETED)
    incomplete_batches = db.query(func.count(Batch.id)).filter(
        Batch.status.in_(["CREATED", "IN_COLLECTION", "IN_PROCESSING", "IN_LAB"])
    ).scalar() or 0

    # Reconciliations
    rec_q = db.query(ReconciliationRecord.status, func.count(ReconciliationRecord.id))
    if start_dt:
        rec_q = rec_q.filter(ReconciliationRecord.checked_at >= start_dt)
    if end_dt:
        rec_q = rec_q.filter(ReconciliationRecord.checked_at <= end_dt)
    reconciliation_counts = {st: cnt for st, cnt in rec_q.group_by(ReconciliationRecord.status).all() if st is not None}

    # Total loss kg
    loss_q = db.query(func.sum(ReconciliationRecord.loss_quantity_kg))
    if start_dt:
        loss_q = loss_q.filter(ReconciliationRecord.checked_at >= start_dt)
    if end_dt:
        loss_q = loss_q.filter(ReconciliationRecord.checked_at <= end_dt)
    loss_val = loss_q.scalar()
    total_loss = float(loss_val) if loss_val is not None else 0.0

    # Quantity flow stats
    harvest_val = db.query(func.sum(SupplyChainEvent.quantity_kg)).filter(SupplyChainEvent.event_type == "HARVEST").scalar()
    processed_val = db.query(func.sum(SupplyChainEvent.quantity_kg)).filter(SupplyChainEvent.event_type == "PROCESSING").scalar()
    dispatched_val = db.query(func.sum(SupplyChainEvent.quantity_kg)).filter(SupplyChainEvent.event_type == "DISPATCH").scalar()

    harvest_qty = float(harvest_val) if harvest_val is not None else 0.0
    processed_qty = float(processed_val) if processed_val is not None else 0.0
    dispatched_qty = float(dispatched_val) if dispatched_val is not None else 0.0

    anomaly_events_count = reconciliation_counts.get("ANOMALY", 0)

    return SupplyChainAnalyticsResponse(
        total_supply_chain_events=total_events,
        events_by_type=events_by_type,
        events_by_date=events_by_date,
        batches_with_incomplete_traces=incomplete_batches,
        reconciliation_counts=reconciliation_counts,
        reconciliation_discrepancies_total_loss_kg=total_loss,
        quantity_flow_stats=QuantityFlowStats(
            total_harvest_kg=harvest_qty,
            total_processed_kg=processed_qty,
            total_dispatched_kg=dispatched_qty
        ),
        anomaly_events_count=anomaly_events_count
    )

def get_anomaly_analytics(
    db: Session,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    batch_id: Optional[str] = None,
    anomaly_type: Optional[str] = None,
    flagged_only: bool = False
) -> AnomalyAnalyticsResponse:
    start_dt, end_dt = validate_date_range(start_date, end_date)

    recent_anomalies: List[RecentAnomalyItem] = []
    anomaly_count_by_type: Dict[str, int] = {
        "RECONCILIATION_ANOMALY": 0,
        "LAB_QUALITY_FAILURE": 0,
        "FLAGGED_BATCH": 0,
        "BLOCKCHAIN_TAMPERED": 0
    }
    anomaly_count_by_batch: Dict[str, int] = {}
    rule_based_count = 0
    ml_based_count = 0

    # 1. Reconciliation Anomalies
    rec_q = db.query(ReconciliationRecord)
    if start_dt:
        rec_q = rec_q.filter(ReconciliationRecord.checked_at >= start_dt)
    if end_dt:
        rec_q = rec_q.filter(ReconciliationRecord.checked_at <= end_dt)
    if batch_id:
        rec_q = rec_q.filter(ReconciliationRecord.batch_id == batch_id)
    if flagged_only:
        rec_q = rec_q.filter(ReconciliationRecord.status == "ANOMALY")

    for rec in rec_q.all():
        if rec.status == "ANOMALY":
            anomaly_count_by_type["RECONCILIATION_ANOMALY"] += 1
            anomaly_count_by_batch[rec.batch_id] = anomaly_count_by_batch.get(rec.batch_id, 0) + 1
            rule_based_count += 1
            recent_anomalies.append(RecentAnomalyItem(
                batch_id=rec.batch_id,
                anomaly_type="RECONCILIATION_ANOMALY",
                description=rec.reason or f"Mass conservation loss anomaly ({rec.loss_quantity_kg} kg)",
                flagged_at=rec.checked_at,
                detection_mechanism="RULE_BASED"
            ))

    # 2. Lab Quality Failures
    lab_q = db.query(LabRecord)
    if start_dt:
        lab_q = lab_q.filter(LabRecord.tested_at >= start_dt)
    if end_dt:
        lab_q = lab_q.filter(LabRecord.tested_at <= end_dt)
    if batch_id:
        lab_q = lab_q.filter(LabRecord.batch_id == batch_id)
    if flagged_only:
        lab_q = lab_q.filter(LabRecord.status == "FAILED")

    for lab in lab_q.all():
        if lab.status == "FAILED":
            anomaly_count_by_type["LAB_QUALITY_FAILURE"] += 1
            anomaly_count_by_batch[lab.batch_id] = anomaly_count_by_batch.get(lab.batch_id, 0) + 1
            rule_based_count += 1
            recent_anomalies.append(RecentAnomalyItem(
                batch_id=lab.batch_id,
                anomaly_type="LAB_QUALITY_FAILURE",
                description=f"Lab test '{lab.test_name}' FAILED: {lab.test_result or 'Unspecified failure'}",
                flagged_at=lab.tested_at,
                detection_mechanism="RULE_BASED"
            ))

    # 3. Flagged Batches
    batch_q = db.query(Batch)
    if start_dt:
        batch_q = batch_q.filter(Batch.created_at >= start_dt)
    if end_dt:
        batch_q = batch_q.filter(Batch.created_at <= end_dt)
    if batch_id:
        batch_q = batch_q.filter(Batch.batch_id == batch_id)
    if flagged_only:
        batch_q = batch_q.filter(Batch.status == "FLAGGED")

    for b in batch_q.all():
        if b.status == "FLAGGED":
            anomaly_count_by_type["FLAGGED_BATCH"] += 1
            anomaly_count_by_batch[b.batch_id] = anomaly_count_by_batch.get(b.batch_id, 0) + 1
            ml_based_count += 1
            recent_anomalies.append(RecentAnomalyItem(
                batch_id=b.batch_id,
                anomaly_type="FLAGGED_BATCH",
                description=f"Batch status set to FLAGGED (2-Layer anomaly / reconciliation alert)",
                flagged_at=b.updated_at or b.created_at,
                detection_mechanism="ML_BASED"
            ))

    # 4. Tampered Blockchain Anchors
    bc_q = db.query(BlockchainAnchor).filter(BlockchainAnchor.status == "TAMPERED")
    if start_dt:
        bc_q = bc_q.filter(BlockchainAnchor.anchored_at >= start_dt)
    if end_dt:
        bc_q = bc_q.filter(BlockchainAnchor.anchored_at <= end_dt)
    if batch_id:
        bc_q = bc_q.filter(BlockchainAnchor.batch_id == batch_id)

    for bc in bc_q.all():
        anomaly_count_by_type["BLOCKCHAIN_TAMPERED"] += 1
        anomaly_count_by_batch[bc.batch_id] = anomaly_count_by_batch.get(bc.batch_id, 0) + 1
        rule_based_count += 1
        recent_anomalies.append(RecentAnomalyItem(
            batch_id=bc.batch_id,
            anomaly_type="BLOCKCHAIN_TAMPERED",
            description=f"Blockchain proof mismatch detected! Database record altered after anchoring.",
            flagged_at=bc.anchored_at,
            detection_mechanism="RULE_BASED"
        ))

    # Sort recent anomalies descending
    recent_anomalies.sort(key=lambda x: x.flagged_at, reverse=True)

    total_records = len(recent_anomalies)
    flagged_batches_count = len(anomaly_count_by_batch)
    total_batches = db.query(func.count(Batch.id)).scalar() or 0
    normal_batches_count = max(0, total_batches - flagged_batches_count)

    return AnomalyAnalyticsResponse(
        total_anomaly_records=total_records,
        flagged_batches_count=flagged_batches_count,
        normal_batches_count=normal_batches_count,
        anomaly_count_by_type=anomaly_count_by_type,
        anomaly_count_by_batch=anomaly_count_by_batch,
        detection_mechanism_breakdown={
            "RULE_BASED": rule_based_count,
            "ML_BASED": ml_based_count
        },
        recent_anomalies=recent_anomalies[:20]
    )

def get_prediction_analytics() -> PredictionAnalyticsResponse:
    # Check ML model file availability using resolved model directory
    model_dir = settings.get_resolved_model_dir()
    yield_model_path = os.path.join(model_dir, "best_honey_yield_model.joblib")
    daily_model_path = os.path.join(model_dir, "daily_production_best_model.joblib")
    anomaly_model_path = os.path.join(model_dir, "best_anomaly_model.joblib")

    yield_avail = os.path.exists(yield_model_path)
    daily_avail = os.path.exists(daily_model_path)
    anomaly_avail = os.path.exists(anomaly_model_path)

    metadata_items = [
        ModelMetadataItem(
            model_name="Honey Yield Predictor",
            type="RandomForestRegressor / ML Pipeline",
            dataset="Honey_Production_Dataset_for_2024.csv",
            status="READY" if yield_avail else "MODEL_FILE_MISSING"
        ),
        ModelMetadataItem(
            model_name="Daily Honey Production Rate Predictor",
            type="RandomForestRegressor / ML Pipeline",
            dataset="Honey_Production_Dataset_for_2024.csv",
            status="READY" if daily_avail else "MODEL_FILE_MISSING"
        ),
        ModelMetadataItem(
            model_name="Supply-Chain 2-Layer Anomaly Detector",
            type="IsolationForest + Quantity-Conservation Rules",
            dataset="supply_chain_demo.csv",
            status="READY" if anomaly_avail else "MODEL_FILE_MISSING"
        )
    ]

    return PredictionAnalyticsResponse(
        predictions_persisted=False,
        total_prediction_records=0,
        inference_capability={
            "yield_prediction_available": yield_avail,
            "daily_production_prediction_available": daily_avail,
            "supply_chain_anomaly_detection_available": anomaly_avail
        },
        model_metadata=metadata_items
    )

def get_blockchain_analytics(db: Session) -> BlockchainAnalyticsResponse:
    total_anchors = db.query(func.count(BlockchainAnchor.id)).scalar() or 0

    provider_rows = db.query(BlockchainAnchor.blockchain_provider, func.count(BlockchainAnchor.id)).group_by(BlockchainAnchor.blockchain_provider).all()
    anchors_by_provider = {prov: cnt for prov, cnt in provider_rows if prov is not None}

    network_rows = db.query(BlockchainAnchor.network, func.count(BlockchainAnchor.id)).group_by(BlockchainAnchor.network).all()
    anchors_by_network = {net: cnt for net, cnt in network_rows if net is not None}

    status_rows = db.query(BlockchainAnchor.status, func.count(BlockchainAnchor.id)).group_by(BlockchainAnchor.status).all()
    anchors_by_status = {st: cnt for st, cnt in status_rows if st is not None}

    verified_count = anchors_by_status.get("VERIFIED", 0)
    failed_count = anchors_by_status.get("FAILED", 0)
    tampered_count = anchors_by_status.get("TAMPERED", 0)

    latest_anchor = db.query(BlockchainAnchor).order_by(BlockchainAnchor.anchored_at.desc()).first()
    latest_ts = latest_anchor.anchored_at if latest_anchor else None

    recent_anchors_db = db.query(BlockchainAnchor).order_by(BlockchainAnchor.anchored_at.desc()).limit(10).all()
    recent_anchors = [
        RecentAnchorItem(
            batch_id=a.batch_id,
            record_type=a.record_type,
            blockchain_provider=a.blockchain_provider,
            network=a.network,
            transaction_hash=a.transaction_hash,
            status=a.status,
            anchored_at=a.anchored_at
        )
        for a in recent_anchors_db
    ]

    return BlockchainAnalyticsResponse(
        total_anchors=total_anchors,
        anchors_by_provider=anchors_by_provider,
        anchors_by_network=anchors_by_network,
        anchors_by_status=anchors_by_status,
        verified_count=verified_count,
        failed_count=failed_count,
        tampered_count=tampered_count,
        latest_anchor_timestamp=latest_ts,
        recent_anchors=recent_anchors
    )

def get_user_analytics(db: Session) -> UserAnalyticsResponse:
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
    inactive_users = db.query(func.count(User.id)).filter(User.is_active == False).scalar() or 0

    role_rows = db.query(User.role, func.count(User.id)).group_by(User.role).all()
    count_by_role = {r: cnt for r, cnt in role_rows if r is not None}

    recent_users_db = db.query(User).order_by(User.created_at.desc()).limit(10).all()
    recently_created_users = [
        UserSummaryItem.model_validate(u) for u in recent_users_db
    ]

    return UserAnalyticsResponse(
        total_users=total_users,
        active_users=active_users,
        inactive_users=inactive_users,
        count_by_role=count_by_role,
        recently_created_users=recently_created_users
    )

def get_audit_logs_paginated(
    db: Session,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    actor_id: Optional[int] = None,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    page: int = 1,
    page_size: int = 20
) -> AuditLogQueryResponse:
    start_dt, end_dt = validate_date_range(start_date, end_date)
    validate_pagination(page, page_size)

    query = db.query(AuditLog)
    if start_dt:
        query = query.filter(AuditLog.timestamp >= start_dt)
    if end_dt:
        query = query.filter(AuditLog.timestamp <= end_dt)
    if actor_id is not None:
        query = query.filter(AuditLog.actor_id == actor_id)
    if action:
        query = query.filter(AuditLog.action == action.upper())
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if entity_id:
        query = query.filter(AuditLog.entity_id == str(entity_id))

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    offset = (page - 1) * page_size
    logs_db = query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(page_size).all()
    items = [AuditLogItem.model_validate(l) for l in logs_db]

    return AuditLogQueryResponse(
        items=items,
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages
    )

def get_system_monitoring(db: Session) -> SystemMonitoringResponse:
    # 1. Database Connectivity Check
    db_status = "HEALTHY"
    db_details: Dict[str, Any] = {}
    try:
        # Simple test query
        db.query(User).first()
        db_details["engine"] = settings.DATABASE_URL.split("://")[0] if settings.DATABASE_URL else "sqlite"
        db_details["status"] = "CONNECTED"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "DEGRADED"
        db_details["status"] = "DISCONNECTED"
        db_details["error"] = str(e)

    # 2. ML Models Availability Check
    model_dir = settings.get_resolved_model_dir()
    yield_path = os.path.join(model_dir, "best_honey_yield_model.joblib")
    daily_path = os.path.join(model_dir, "daily_production_best_model.joblib")
    anomaly_path = os.path.join(model_dir, "best_anomaly_model.joblib")

    ml_yield_ok = os.path.exists(yield_path)
    ml_daily_ok = os.path.exists(daily_path)
    ml_anomaly_ok = os.path.exists(anomaly_path)

    ml_status = "HEALTHY" if (ml_yield_ok and ml_daily_ok and ml_anomaly_ok) else "DEGRADED"

    # 3. Blockchain Subsystem Check
    bc_enabled = settings.BLOCKCHAIN_ENABLED
    bc_status = "HEALTHY" if bc_enabled else "DISABLED"
    bc_details = {
        "enabled": bc_enabled,
        "provider": settings.BLOCKCHAIN_PROVIDER,
        "network": settings.BLOCKCHAIN_NETWORK
    }

    # 4. QR Capability Check
    qr_status = "HEALTHY"
    qr_details = {"capability": "AVAILABLE", "token_format": "UUIDv4_HEX64"}

    # 5. Voice STT Subsystem Check
    stt_status = "HEALTHY"
    try:
        from app.services.speech_service import get_active_stt_provider
        stt_prov = get_active_stt_provider()
        stt_details = {
            "status": "AVAILABLE",
            "active_provider": stt_prov.provider_name
        }
    except Exception as e:
        stt_status = "DEGRADED"
        stt_details = {"status": "UNAVAILABLE", "error": str(e)}

    # Overall Application Status
    app_status = "HEALTHY"
    if db_status != "HEALTHY" or ml_status != "HEALTHY":
        app_status = "DEGRADED"

    return SystemMonitoringResponse(
        application_status=app_status,
        version="1.0.0",
        timestamp=datetime.now(timezone.utc),
        database=SubsystemStatus(status=db_status, details=db_details),
        ml_models=SubsystemStatus(status=ml_status, details={
            "yield_model": "AVAILABLE" if ml_yield_ok else "MISSING",
            "daily_production_model": "AVAILABLE" if ml_daily_ok else "MISSING",
            "anomaly_model": "AVAILABLE" if ml_anomaly_ok else "MISSING"
        }),
        blockchain=SubsystemStatus(status=bc_status, details=bc_details),
        qr_capability=SubsystemStatus(status=qr_status, details=qr_details),
        voice_stt=SubsystemStatus(status=stt_status, details=stt_details)
    )
