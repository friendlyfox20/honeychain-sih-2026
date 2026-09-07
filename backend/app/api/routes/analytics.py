from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.dependencies import require_roles
from app.models.user import User
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    BatchAnalyticsResponse,
    SupplyChainAnalyticsResponse,
    AnomalyAnalyticsResponse,
    PredictionAnalyticsResponse,
    BlockchainAnalyticsResponse,
    UserAnalyticsResponse,
    AuditLogQueryResponse,
    SystemMonitoringResponse
)
from app.services import analytics_service

router = APIRouter(tags=["Admin Analytics & Monitoring"])

@router.get(
    "/admin/analytics/overview",
    response_model=AnalyticsOverviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Get high-level system analytics overview"
)
def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN"))
):
    """
    Returns aggregated metrics for users, batches, supply-chain events, lab tests, reconciliations, anomalies, blockchain anchors, and QR status.
    Requires ADMIN role.
    """
    return analytics_service.get_analytics_overview(db)

@router.get(
    "/admin/analytics/batches",
    response_model=BatchAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get batch statistics, totals, creation trends, and paginated records"
)
def get_batch_analytics(
    start_date: Optional[str] = Query(None, description="Optional start ISO date (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)"),
    end_date: Optional[str] = Query(None, description="Optional end ISO date"),
    batch_status: Optional[str] = Query(None, alias="status", description="Filter by batch status (e.g. CREATED, IN_PROCESSING, FLAGGED, COMPLETED)"),
    source_type: Optional[str] = Query(None, description="Filter by source type (e.g. HIVE, HARVEST, MERGED_BATCH)"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN"))
):
    """
    Returns batch metrics, total quantity kg, status/source breakdowns, creation timeline trend, and paginated items.
    Requires ADMIN role.
    """
    return analytics_service.get_batch_analytics(
        db=db,
        start_date=start_date,
        end_date=end_date,
        batch_status=batch_status,
        source_type=source_type,
        page=page,
        page_size=page_size
    )

@router.get(
    "/admin/analytics/supply-chain",
    response_model=SupplyChainAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get supply-chain event breakdown, quantity flow, and reconciliation stats"
)
def get_supply_chain_analytics(
    start_date: Optional[str] = Query(None, description="Optional start ISO date"),
    end_date: Optional[str] = Query(None, description="Optional end ISO date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN"))
):
    """
    Returns event counts by type, event date timeline, reconciliation loss kg totals, and quantity flow statistics.
    Requires ADMIN role.
    """
    return analytics_service.get_supply_chain_analytics(db, start_date=start_date, end_date=end_date)

@router.get(
    "/admin/analytics/anomalies",
    response_model=AnomalyAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get anomaly analytics, flagged counts, and recent alert logs"
)
def get_anomaly_analytics(
    start_date: Optional[str] = Query(None, description="Optional start ISO date"),
    end_date: Optional[str] = Query(None, description="Optional end ISO date"),
    batch_id: Optional[str] = Query(None, description="Filter by batch ID"),
    anomaly_type: Optional[str] = Query(None, description="Filter by anomaly type (e.g. RECONCILIATION_ANOMALY, LAB_QUALITY_FAILURE)"),
    flagged_only: bool = Query(False, description="Set to true to return flagged anomalies only"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN"))
):
    """
    Returns anomaly counts by type, affected batch summary, detection mechanism breakdown (RULE_BASED vs ML_BASED), and recent anomaly logs.
    Requires ADMIN role.
    """
    return analytics_service.get_anomaly_analytics(
        db=db,
        start_date=start_date,
        end_date=end_date,
        batch_id=batch_id,
        anomaly_type=anomaly_type,
        flagged_only=flagged_only
    )

@router.get(
    "/admin/analytics/predictions",
    response_model=PredictionAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get ML model metadata and inference engine capability status"
)
def get_prediction_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN"))
):
    """
    Returns status of inference capabilities, persisted records metadata, and ML model details.
    Requires ADMIN role.
    """
    return analytics_service.get_prediction_analytics()

@router.get(
    "/admin/analytics/blockchain",
    response_model=BlockchainAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get blockchain anchor metrics, status breakdown, and recent proof logs"
)
def get_blockchain_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN"))
):
    """
    Returns blockchain anchor counts by provider, network, and status (VERIFIED, TAMPERED, FAILED), along with recent anchor proofs.
    Requires ADMIN role.
    """
    return analytics_service.get_blockchain_analytics(db)

@router.get(
    "/admin/analytics/users",
    response_model=UserAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user registration metrics, role counts, and recent user list"
)
def get_user_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN"))
):
    """
    Returns user totals, active/inactive counts, role distribution, and recently registered user profiles (without password hashes).
    Requires ADMIN role.
    """
    return analytics_service.get_user_analytics(db)

@router.get(
    "/admin/audit-logs",
    response_model=AuditLogQueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Query and page system audit logs"
)
def query_audit_logs(
    start_date: Optional[str] = Query(None, description="Optional start ISO date"),
    end_date: Optional[str] = Query(None, description="Optional end ISO date"),
    actor_id: Optional[int] = Query(None, description="Filter by actor/user ID"),
    action: Optional[str] = Query(None, description="Filter by audit action (e.g. CREATE_BATCH, ANCHOR_BLOCKCHAIN_RECORD)"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type (e.g. Batch, SupplyChainEvent)"),
    entity_id: Optional[str] = Query(None, description="Filter by entity ID"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN"))
):
    """
    Returns paginated audit log entries with filter support.
    Requires ADMIN role.
    """
    return analytics_service.get_audit_logs_paginated(
        db=db,
        start_date=start_date,
        end_date=end_date,
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        page=page,
        page_size=page_size
    )

@router.get(
    "/admin/monitoring",
    response_model=SystemMonitoringResponse,
    status_code=status.HTTP_200_OK,
    summary="Get detailed operational system health and subsystem monitoring status"
)
def get_system_monitoring(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN"))
):
    """
    Returns operational health status for database, ML models, blockchain provider, QR engine, and STT service.
    Requires ADMIN role.
    """
    return analytics_service.get_system_monitoring(db)
