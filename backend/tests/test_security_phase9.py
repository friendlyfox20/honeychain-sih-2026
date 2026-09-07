import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from tests.auth_helpers import get_auth_headers

client = TestClient(app)

def test_invalid_jwt_returns_401():
    headers = {"Authorization": "Bearer invalid_token_value_xyz"}
    res = client.get("/api/v1/auth/me", headers=headers)
    assert res.status_code == 401

def test_missing_jwt_returns_401():
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401

def test_unauthorized_role_gets_403():
    headers_beekeeper = get_auth_headers(client, role="BEEKEEPER")
    # Admin endpoint requires ADMIN -> 403
    res = client.get("/api/v1/admin/analytics/overview", headers=headers_beekeeper)
    assert res.status_code == 403

def test_zero_secrets_exposed_in_api_responses():
    headers = get_auth_headers(client, role="ADMIN")
    endpoints = [
        "/api/v1/auth/me",
        "/api/v1/admin/analytics/overview",
        "/api/v1/admin/analytics/users",
        "/api/v1/admin/analytics/blockchain",
        "/api/v1/admin/monitoring"
    ]

    for ep in endpoints:
        res = client.get(ep, headers=headers)
        assert res.status_code == 200
        text_lower = res.text.lower()
        assert "password_hash" not in text_lower
        assert "private_key" not in text_lower
        assert "jwt_secret" not in text_lower
        assert "rpc_url" not in text_lower

def test_negative_quantity_rejected():
    headers = get_auth_headers(client, role="ADMIN")
    res = client.post("/api/v1/batches/", json={
        "batch_id": "BATCH-NEG-QTY",
        "source_type": "HARVEST",
        "quantity_kg": -10.0,
        "location": "Nashik"
    }, headers=headers)
    assert res.status_code in [400, 422]

def test_invalid_date_format_rejected():
    headers = get_auth_headers(client, role="ADMIN")
    res = client.get("/api/v1/admin/analytics/batches?start_date=invalid-date-string", headers=headers)
    assert res.status_code == 400
    assert "invalid iso date" in res.json()["detail"].lower()

def test_genealogy_self_parenting_prohibited():
    headers = get_auth_headers(client, role="ADMIN")
    client.post("/api/v1/batches/", json={
        "batch_id": "BATCH-SELF-P9",
        "source_type": "HARVEST",
        "quantity_kg": 50.0,
        "location": "Nashik"
    }, headers=headers)

    res = client.post("/api/v1/batches/relationships", json={
        "parent_batch_id": "BATCH-SELF-P9",
        "child_batch_id": "BATCH-SELF-P9",
        "relationship_type": "SPLIT",
        "quantity_transferred_kg": 10.0
    }, headers=headers)
    assert res.status_code == 400
    assert "self-parenting prohibited" in res.json()["detail"].lower()

def test_oversized_audio_upload_rejected():
    headers = get_auth_headers(client, role="ADMIN")
    # Generate ~11MB dummy data (> 10MB limit)
    large_bytes = b"0" * (11 * 1024 * 1024)
    file_obj = ("large_audio.wav", io.BytesIO(large_bytes), "audio/wav")

    res = client.post("/api/v1/voice/transcribe", files={"file": file_obj}, headers=headers)
    assert res.status_code == 400
    assert "exceeds maximum allowed limit" in res.json()["detail"].lower()

def test_unsupported_audio_extension_rejected():
    headers = get_auth_headers(client, role="ADMIN")
    dummy_bytes = b"dummy exe file bytes"
    file_obj = ("malicious_file.exe", io.BytesIO(dummy_bytes), "application/octet-stream")

    res = client.post("/api/v1/voice/transcribe", files={"file": file_obj}, headers=headers)
    assert res.status_code == 400
    assert "unsupported audio format" in res.json()["detail"].lower()

def test_public_qr_verification_invalid_token_returns_404():
    res = client.get("/api/v1/verify/invalid-qr-token-xyz-999")
    assert res.status_code == 404
    assert "not found or has been revoked" in res.json()["detail"].lower()

def test_public_qr_verification_never_exposes_internal_secrets():
    headers = get_auth_headers(client, role="ADMIN")
    client.post("/api/v1/batches/", json={
        "batch_id": "BATCH-QR-SEC",
        "source_type": "HARVEST",
        "quantity_kg": 50.0,
        "location": "Nashik"
    }, headers=headers)
    qr_res = client.post("/api/v1/batches/BATCH-QR-SEC/qr", headers=headers)
    token = qr_res.json()["verification_url"].split("/")[-1]

    verify_res = client.get(f"/api/v1/verify/{token}")
    assert verify_res.status_code == 200
    text_lower = verify_res.text.lower()
    assert "password_hash" not in text_lower
    assert "jwt" not in text_lower
    assert "private_key" not in text_lower

def test_internal_exception_does_not_leak_stacktrace():
    # Calling endpoint with invalid parameter format should return clean JSON detail
    headers = get_auth_headers(client, role="ADMIN")
    res = client.get("/api/v1/admin/analytics/batches?page_size=-5", headers=headers)
    assert res.status_code in [400, 422]
    assert "traceback" not in res.text.lower()
