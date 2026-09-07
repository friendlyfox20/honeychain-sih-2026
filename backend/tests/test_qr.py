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

def test_authenticated_user_can_generate_qr():
    headers = get_auth_headers(client, role="BEEKEEPER")
    create_sample_batch("BATCH-QR-01", 100.0, headers, "HARVEST")

    gen_res = client.post("/api/v1/batches/BATCH-QR-01/qr", headers=headers)
    assert gen_res.status_code == 201
    data = gen_res.json()

    assert data["batch_id"] == "BATCH-QR-01"
    assert "verification_url" in data
    assert "/api/v1/verify/" in data["verification_url"]
    assert data["qr_image_base64"].startswith("data:image/png;base64,")
    assert data["is_active"] is True

def test_single_active_qr_invariant_reused():
    headers = get_auth_headers(client, role="PROCESSOR")
    create_sample_batch("BATCH-QR-INVARIANT", 75.0, headers, "PROCESSING")

    # Generate first QR
    res1 = client.post("/api/v1/batches/BATCH-QR-INVARIANT/qr", headers=headers)
    assert res1.status_code == 201
    data1 = res1.json()

    # Request QR generation again -> Should return existing active QR record
    res2 = client.post("/api/v1/batches/BATCH-QR-INVARIANT/qr", headers=headers)
    assert res2.status_code == 201
    data2 = res2.json()

    assert data1["verification_url"] == data2["verification_url"]
    assert data1["created_at"] == data2["created_at"]

def test_unauthorized_role_cannot_generate_qr():
    headers = get_auth_headers(client, role="LAB")
    create_sample_batch("BATCH-QR-02", 50.0, get_auth_headers(client, role="ADMIN"))

    res = client.post("/api/v1/batches/BATCH-QR-02/qr", headers=headers)
    assert res.status_code == 403
    assert "not authorized" in res.json()["detail"].lower()

def test_missing_jwt_cannot_generate_qr():
    res = client.post("/api/v1/batches/BATCH-QR-01/qr")
    assert res.status_code == 401

def test_generate_qr_nonexistent_batch_returns_404():
    headers = get_auth_headers(client, role="ADMIN")
    res = client.post("/api/v1/batches/BATCH-NONEXISTENT/qr", headers=headers)
    assert res.status_code == 404

def test_get_batch_qr_metadata():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-QR-META", 120.0, headers)
    client.post("/api/v1/batches/BATCH-QR-META/qr", headers=headers)

    res = client.get("/api/v1/batches/BATCH-QR-META/qr", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["batch_id"] == "BATCH-QR-META"
    assert data["is_active"] is True

def test_public_verification_without_jwt_success():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-PUB-01", 100.0, headers, "HARVEST")

    # Add Supply Chain Event
    client.post("/api/v1/batches/BATCH-PUB-01/events", json={
        "event_type": "HARVEST",
        "location": "Nashik Apiary",
        "quantity_kg": 100.0,
        "notes": "Harvested raw honey"
    }, headers=headers)

    # Generate QR
    gen_res = client.post("/api/v1/batches/BATCH-PUB-01/qr", headers=headers)
    url = gen_res.json()["verification_url"]
    token = url.split("/")[-1]

    # Public scan without ANY Authorization headers
    verify_res = client.get(f"/api/v1/verify/{token}")
    assert verify_res.status_code == 200
    v_data = verify_res.json()

    assert v_data["verified"] is True
    assert v_data["verification_message"] == "Verified HoneyChain traceability record"
    assert v_data["batch"]["batch_id"] == "BATCH-PUB-01"
    assert v_data["batch"]["quantity_kg"] == 100.0
    assert len(v_data["trace"]) == 1
    assert v_data["has_anomalies"] is False

def test_public_verification_invalid_token_returns_404():
    res = client.get("/api/v1/verify/invalid_dummy_token_12345")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()

def test_qr_revocation_and_subsequent_verification():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-REVOKE-01", 90.0, headers)

    gen_res = client.post("/api/v1/batches/BATCH-REVOKE-01/qr", headers=headers)
    url = gen_res.json()["verification_url"]
    token = url.split("/")[-1]

    # Verification works initially
    v1 = client.get(f"/api/v1/verify/{token}")
    assert v1.status_code == 200

    # Revoke QR code
    rev_res = client.post("/api/v1/batches/BATCH-REVOKE-01/qr/revoke", headers=headers)
    assert rev_res.status_code == 200
    assert rev_res.json()["is_active"] is False

    # Verification now returns 404
    v2 = client.get(f"/api/v1/verify/{token}")
    assert v2.status_code == 404
    assert "revoked" in v2.json()["detail"].lower()

def test_consumer_response_content_projections():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-COMPREHENSIVE-01", 200.0, headers, "HARVEST")
    create_sample_batch("BATCH-COMPREHENSIVE-02", 150.0, headers, "PROCESSING")

    # Event
    client.post("/api/v1/batches/BATCH-COMPREHENSIVE-01/events", json={
        "event_type": "HARVEST", "location": "Nashik", "quantity_kg": 200.0
    }, headers=headers)

    # Lineage link
    client.post("/api/v1/batches/relationships", json={
        "parent_batch_id": "BATCH-COMPREHENSIVE-01",
        "child_batch_id": "BATCH-COMPREHENSIVE-02",
        "relationship_type": "SPLIT",
        "quantity_transferred_kg": 150.0
    }, headers=headers)

    # Lab record
    client.post("/api/v1/batches/BATCH-COMPREHENSIVE-01/lab", json={
        "test_name": "Purity Check", "status": "PASSED", "laboratory_name": "NABL Lab"
    }, headers=headers)

    # Evidence
    client.post("/api/v1/batches/BATCH-COMPREHENSIVE-01/evidence", json={
        "evidence_type": "CERTIFICATE", "file_reference": "storage/cert_101.pdf"
    }, headers=headers)

    # Reconciliation
    client.post("/api/v1/batches/BATCH-COMPREHENSIVE-01/reconcile", json={
        "input_quantity_kg": 200.0, "output_quantity_kg": 195.0
    }, headers=headers)

    # Generate QR & Verify
    gen_res = client.post("/api/v1/batches/BATCH-COMPREHENSIVE-01/qr", headers=headers)
    token = gen_res.json()["verification_url"].split("/")[-1]

    verify_res = client.get(f"/api/v1/verify/{token}")
    assert verify_res.status_code == 200
    v_data = verify_res.json()

    assert v_data["batch"]["batch_id"] == "BATCH-COMPREHENSIVE-01"
    assert len(v_data["trace"]) == 1
    assert v_data["genealogy"] is not None
    assert v_data["genealogy"]["total_downstream_count"] == 1
    assert len(v_data["lab_records"]) == 1
    assert len(v_data["evidence"]) == 1
    assert len(v_data["reconciliations"]) == 1
    assert v_data["has_anomalies"] is False

def test_consumer_response_sanitization_no_secrets():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-SECRET-CHECK", 80.0, headers)
    gen_res = client.post("/api/v1/batches/BATCH-SECRET-CHECK/qr", headers=headers)
    token = gen_res.json()["verification_url"].split("/")[-1]

    verify_res = client.get(f"/api/v1/verify/{token}")
    assert verify_res.status_code == 200
    data_str = verify_res.text.lower()

    assert "password" not in data_str
    assert "password_hash" not in data_str
    assert "token" not in data_str
    assert "bearer" not in data_str

def test_consumer_verification_is_read_only():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-READ-ONLY", 100.0, headers)
    gen_res = client.post("/api/v1/batches/BATCH-READ-ONLY/qr", headers=headers)
    token = gen_res.json()["verification_url"].split("/")[-1]

    # Verify multiple times
    for _ in range(3):
        res = client.get(f"/api/v1/verify/{token}")
        assert res.status_code == 200

    # Ensure batch quantity and status are completely unchanged
    b_res = client.get("/api/v1/batches/BATCH-READ-ONLY", headers=headers)
    assert b_res.status_code == 200
    assert b_res.json()["quantity_kg"] == 100.0

def test_qr_generation_audit_logging():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-AUDIT-QR", 60.0, headers)
    client.post("/api/v1/batches/BATCH-AUDIT-QR/qr", headers=headers)

    # Inspect audit log directly from DB
    from app.db.database import SessionLocal
    from app.models.audit_log import AuditLog
    db = SessionLocal()
    log_entry = db.query(AuditLog).filter(AuditLog.action == "GENERATE_QR_CODE").first()
    assert log_entry is not None
    assert "BATCH-AUDIT-QR" in log_entry.details
    assert log_entry.actor_id is not None
    db.close()
