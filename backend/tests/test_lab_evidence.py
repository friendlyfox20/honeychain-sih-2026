import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from tests.auth_helpers import get_auth_headers

client = TestClient(app)

def test_add_and_get_lab_records():
    lab_headers = get_auth_headers(client, role="LAB")
    bk_headers = get_auth_headers(client, role="BEEKEEPER")

    batch_id = "BATCH-2026-LAB01"
    client.post("/api/v1/batches", json={
        "batch_id": batch_id,
        "source_type": "HIVE",
        "quantity_kg": 50.0
    }, headers=bk_headers)

    # Add Lab Record (LAB role)
    lab_resp = client.post(f"/api/v1/batches/{batch_id}/lab", json={
        "test_name": "Purity & Adulteration Test",
        "test_result": "C4 Sugar: 0.2%, HMF: 12 mg/kg",
        "status": "PASSED",
        "laboratory_name": "National Honey Testing Lab A",
        "notes": "Sample verified compliant with FSSAI guidelines"
    }, headers=lab_headers)
    assert lab_resp.status_code == 201
    lab_data = lab_resp.json()
    assert lab_data["test_name"] == "Purity & Adulteration Test"
    assert lab_data["status"] == "PASSED"

    # Get Lab Records
    get_resp = client.get(f"/api/v1/batches/{batch_id}/lab", headers=lab_headers)
    assert get_resp.status_code == 200
    records = get_resp.json()
    assert len(records) >= 1
    assert records[0]["laboratory_name"] == "National Honey Testing Lab A"

def test_add_and_get_evidence():
    headers = get_auth_headers(client, role="BEEKEEPER")

    batch_id = "BATCH-2026-EVID01"
    client.post("/api/v1/batches", json={
        "batch_id": batch_id,
        "source_type": "HIVE",
        "quantity_kg": 50.0
    }, headers=headers)

    # Add Evidence
    evid_resp = client.post(f"/api/v1/batches/{batch_id}/evidence", json={
        "evidence_type": "PHOTO",
        "file_reference": "uploads/2026/harvest_batch_101.jpg",
        "description": "Harvest photograph at Nashik Apiary",
        "uploaded_by": 1
    }, headers=headers)
    assert evid_resp.status_code == 201
    evid_data = evid_resp.json()
    assert evid_data["evidence_type"] == "PHOTO"
    assert evid_data["file_reference"] == "uploads/2026/harvest_batch_101.jpg"

    # Get Evidence
    get_resp = client.get(f"/api/v1/batches/{batch_id}/evidence", headers=headers)
    assert get_resp.status_code == 200
    evidences = get_resp.json()
    assert len(evidences) >= 1
    assert evidences[0]["description"] == "Harvest photograph at Nashik Apiary"
