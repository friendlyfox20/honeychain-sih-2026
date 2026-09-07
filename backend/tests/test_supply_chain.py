import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from tests.auth_helpers import get_auth_headers

client = TestClient(app)

def test_add_events_and_trace_batch():
    bk_headers = get_auth_headers(client, role="BEEKEEPER")
    proc_headers = get_auth_headers(client, role="PROCESSOR")

    batch_id = "BATCH-2026-TRACE01"
    client.post("/api/v1/batches", json={
        "batch_id": batch_id,
        "source_type": "HIVE",
        "quantity_kg": 50.0
    }, headers=bk_headers)

    # Add Harvest event (BEEKEEPER)
    harvest_resp = client.post(f"/api/v1/batches/{batch_id}/events", json={
        "event_type": "HARVEST",
        "location": "Nashik Apiary A",
        "quantity_kg": 50.0,
        "notes": "Honey harvested from hive A"
    }, headers=bk_headers)
    assert harvest_resp.status_code == 201
    assert harvest_resp.json()["event_type"] == "HARVEST"

    batch_info = client.get(f"/api/v1/batches/{batch_id}", headers=bk_headers).json()
    assert batch_info["status"] == "IN_COLLECTION"

    # Add Processing event (PROCESSOR)
    proc_resp = client.post(f"/api/v1/batches/{batch_id}/events", json={
        "event_type": "PROCESSING",
        "location": "Processing Plant B",
        "quantity_kg": 48.0,
        "notes": "Processed & filtered"
    }, headers=proc_headers)
    assert proc_resp.status_code == 201
    assert proc_resp.json()["event_type"] == "PROCESSING"

    batch_info = client.get(f"/api/v1/batches/{batch_id}", headers=bk_headers).json()
    assert batch_info["status"] == "IN_PROCESSING"

    # Add Packaging event (PROCESSOR)
    pack_resp = client.post(f"/api/v1/batches/{batch_id}/events", json={
        "event_type": "PACKAGING",
        "location": "Packaging Unit C",
        "quantity_kg": 45.0,
        "notes": "Bottled into 500g jars"
    }, headers=proc_headers)
    assert pack_resp.status_code == 201

    batch_info = client.get(f"/api/v1/batches/{batch_id}", headers=bk_headers).json()
    assert batch_info["status"] == "PACKAGED"

    # Get chronological trace
    trace_resp = client.get(f"/api/v1/batches/{batch_id}/trace", headers=bk_headers)
    assert trace_resp.status_code == 200
    trace_data = trace_resp.json()
    assert trace_data["batch_id"] == batch_id
    assert trace_data["current_status"] == "PACKAGED"
    assert len(trace_data["trace"]) == 3
    assert trace_data["trace"][0]["event_type"] == "HARVEST"
    assert trace_data["trace"][1]["event_type"] == "PROCESSING"
    assert trace_data["trace"][2]["event_type"] == "PACKAGING"

def test_add_event_nonexistent_batch():
    headers = get_auth_headers(client, role="BEEKEEPER")
    response = client.post("/api/v1/batches/NONEXISTENT/events", json={
        "event_type": "HARVEST",
        "quantity_kg": 10.0
    }, headers=headers)
    assert response.status_code == 404

def test_add_event_invalid_quantity():
    headers = get_auth_headers(client, role="BEEKEEPER")
    batch_id = "BATCH-2026-TRACE01"
    response = client.post(f"/api/v1/batches/{batch_id}/events", json={
        "event_type": "HARVEST",
        "quantity_kg": -5.0
    }, headers=headers)
    assert response.status_code == 422
