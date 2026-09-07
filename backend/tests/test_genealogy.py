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

def test_link_parent_child_batch_success():
    headers = get_auth_headers(client, role="BEEKEEPER")
    create_sample_batch("BATCH-H001", 100.0, headers, "HARVEST")
    create_sample_batch("BATCH-P001", 50.0, headers, "PROCESSING")

    link_resp = client.post("/api/v1/batches/relationships", json={
        "parent_batch_id": "BATCH-H001",
        "child_batch_id": "BATCH-P001",
        "relationship_type": "SPLIT",
        "quantity_transferred_kg": 50.0,
        "notes": "Harvest split into processing batch"
    }, headers=headers)

    assert link_resp.status_code == 201
    data = link_resp.json()
    assert data["parent_batch_id"] == "BATCH-H001"
    assert data["child_batch_id"] == "BATCH-P001"
    assert data["relationship_type"] == "SPLIT"
    assert data["quantity_transferred_kg"] == 50.0

def test_self_parenting_prohibited():
    headers = get_auth_headers(client, role="BEEKEEPER")
    create_sample_batch("BATCH-H001", 100.0, headers, "HARVEST")

    link_resp = client.post("/api/v1/batches/relationships", json={
        "parent_batch_id": "BATCH-H001",
        "child_batch_id": "BATCH-H001",
        "relationship_type": "SPLIT",
        "quantity_transferred_kg": 50.0
    }, headers=headers)

    assert link_resp.status_code == 400
    assert "self-parenting" in link_resp.json()["detail"].lower()

def test_duplicate_relationship_link_rejected():
    headers = get_auth_headers(client, role="BEEKEEPER")
    create_sample_batch("BATCH-H001", 100.0, headers, "HARVEST")
    create_sample_batch("BATCH-P001", 50.0, headers, "PROCESSING")

    # First link succeeds
    client.post("/api/v1/batches/relationships", json={
        "parent_batch_id": "BATCH-H001",
        "child_batch_id": "BATCH-P001",
        "relationship_type": "SPLIT",
        "quantity_transferred_kg": 50.0
    }, headers=headers)

    # Second identical link fails
    link_resp2 = client.post("/api/v1/batches/relationships", json={
        "parent_batch_id": "BATCH-H001",
        "child_batch_id": "BATCH-P001",
        "relationship_type": "SPLIT",
        "quantity_transferred_kg": 10.0
    }, headers=headers)

    assert link_resp2.status_code == 400
    assert "already exists" in link_resp2.json()["detail"].lower()

def test_quantity_conservation_exceeded_rejected():
    headers = get_auth_headers(client, role="BEEKEEPER")
    create_sample_batch("BATCH-H001", 100.0, headers, "HARVEST")
    create_sample_batch("BATCH-P001", 60.0, headers, "PROCESSING")
    create_sample_batch("BATCH-P002", 50.0, headers, "PROCESSING")

    # Link 1: 60kg out of 100kg
    res1 = client.post("/api/v1/batches/relationships", json={
        "parent_batch_id": "BATCH-H001",
        "child_batch_id": "BATCH-P001",
        "relationship_type": "SPLIT",
        "quantity_transferred_kg": 60.0
    }, headers=headers)
    assert res1.status_code == 201

    # Link 2: Attempt to transfer 50kg (60 + 50 = 110kg > 100kg parent)
    res2 = client.post("/api/v1/batches/relationships", json={
        "parent_batch_id": "BATCH-H001",
        "child_batch_id": "BATCH-P002",
        "relationship_type": "SPLIT",
        "quantity_transferred_kg": 50.0
    }, headers=headers)

    assert res2.status_code == 400
    assert "exceeds parent batch available quantity" in res2.json()["detail"].lower()

def test_invalid_relationship_type_rejected():
    headers = get_auth_headers(client, role="BEEKEEPER")
    create_sample_batch("BATCH-H001", 100.0, headers, "HARVEST")
    create_sample_batch("BATCH-P001", 50.0, headers, "PROCESSING")

    res = client.post("/api/v1/batches/relationships", json={
        "parent_batch_id": "BATCH-H001",
        "child_batch_id": "BATCH-P001",
        "relationship_type": "INVALID_REL_TYPE",
        "quantity_transferred_kg": 20.0
    }, headers=headers)

    assert res.status_code == 400
    assert "invalid relationship_type" in res.json()["detail"].lower()

def test_nonexistent_parent_or_child_returns_404():
    headers = get_auth_headers(client, role="BEEKEEPER")
    create_sample_batch("BATCH-H001", 100.0, headers, "HARVEST")

    # Missing child
    res1 = client.post("/api/v1/batches/relationships", json={
        "parent_batch_id": "BATCH-H001",
        "child_batch_id": "BATCH-NONEXISTENT",
        "relationship_type": "SPLIT",
        "quantity_transferred_kg": 20.0
    }, headers=headers)
    assert res1.status_code == 404

    # Missing parent
    res2 = client.post("/api/v1/batches/relationships", json={
        "parent_batch_id": "BATCH-NONEXISTENT",
        "child_batch_id": "BATCH-H001",
        "relationship_type": "SPLIT",
        "quantity_transferred_kg": 20.0
    }, headers=headers)
    assert res2.status_code == 404

def test_genealogy_graph_split_and_merge():
    headers = get_auth_headers(client, role="ADMIN")

    # Lineage setup:
    # BATCH-H001 (100kg harvest) -> BATCH-P001 (50kg processing) & BATCH-P002 (40kg processing) [SPLIT]
    # BATCH-P001 & BATCH-P002 -> BATCH-F001 (85kg final packaging) [MERGE]
    create_sample_batch("BATCH-H001", 100.0, headers, "HARVEST")
    create_sample_batch("BATCH-P001", 50.0, headers, "PROCESSING")
    create_sample_batch("BATCH-P002", 40.0, headers, "PROCESSING")
    create_sample_batch("BATCH-F001", 85.0, headers, "PACKAGED")

    # Links
    client.post("/api/v1/batches/relationships", json={
        "parent_batch_id": "BATCH-H001", "child_batch_id": "BATCH-P001",
        "relationship_type": "SPLIT", "quantity_transferred_kg": 50.0
    }, headers=headers)

    client.post("/api/v1/batches/relationships", json={
        "parent_batch_id": "BATCH-H001", "child_batch_id": "BATCH-P002",
        "relationship_type": "SPLIT", "quantity_transferred_kg": 40.0
    }, headers=headers)

    client.post("/api/v1/batches/relationships", json={
        "parent_batch_id": "BATCH-P001", "child_batch_id": "BATCH-F001",
        "relationship_type": "MERGE", "quantity_transferred_kg": 48.0
    }, headers=headers)

    client.post("/api/v1/batches/relationships", json={
        "parent_batch_id": "BATCH-P002", "child_batch_id": "BATCH-F001",
        "relationship_type": "MERGE", "quantity_transferred_kg": 37.0
    }, headers=headers)

    # Query genealogy graph for merged child BATCH-F001
    res = client.get("/api/v1/batches/BATCH-F001/genealogy", headers=headers)
    assert res.status_code == 200
    graph = res.json()

    assert graph["batch_id"] == "BATCH-F001"
    assert graph["total_upstream_count"] == 3  # H001, P001, P002
    assert graph["total_downstream_count"] == 0
    assert len(graph["links"]) == 4

    ancestor_ids = {a["batch_id"] for a in graph["ancestors"]}
    assert ancestor_ids == {"BATCH-H001", "BATCH-P001", "BATCH-P002"}

def test_get_ancestors_and_descendants_endpoints():
    headers = get_auth_headers(client, role="ADMIN")

    create_sample_batch("BATCH-H002", 100.0, headers, "HARVEST")
    create_sample_batch("BATCH-P003", 50.0, headers, "PROCESSING")
    create_sample_batch("BATCH-F002", 45.0, headers, "PACKAGED")

    client.post("/api/v1/batches/relationships", json={
        "parent_batch_id": "BATCH-H002", "child_batch_id": "BATCH-P003",
        "relationship_type": "SPLIT", "quantity_transferred_kg": 50.0
    }, headers=headers)

    client.post("/api/v1/batches/relationships", json={
        "parent_batch_id": "BATCH-P003", "child_batch_id": "BATCH-F002",
        "relationship_type": "TRANSFER", "quantity_transferred_kg": 45.0
    }, headers=headers)

    # Ancestors of BATCH-F002
    anc_res = client.get("/api/v1/batches/BATCH-F002/ancestors", headers=headers)
    assert anc_res.status_code == 200
    anc_ids = [a["batch_id"] for a in anc_res.json()]
    assert set(anc_ids) == {"BATCH-H002", "BATCH-P003"}

    # Descendants of BATCH-H002
    desc_res = client.get("/api/v1/batches/BATCH-H002/descendants", headers=headers)
    assert desc_res.status_code == 200
    desc_ids = [d["batch_id"] for d in desc_res.json()]
    assert set(desc_ids) == {"BATCH-P003", "BATCH-F002"}

def test_enhanced_batch_trace_with_genealogy_lab_evidence_reconciliation():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-FULL-01", 100.0, headers, "HARVEST")
    create_sample_batch("BATCH-FULL-02", 80.0, headers, "PROCESSING")

    # Add Supply Chain Event
    evt_res = client.post("/api/v1/batches/BATCH-FULL-01/events", json={
        "event_type": "HARVEST",
        "location": "Nashik",
        "quantity_kg": 100.0,
        "notes": "Harvested honey"
    }, headers=headers)
    assert evt_res.status_code == 201

    # Relationship link
    rel_res = client.post("/api/v1/batches/relationships", json={
        "parent_batch_id": "BATCH-FULL-01",
        "child_batch_id": "BATCH-FULL-02",
        "relationship_type": "SPLIT",
        "quantity_transferred_kg": 80.0
    }, headers=headers)
    assert rel_res.status_code == 201

    # Lab Record
    lab_res = client.post("/api/v1/batches/BATCH-FULL-01/lab", json={
        "test_name": "Moisture Content Test",
        "test_result": "17.5%",
        "status": "PASSED",
        "laboratory_name": "AgriLab Nashik"
    }, headers=headers)
    assert lab_res.status_code == 201

    # Evidence
    ev_res = client.post("/api/v1/batches/BATCH-FULL-01/evidence", json={
        "evidence_type": "PHOTO",
        "file_reference": "storage/harvest_photo.jpg",
        "description": "Photo of harvested honey frames"
    }, headers=headers)
    assert ev_res.status_code == 201

    # Reconciliation
    rec_res = client.post("/api/v1/batches/BATCH-FULL-01/reconcile", json={
        "input_quantity_kg": 100.0,
        "output_quantity_kg": 98.0
    }, headers=headers)
    assert rec_res.status_code == 201

    # Query Trace API
    trace_res = client.get("/api/v1/batches/BATCH-FULL-01/trace", headers=headers)
    assert trace_res.status_code == 200
    trace_data = trace_res.json()

    assert trace_data["batch_id"] == "BATCH-FULL-01"
    assert len(trace_data["trace"]) == 1
    assert trace_data["genealogy"] is not None
    assert trace_data["genealogy"]["total_downstream_count"] == 1
    assert len(trace_data["lab_records"]) == 1
    assert len(trace_data["evidence"]) == 1
    assert len(trace_data["reconciliations"]) == 1
    assert trace_data["has_anomalies"] is False

def test_enhanced_batch_trace_detects_anomalies():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-ANOMALY-01", 100.0, headers, "HARVEST")

    # Add failing lab record
    lab_res = client.post("/api/v1/batches/BATCH-ANOMALY-01/lab", json={
        "test_name": "Adulteration Test",
        "test_result": "High C4 Sugar detected",
        "status": "FAILED",
        "laboratory_name": "Central Food Lab"
    }, headers=headers)
    assert lab_res.status_code == 201

    trace_res = client.get("/api/v1/batches/BATCH-ANOMALY-01/trace", headers=headers)
    assert trace_res.status_code == 200
    assert trace_res.json()["has_anomalies"] is True

