import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.services.blockchain_service import (
    compute_canonical_hash,
    MockBlockchainProvider,
    Web3BlockchainProvider
)
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

def test_blockchain_config_loading():
    assert hasattr(settings, "BLOCKCHAIN_ENABLED")
    assert hasattr(settings, "BLOCKCHAIN_PROVIDER")
    assert hasattr(settings, "BLOCKCHAIN_NETWORK")

def test_blockchain_disabled_behavior(monkeypatch):
    monkeypatch.setattr(settings, "BLOCKCHAIN_ENABLED", False)
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-BC-DISABLED", 50.0, headers)

    res = client.post("/api/v1/batches/BATCH-BC-DISABLED/blockchain/anchor", headers=headers)
    assert res.status_code == 400
    assert "disabled" in res.json()["detail"].lower()

def test_mock_provider_deterministic_tx_hash():
    provider = MockBlockchainProvider()
    res = provider.anchor_hash("a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890", {"batch_id": "BATCH-H001"})
    assert res["transaction_hash"].startswith("0x")
    assert len(res["transaction_hash"]) == 66
    assert res["provider"] == "mock"

def test_canonical_hashing_consistency():
    d1 = {"b": 2, "a": 1, "nested": {"y": "val", "x": 10}}
    d2 = {"nested": {"x": 10, "y": "val"}, "a": 1, "b": 2}

    h1 = compute_canonical_hash(d1)
    h2 = compute_canonical_hash(d2)
    assert h1 == h2
    assert len(h1) == 64  # SHA-256 hex length

def test_different_payloads_produce_different_hashes():
    d1 = {"batch_id": "BATCH-01", "quantity_kg": 50.0}
    d2 = {"batch_id": "BATCH-01", "quantity_kg": 50.1}

    assert compute_canonical_hash(d1) != compute_canonical_hash(d2)

def test_anchor_batch_success_authenticated():
    headers = get_auth_headers(client, role="BEEKEEPER")
    create_sample_batch("BATCH-BC-01", 100.0, headers)

    res = client.post("/api/v1/batches/BATCH-BC-01/blockchain/anchor", headers=headers)
    assert res.status_code == 201
    data = res.json()

    assert data["batch_id"] == "BATCH-BC-01"
    assert data["record_type"] == "BATCH_FULL"
    assert len(data["payload_hash"]) == 64
    assert data["transaction_hash"].startswith("0x")
    assert data["status"] in ["ANCHORED", "VERIFIED"]

def test_anchor_batch_duplicate_prevention():
    headers = get_auth_headers(client, role="PROCESSOR")
    create_sample_batch("BATCH-BC-DUP", 75.0, headers)

    res1 = client.post("/api/v1/batches/BATCH-BC-DUP/blockchain/anchor", headers=headers)
    assert res1.status_code == 201
    data1 = res1.json()

    # Second anchor request for identical DB state returns existing record
    res2 = client.post("/api/v1/batches/BATCH-BC-DUP/blockchain/anchor", headers=headers)
    assert res2.status_code == 201
    data2 = res2.json()

    assert data1["transaction_hash"] == data2["transaction_hash"]
    assert data1["payload_hash"] == data2["payload_hash"]

def test_anchor_nonexistent_batch_returns_404():
    headers = get_auth_headers(client, role="ADMIN")
    res = client.post("/api/v1/batches/BATCH-NONEXISTENT-BC/blockchain/anchor", headers=headers)
    assert res.status_code == 404

def test_get_batch_blockchain_anchors():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-BC-LIST", 90.0, headers)
    client.post("/api/v1/batches/BATCH-BC-LIST/blockchain/anchor", headers=headers)

    res = client.get("/api/v1/batches/BATCH-BC-LIST/blockchain", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["batch_id"] == "BATCH-BC-LIST"

def test_verify_batch_integrity_success():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-BC-VERIFY", 150.0, headers)
    client.post("/api/v1/batches/BATCH-BC-VERIFY/blockchain/anchor", headers=headers)

    res = client.post("/api/v1/batches/BATCH-BC-VERIFY/blockchain/verify", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["verified"] is True
    assert data["integrity_status"] == "VERIFIED"
    assert "matches" in data["message"].lower()

def test_verify_batch_integrity_tamper_detection():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-BC-TAMPER", 100.0, headers)

    # 1. Anchor original record
    client.post("/api/v1/batches/BATCH-BC-TAMPER/blockchain/anchor", headers=headers)

    # 2. Simulate unauthorized/direct database modification (tampering)
    from app.db.database import SessionLocal
    from app.models.batch import Batch
    db = SessionLocal()
    batch = db.query(Batch).filter(Batch.batch_id == "BATCH-BC-TAMPER").first()
    batch.quantity_kg = 999.0  # Tamper with quantity
    db.commit()
    db.close()

    # 3. Perform verification
    verify_res = client.post("/api/v1/batches/BATCH-BC-TAMPER/blockchain/verify", headers=headers)
    assert verify_res.status_code == 200
    v_data = verify_res.json()

    assert v_data["verified"] is False
    assert v_data["integrity_status"] == "TAMPERED"
    assert "mismatch" in v_data["message"].lower()
    assert v_data["current_payload_hash"] != v_data["anchored_payload_hash"]

def test_invalid_transaction_hash_handling():
    headers = get_auth_headers(client, role="ADMIN")
    res = client.get("/api/v1/blockchain/transactions/0x99999999999999999999999999999999", headers=headers)
    assert res.status_code == 200
    assert "transaction_hash" in res.json()

def test_anchor_batch_rbac_authorization():
    headers_collector = get_auth_headers(client, role="COLLECTOR")
    headers_admin = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-BC-RBAC", 80.0, headers_admin)

    # COLLECTOR is not in anchor allowed roles -> 403 Forbidden
    res_col = client.post("/api/v1/batches/BATCH-BC-RBAC/blockchain/anchor", headers=headers_collector)
    assert res_col.status_code == 403

def test_missing_jwt_returns_401():
    res = client.post("/api/v1/batches/BATCH-BC-01/blockchain/anchor")
    assert res.status_code == 401

def test_audit_log_created_for_anchoring_and_verification():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-BC-AUDIT", 70.0, headers)

    res_a = client.post("/api/v1/batches/BATCH-BC-AUDIT/blockchain/anchor", headers=headers)
    assert res_a.status_code == 201
    res_v = client.post("/api/v1/batches/BATCH-BC-AUDIT/blockchain/verify", headers=headers)
    assert res_v.status_code == 200
    v_data = res_v.json()
    assert v_data["verified"] is True, f"Verification failed: {v_data}"

    from app.db.database import SessionLocal
    from app.models.audit_log import AuditLog
    db = SessionLocal()

    logs = db.query(AuditLog).all()
    anchor_log = db.query(AuditLog).filter(
        AuditLog.action == "ANCHOR_BLOCKCHAIN_RECORD",
        AuditLog.details.like("%BATCH-BC-AUDIT%")
    ).first()
    verify_log = db.query(AuditLog).filter(
        AuditLog.action == "VERIFY_BLOCKCHAIN_RECORD",
        AuditLog.details.like("%BATCH-BC-AUDIT%")
    ).first()

    assert anchor_log is not None
    assert verify_log is not None
    db.close()

def test_qr_verification_safely_exposes_blockchain_status():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-BC-QR", 100.0, headers)
    client.post("/api/v1/batches/BATCH-BC-QR/blockchain/anchor", headers=headers)

    # Generate QR & public verify
    gen_res = client.post("/api/v1/batches/BATCH-BC-QR/qr", headers=headers)
    token = gen_res.json()["verification_url"].split("/")[-1]

    verify_res = client.get(f"/api/v1/verify/{token}")
    assert verify_res.status_code == 200
    v_data = verify_res.json()

    assert v_data["blockchain_status"] in ["ANCHORED", "VERIFIED"]
    assert v_data["blockchain_transaction_hash"].startswith("0x")

def test_no_secrets_or_private_keys_exposed():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-BC-SECRETS", 60.0, headers)
    res = client.post("/api/v1/batches/BATCH-BC-SECRETS/blockchain/anchor", headers=headers)

    text_lower = res.text.lower()
    assert "private_key" not in text_lower
    assert "jwt" not in text_lower
    assert "password_hash" not in text_lower

def test_web3_provider_config_instantiation():
    provider = Web3BlockchainProvider()
    res = provider.anchor_hash("a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890", {"batch_id": "BATCH-H001"})
    assert res["transaction_hash"].startswith("0x")
    assert res["provider"] in ["web3", "mock"]
