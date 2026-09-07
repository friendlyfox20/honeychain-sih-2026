import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from tests.auth_helpers import get_auth_headers

client = TestClient(app)

def test_reconciliation_pass():
    headers = get_auth_headers(client, role="PROCESSOR")
    batch_id = "BATCH-2026-REC01"
    client.post("/api/v1/batches", json={
        "batch_id": batch_id,
        "source_type": "HIVE",
        "quantity_kg": 50.0
    }, headers=headers)

    response = client.post(f"/api/v1/batches/{batch_id}/reconcile", json={
        "input_quantity_kg": 50.0,
        "output_quantity_kg": 47.0
    }, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["batch_id"] == batch_id
    assert data["input_quantity_kg"] == 50.0
    assert data["output_quantity_kg"] == 47.0
    assert data["loss_quantity_kg"] == 3.0
    assert data["status"] == "PASS"

def test_reconciliation_anomaly_when_output_exceeds_input():
    headers = get_auth_headers(client, role="PROCESSOR")
    batch_id = "BATCH-2026-REC02"
    client.post("/api/v1/batches", json={
        "batch_id": batch_id,
        "source_type": "HIVE",
        "quantity_kg": 50.0
    }, headers=headers)

    response = client.post(f"/api/v1/batches/{batch_id}/reconcile", json={
        "input_quantity_kg": 50.0,
        "output_quantity_kg": 60.0
    }, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["batch_id"] == batch_id
    assert data["input_quantity_kg"] == 50.0
    assert data["output_quantity_kg"] == 60.0
    assert data["loss_quantity_kg"] == -10.0
    assert data["status"] == "ANOMALY"

    batch_info = client.get(f"/api/v1/batches/{batch_id}", headers=headers).json()
    assert batch_info["status"] == "FLAGGED"

def test_reconciliation_nonexistent_batch():
    headers = get_auth_headers(client, role="PROCESSOR")
    response = client.post("/api/v1/batches/NONEXISTENT/reconcile", json={
        "input_quantity_kg": 50.0,
        "output_quantity_kg": 45.0
    }, headers=headers)
    assert response.status_code == 404
