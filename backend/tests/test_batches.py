import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from tests.auth_helpers import get_auth_headers

client = TestClient(app)

def test_create_batch_success():
    headers = get_auth_headers(client, role="BEEKEEPER")
    payload = {
        "batch_id": "BATCH-2026-TEST01",
        "source_type": "HIVE",
        "source_reference": "HIVE-101",
        "quantity_kg": 50.0
    }
    response = client.post("/api/v1/batches", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["batch_id"] == "BATCH-2026-TEST01"
    assert data["quantity_kg"] == 50.0
    assert data["status"] == "CREATED"

def test_duplicate_batch_id_rejected():
    headers = get_auth_headers(client, role="BEEKEEPER")
    batch_id = "BATCH-2026-DUP01"
    client.post("/api/v1/batches", json={
        "batch_id": batch_id,
        "source_type": "HIVE",
        "quantity_kg": 50.0
    }, headers=headers)

    payload = {
        "batch_id": batch_id,
        "source_type": "HIVE",
        "quantity_kg": 30.0
    }
    response = client.post("/api/v1/batches", json=payload, headers=headers)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_create_batch_invalid_quantity():
    headers = get_auth_headers(client, role="BEEKEEPER")
    payload = {
        "batch_id": "BATCH-2026-ZERO",
        "source_type": "HIVE",
        "quantity_kg": 0.0
    }
    response = client.post("/api/v1/batches", json=payload, headers=headers)
    assert response.status_code == 422

def test_get_batch_success():
    headers = get_auth_headers(client, role="BEEKEEPER")
    batch_id = "BATCH-2026-GET01"
    client.post("/api/v1/batches", json={
        "batch_id": batch_id,
        "source_type": "HIVE",
        "quantity_kg": 50.0
    }, headers=headers)

    response = client.get(f"/api/v1/batches/{batch_id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["batch_id"] == batch_id
    assert "events" in data
    assert "lab_records" in data

def test_get_batch_nonexistent_returns_404():
    headers = get_auth_headers(client, role="BEEKEEPER")
    response = client.get("/api/v1/batches/NONEXISTENT-BATCH", headers=headers)
    assert response.status_code == 404

def test_list_batches_with_pagination_and_filtering():
    headers = get_auth_headers(client, role="BEEKEEPER")
    client.post("/api/v1/batches", json={
        "batch_id": "BATCH-2026-LIST01",
        "source_type": "HIVE",
        "quantity_kg": 50.0
    }, headers=headers)
    client.post("/api/v1/batches", json={
        "batch_id": "BATCH-2026-LIST02",
        "source_type": "COLLECTION",
        "quantity_kg": 100.0
    }, headers=headers)

    response = client.get("/api/v1/batches?page=1&size=10", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2

    filter_response = client.get("/api/v1/batches?source_type=COLLECTION", headers=headers)
    assert filter_response.status_code == 200
    filter_data = filter_response.json()
    assert all(item["source_type"] == "COLLECTION" for item in filter_data["items"])
