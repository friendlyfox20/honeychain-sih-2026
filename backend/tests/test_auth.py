import sys
import os
from datetime import timedelta
import jwt
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.config import settings
from app.db.database import SessionLocal
from app.models.user import User
from app.models.audit_log import AuditLog
from tests.auth_helpers import get_auth_headers

client = TestClient(app)

def test_1_register_beekeeper_success():
    payload = {
        "name": "BEEKEEPER One",
        "email": "Beekeeper.One@Example.Com",
        "password": "password123",
        "role": "BEEKEEPER"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "BEEKEEPER One"
    assert data["email"] == "beekeeper.one@example.com"
    assert data["role"] == "BEEKEEPER"
    assert data["is_active"] is True
    assert "password" not in data
    assert "password_hash" not in data

def test_2_duplicate_email_rejected():
    client.post("/api/v1/auth/register", json={
        "name": "BEEKEEPER One",
        "email": "dup@example.com",
        "password": "password123",
        "role": "BEEKEEPER"
    })
    payload = {
        "name": "BEEKEEPER Dup",
        "email": "dup@example.com",
        "password": "password123",
        "role": "BEEKEEPER"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]

def test_3_password_is_hashed_and_not_plaintext():
    email = "hash_check@example.com"
    client.post("/api/v1/auth/register", json={
        "name": "Hash Check",
        "email": email,
        "password": "password123",
        "role": "BEEKEEPER"
    })
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    assert user is not None
    assert user.password_hash != "password123"
    assert user.password_hash.startswith("$2b$") or user.password_hash.startswith("$2a$")
    db.close()

def test_4_login_succeeds():
    email = "login_succ@example.com"
    client.post("/api/v1/auth/register", json={
        "name": "Login Test",
        "email": email,
        "password": "password123",
        "role": "BEEKEEPER"
    })
    payload = {
        "email": email,
        "password": "password123"
    }
    response = client.post("/api/v1/auth/login/json", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_5_incorrect_password_rejected():
    email = "wrong_pwd@example.com"
    client.post("/api/v1/auth/register", json={
        "name": "Wrong Pwd",
        "email": email,
        "password": "password123",
        "role": "BEEKEEPER"
    })
    payload = {
        "email": email,
        "password": "wrongpassword"
    }
    response = client.post("/api/v1/auth/login/json", json=payload)
    assert response.status_code == 401
    assert "Invalid email" in response.json()["detail"]

def test_6_jwt_returned_and_valid():
    email = "jwt_check@example.com"
    client.post("/api/v1/auth/register", json={
        "name": "JWT Test",
        "email": email,
        "password": "password123",
        "role": "BEEKEEPER"
    })
    response = client.post("/api/v1/auth/login/json", json={
        "email": email,
        "password": "password123"
    })
    token = response.json()["access_token"]
    payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    assert "sub" in payload
    assert payload["role"] == "BEEKEEPER"

def test_7_get_me_with_valid_token():
    headers = get_auth_headers(client, role="BEEKEEPER", email="me_test@example.com")
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me_test@example.com"
    assert data["role"] == "BEEKEEPER"

def test_8_get_me_rejects_missing_token():
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401

def test_9_get_me_rejects_invalid_token():
    headers = {"Authorization": "Bearer invalid_malformed_token"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 401

def test_10_expired_token_rejected():
    from app.core.security import create_access_token
    expired_token = create_access_token(data={"sub": "1", "role": "BEEKEEPER"}, expires_delta=timedelta(seconds=-10))
    headers = {"Authorization": f"Bearer {expired_token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 401

def test_11_inactive_user_rejected():
    email = "inactive@example.com"
    get_auth_headers(client, role="BEEKEEPER", email=email)
    
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    user.is_active = False
    db.commit()
    db.close()

    response = client.post("/api/v1/auth/login/json", json={
        "email": email,
        "password": "password123"
    })
    assert response.status_code == 401
    assert "inactive" in response.json()["detail"]

def test_12_unauthorized_role_gets_403():
    bk_headers = get_auth_headers(client, role="BEEKEEPER")
    batch_id = "BATCH-2026-RBAC01"
    client.post("/api/v1/batches", json={
        "batch_id": batch_id,
        "source_type": "HIVE",
        "quantity_kg": 50.0
    }, headers=bk_headers)

    response = client.post(f"/api/v1/batches/{batch_id}/lab", json={
        "test_name": "Purity Test",
        "status": "PASSED"
    }, headers=bk_headers)
    assert response.status_code == 403

def test_13_authorized_role_succeeds():
    bk_headers = get_auth_headers(client, role="BEEKEEPER")
    lab_headers = get_auth_headers(client, role="LAB")
    batch_id = "BATCH-2026-RBAC02"
    client.post("/api/v1/batches", json={
        "batch_id": batch_id,
        "source_type": "HIVE",
        "quantity_kg": 50.0
    }, headers=bk_headers)

    response = client.post(f"/api/v1/batches/{batch_id}/lab", json={
        "test_name": "Purity Test",
        "status": "PASSED"
    }, headers=lab_headers)
    assert response.status_code == 201

def test_14_admin_can_access_all():
    bk_headers = get_auth_headers(client, role="BEEKEEPER")
    admin_headers = get_auth_headers(client, role="ADMIN")
    batch_id = "BATCH-2026-RBAC03"
    client.post("/api/v1/batches", json={
        "batch_id": batch_id,
        "source_type": "HIVE",
        "quantity_kg": 50.0
    }, headers=bk_headers)

    response = client.post(f"/api/v1/batches/{batch_id}/lab", json={
        "test_name": "Admin Override Test",
        "status": "PASSED"
    }, headers=admin_headers)
    assert response.status_code == 201

def test_15_16_beekeeper_vs_lab_permissions():
    bk_headers = get_auth_headers(client, role="BEEKEEPER")
    lab_headers = get_auth_headers(client, role="LAB")
    batch_id = "BATCH-2026-PERM01"
    client.post("/api/v1/batches", json={"batch_id": batch_id, "source_type": "HIVE", "quantity_kg": 50.0}, headers=bk_headers)

    r_bk = client.post(f"/api/v1/batches/{batch_id}/lab", json={"test_name": "T1", "status": "PASSED"}, headers=bk_headers)
    assert r_bk.status_code == 403

    r_lab = client.post(f"/api/v1/batches/{batch_id}/lab", json={"test_name": "T1", "status": "PASSED"}, headers=lab_headers)
    assert r_lab.status_code == 201

def test_17_processor_can_create_processing_events():
    proc_headers = get_auth_headers(client, role="PROCESSOR")
    bk_headers = get_auth_headers(client, role="BEEKEEPER")
    batch_id = "BATCH-2026-PROC01"
    client.post("/api/v1/batches", json={"batch_id": batch_id, "source_type": "HIVE", "quantity_kg": 50.0}, headers=bk_headers)

    r_proc = client.post(f"/api/v1/batches/{batch_id}/events", json={
        "event_type": "PROCESSING",
        "location": "Plant X",
        "quantity_kg": 48.0
    }, headers=proc_headers)
    assert r_proc.status_code == 201

def test_18_collector_can_create_collection_events():
    col_headers = get_auth_headers(client, role="COLLECTOR")
    bk_headers = get_auth_headers(client, role="BEEKEEPER")
    batch_id = "BATCH-2026-COL01"
    client.post("/api/v1/batches", json={"batch_id": batch_id, "source_type": "HIVE", "quantity_kg": 50.0}, headers=bk_headers)

    r_col = client.post(f"/api/v1/batches/{batch_id}/events", json={
        "event_type": "COLLECTION",
        "location": "Center Y",
        "quantity_kg": 50.0
    }, headers=col_headers)
    assert r_col.status_code == 201

def test_19_audit_log_records_authenticated_actor():
    email = "actor_audit@example.com"
    bk_headers = get_auth_headers(client, role="BEEKEEPER", email=email)
    
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    actor_id = user.id
    db.close()

    batch_id = "BATCH-2026-AUDIT01"
    client.post("/api/v1/batches", json={"batch_id": batch_id, "source_type": "HIVE", "quantity_kg": 50.0}, headers=bk_headers)

    db = SessionLocal()
    audit_entry = db.query(AuditLog).filter(AuditLog.entity_id == batch_id, AuditLog.action == "CREATE_BATCH").first()
    assert audit_entry is not None
    assert audit_entry.actor_id == actor_id
    db.close()

def test_20_password_hash_never_returned():
    headers = get_auth_headers(client, role="BEEKEEPER")
    resp_me = client.get("/api/v1/auth/me", headers=headers)
    assert "password_hash" not in resp_me.json()
    assert "password" not in resp_me.json()
