import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from tests.auth_helpers import get_auth_headers

client = TestClient(app)

def test_full_honeychain_end_to_end_lifecycle():
    headers_admin = get_auth_headers(client, role="ADMIN")
    headers = headers_admin

    # 3. Create Parent Batch
    batch_id = "BATCH-P9-E2E-01"
    create_res = client.post("/api/v1/batches", json={
        "batch_id": batch_id,
        "source_type": "HARVEST",
        "quantity_kg": 200.0,
        "location": "Nashik Apiary",
        "notes": "Phase 9 E2E Test Batch"
    }, headers=headers)
    assert create_res.status_code == 201

    # 4. Add Supply-Chain Events
    ev1 = client.post(f"/api/v1/batches/{batch_id}/events", json={
        "event_type": "HARVEST",
        "quantity_kg": 200.0,
        "location": "Nashik Hive #10"
    }, headers=headers)
    assert ev1.status_code == 201

    ev2 = client.post(f"/api/v1/batches/{batch_id}/events", json={
        "event_type": "PROCESSING",
        "quantity_kg": 195.0,
        "location": "Nashik Processing Facility"
    }, headers=headers)
    assert ev2.status_code == 201

    # 5. Add Lab Record
    lab_res = client.post(f"/api/v1/batches/{batch_id}/lab", json={
        "test_name": "Purity & HMF Test",
        "test_result": "Purity: 99.5%, HMF: 12 mg/kg",
        "status": "PASSED",
        "laboratory_name": "NABL Honey Lab"
    }, headers=headers)
    assert lab_res.status_code == 201

    # 6. Add Evidence Metadata
    evid_res = client.post(f"/api/v1/batches/{batch_id}/evidence", json={
        "evidence_type": "CERTIFICATE",
        "file_reference": "certificates/lab_p9_cert.pdf",
        "description": "Lab Quality Certificate PDF"
    }, headers=headers)
    assert evid_res.status_code == 201

    # 7. Mass Conservation Reconciliation
    rec_res = client.post(f"/api/v1/batches/{batch_id}/reconcile", json={
        "input_quantity_kg": 200.0,
        "output_quantity_kg": 195.0,
        "notes": "Natural moisture loss during processing"
    }, headers=headers)
    assert rec_res.status_code == 201
    assert rec_res.json()["status"] == "PASS"

    # 8. Batch Genealogy (Split into Child Batch)
    child_id = "BATCH-P9-E2E-01-CHILD"
    client.post("/api/v1/batches", json={
        "batch_id": child_id,
        "source_type": "MERGED_BATCH",
        "quantity_kg": 100.0,
        "location": "Bottling Unit"
    }, headers=headers)

    gen_res = client.post("/api/v1/batches/relationships", json={
        "parent_batch_id": batch_id,
        "child_batch_id": child_id,
        "relationship_type": "SPLIT",
        "quantity_transferred_kg": 100.0
    }, headers=headers)
    assert gen_res.status_code == 201

    # 9. 2-Layer Anomaly Check
    anom_res = client.post("/api/v1/anomaly/check", json={
        "batch_id": batch_id,
        "harvest_quantity_kg": 200.0,
        "processing_quantity_kg": 195.0,
        "bottled_quantity_kg": 190.0,
        "dispatched_quantity_kg": 190.0
    }, headers=headers)
    assert anom_res.status_code == 200

    # 10. Generate QR Code
    qr_res = client.post(f"/api/v1/batches/{batch_id}/qr", headers=headers)
    assert qr_res.status_code == 201
    qr_token = qr_res.json()["verification_url"].split("/")[-1]

    # 11. Public Consumer Verification (Unauthenticated)
    pub_res = client.get(f"/api/v1/verify/{qr_token}")
    assert pub_res.status_code == 200
    pub_data = pub_res.json()
    assert pub_data["batch"]["batch_id"] == batch_id
    assert pub_data["batch"]["status"] in ["IN_PROCESSING", "CREATED"]

    # 12. Blockchain Anchoring
    anchor_res = client.post(f"/api/v1/batches/{batch_id}/blockchain/anchor", headers=headers)
    assert anchor_res.status_code == 201
    tx_hash = anchor_res.json()["transaction_hash"]

    # 13. Blockchain Integrity Verification
    verify_res = client.post(f"/api/v1/batches/{batch_id}/blockchain/verify", headers=headers)
    assert verify_res.status_code == 200
    assert verify_res.json()["verified"] is True
    assert verify_res.json()["integrity_status"] == "VERIFIED"

    # 14. Voice Backend Query
    voice_res = client.post("/api/v1/voice/query", json={
        "text": f"What is the trace status of batch {batch_id}?"
    }, headers=headers)
    assert voice_res.status_code == 200
    assert voice_res.json()["batch_id"] == batch_id

    # 15. Admin Analytics & Monitoring
    overview_res = client.get("/api/v1/admin/analytics/overview", headers=headers)
    assert overview_res.status_code == 200

    monitoring_res = client.get("/api/v1/admin/monitoring", headers=headers)
    assert monitoring_res.status_code == 200
    assert monitoring_res.json()["database"]["status"] in ["HEALTHY", "CONNECTED"]

    # 16. Audit Log Query
    audit_res = client.get(f"/api/v1/admin/audit-logs?entity_id={batch_id}", headers=headers)
    assert audit_res.status_code == 200
    assert audit_res.json()["total"] >= 1
