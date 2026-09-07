import pytest
from fastapi.testclient import TestClient
from app.main import app
from tests.auth_helpers import get_auth_headers

client = TestClient(app)

def create_sample_batch(batch_id: str, quantity: float, headers: dict, source_type: str = "HARVEST"):
    resp = client.post("/api/v1/batches/", json={
        "batch_id": batch_id,
        "source_type": source_type,
        "quantity_kg": quantity,
        "location": "Nashik Apiary",
        "notes": f"Sample batch {batch_id}"
    }, headers=headers)
    assert resp.status_code == 201, f"Failed to create batch {batch_id}: {resp.text}"
    return resp.json()

def test_admin_analytics_overview_success():
    headers = get_auth_headers(client, role="ADMIN")
    res = client.get("/api/v1/admin/analytics/overview", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert "total_users" in data
    assert "total_batches" in data
    assert "total_supply_chain_events" in data
    assert "total_lab_records" in data
    assert "total_evidence_records" in data
    assert "total_reconciliations" in data
    assert "total_flagged_anomalies" in data
    assert "total_blockchain_anchors" in data
    assert "qr_enabled_batches" in data
    assert data["predictions_tracked"] is False

def test_admin_analytics_forbidden_for_non_admin():
    headers_beekeeper = get_auth_headers(client, role="BEEKEEPER")
    headers_processor = get_auth_headers(client, role="PROCESSOR")

    endpoints = [
        "/api/v1/admin/analytics/overview",
        "/api/v1/admin/analytics/batches",
        "/api/v1/admin/analytics/supply-chain",
        "/api/v1/admin/analytics/anomalies",
        "/api/v1/admin/analytics/predictions",
        "/api/v1/admin/analytics/blockchain",
        "/api/v1/admin/analytics/users",
        "/api/v1/admin/audit-logs",
        "/api/v1/admin/monitoring"
    ]

    for ep in endpoints:
        res1 = client.get(ep, headers=headers_beekeeper)
        assert res1.status_code == 403, f"Expected 403 for BEEKEEPER on {ep}, got {res1.status_code}"
        res2 = client.get(ep, headers=headers_processor)
        assert res2.status_code == 403, f"Expected 403 for PROCESSOR on {ep}, got {res2.status_code}"

def test_admin_analytics_unauthenticated_returns_401():
    endpoints = [
        "/api/v1/admin/analytics/overview",
        "/api/v1/admin/analytics/batches",
        "/api/v1/admin/analytics/supply-chain",
        "/api/v1/admin/analytics/anomalies",
        "/api/v1/admin/analytics/predictions",
        "/api/v1/admin/analytics/blockchain",
        "/api/v1/admin/analytics/users",
        "/api/v1/admin/audit-logs",
        "/api/v1/admin/monitoring"
    ]

    for ep in endpoints:
        res = client.get(ep)
        assert res.status_code == 401, f"Expected 401 for unauthenticated on {ep}, got {res.status_code}"

def test_batch_analytics_aggregation():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-AN-01", 100.0, headers, source_type="HARVEST")
    create_sample_batch("BATCH-AN-02", 150.0, headers, source_type="COLLECTION")

    res = client.get("/api/v1/admin/analytics/batches", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["total_matching_batches"] >= 2
    assert data["total_quantity_kg"] >= 250.0
    assert "counts_by_status" in data
    assert "counts_by_source_type" in data
    assert "batch_creation_trend" in data
    assert len(data["items"]) > 0

def test_batch_analytics_date_and_status_filters():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-AN-FILTER", 50.0, headers, source_type="HARVEST")

    res = client.get("/api/v1/admin/analytics/batches?status=CREATED&source_type=HARVEST", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["total_matching_batches"] >= 1
    assert "CREATED" in data["counts_by_status"]

def test_supply_chain_analytics():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-AN-SC", 120.0, headers)

    # Add event
    client.post("/api/v1/batches/BATCH-AN-SC/events", json={
        "event_type": "HARVEST",
        "quantity_kg": 120.0,
        "location": "Nashik Apiary"
    }, headers=headers)

    res = client.get("/api/v1/admin/analytics/supply-chain", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["total_supply_chain_events"] >= 1
    assert "events_by_type" in data
    assert "HARVEST" in data["events_by_type"]
    assert "reconciliation_counts" in data
    assert "quantity_flow_stats" in data
    assert data["quantity_flow_stats"]["total_harvest_kg"] >= 120.0

def test_anomaly_analytics_summary():
    headers = get_auth_headers(client, role="ADMIN")
    res = client.get("/api/v1/admin/analytics/anomalies", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert "total_anomaly_records" in data
    assert "flagged_batches_count" in data
    assert "normal_batches_count" in data
    assert "anomaly_count_by_type" in data
    assert "detection_mechanism_breakdown" in data
    assert "recent_anomalies" in data

def test_anomaly_analytics_filters():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-AN-ANOM", 80.0, headers)

    # Reconcile discrepancy to trigger anomaly
    client.post("/api/v1/batches/BATCH-AN-ANOM/reconcile", json={
        "input_quantity_kg": 80.0,
        "output_quantity_kg": 95.0, # Output > Input -> Anomaly
        "notes": "Quantity discrepancy"
    }, headers=headers)

    res = client.get("/api/v1/admin/analytics/anomalies?flagged_only=true", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["total_anomaly_records"] >= 1
    assert any(a["batch_id"] == "BATCH-AN-ANOM" for a in data["recent_anomalies"])

def test_prediction_analytics_metadata():
    headers = get_auth_headers(client, role="ADMIN")
    res = client.get("/api/v1/admin/analytics/predictions", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["predictions_persisted"] is False
    assert data["total_prediction_records"] == 0
    assert "inference_capability" in data
    assert data["inference_capability"]["yield_prediction_available"] is True
    assert data["inference_capability"]["daily_production_prediction_available"] is True
    assert len(data["model_metadata"]) == 3

def test_blockchain_analytics():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-AN-BC", 90.0, headers)
    client.post("/api/v1/batches/BATCH-AN-BC/blockchain/anchor", headers=headers)

    res = client.get("/api/v1/admin/analytics/blockchain", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["total_anchors"] >= 1
    assert "anchors_by_provider" in data
    assert "anchors_by_status" in data
    assert len(data["recent_anchors"]) >= 1

def test_user_analytics():
    headers = get_auth_headers(client, role="ADMIN")
    res = client.get("/api/v1/admin/analytics/users", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["total_users"] >= 1
    assert data["active_users"] >= 1
    assert "count_by_role" in data
    assert len(data["recently_created_users"]) >= 1
    # Verify password hash is NOT returned
    for user in data["recently_created_users"]:
        assert "password_hash" not in user
        assert "password" not in user

def test_audit_logs_pagination():
    headers = get_auth_headers(client, role="ADMIN")
    res = client.get("/api/v1/admin/audit-logs?page=1&page_size=5", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["page"] == 1
    assert data["page_size"] == 5
    assert "total" in data
    assert "total_pages" in data
    assert isinstance(data["items"], list)

def test_audit_logs_filtering():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-AN-AUDIT", 110.0, headers)

    res = client.get("/api/v1/admin/audit-logs?action=CREATE_BATCH", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["total"] >= 1
    for log in data["items"]:
        assert log["action"] == "CREATE_BATCH"

def test_system_monitoring_endpoint():
    headers = get_auth_headers(client, role="ADMIN")
    res = client.get("/api/v1/admin/monitoring", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["application_status"] in ["HEALTHY", "DEGRADED"]
    assert data["database"]["status"] in ["HEALTHY", "DEGRADED"]
    assert data["ml_models"]["status"] in ["HEALTHY", "DEGRADED"]
    assert data["blockchain"]["status"] in ["HEALTHY", "DISABLED"]
    assert data["qr_capability"]["status"] == "HEALTHY"
    assert data["voice_stt"]["status"] in ["HEALTHY", "DEGRADED"]

def test_no_secrets_exposed_in_analytics_or_user_endpoints():
    headers = get_auth_headers(client, role="ADMIN")
    endpoints = [
        "/api/v1/admin/analytics/overview",
        "/api/v1/admin/analytics/users",
        "/api/v1/admin/analytics/blockchain",
        "/api/v1/admin/monitoring",
        "/api/v1/admin/audit-logs"
    ]

    for ep in endpoints:
        res = client.get(ep, headers=headers)
        assert res.status_code == 200
        text_lower = res.text.lower()
        assert "password_hash" not in text_lower
        assert "private_key" not in text_lower
        assert "jwt_secret" not in text_lower

def test_invalid_date_range_returns_400():
    headers = get_auth_headers(client, role="ADMIN")
    # start_date after end_date -> 400 Bad Request
    res = client.get("/api/v1/admin/analytics/batches?start_date=2026-12-31&end_date=2026-01-01", headers=headers)
    assert res.status_code == 400
    assert "cannot be after" in res.json()["detail"].lower()

def test_invalid_pagination_params_returns_400_or_422():
    headers = get_auth_headers(client, role="ADMIN")
    # page=0 -> 422 Unprocessable Entity or 400
    res1 = client.get("/api/v1/admin/analytics/batches?page=0", headers=headers)
    assert res1.status_code in [400, 422]

    # page_size=200 (>100 limit) -> 422 or 400
    res2 = client.get("/api/v1/admin/analytics/batches?page_size=200", headers=headers)
    assert res2.status_code in [400, 422]

def test_empty_database_analytics_behavior():
    headers = get_auth_headers(client, role="ADMIN")
    res = client.get("/api/v1/admin/analytics/batches?status=NONEXISTENT_STATUS", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["total_matching_batches"] == 0
    assert data["total_quantity_kg"] == 0.0
    assert len(data["items"]) == 0

def test_public_health_endpoints_remain_functional():
    res1 = client.get("/health")
    assert res1.status_code == 200
    assert res1.json()["status"] == "ok"

    res2 = client.get("/api/v1/health")
    assert res2.status_code == 200
    assert res2.json()["status"] == "ok"
