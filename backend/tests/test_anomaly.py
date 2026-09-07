import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

client = TestClient(app)

def test_anomaly_case_1_normal():
    payload = {
        "batch_id": "HC-BATCH-1001",
        "harvest_quantity_kg": 50.0,
        "processing_quantity_kg": 47.0,
        "bottled_quantity_kg": 45.0,
        "dispatched_quantity_kg": 44.0
    }
    response = client.post("/api/v1/anomaly/check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["batch_id"] == "HC-BATCH-1001"
    assert data["rule_check"]["processing_vs_harvest"] == "PASS"
    assert data["rule_check"]["bottled_vs_processing"] == "PASS"
    assert data["rule_check"]["dispatched_vs_bottled"] == "PASS"
    assert data["gaps"]["processing_gap_kg"] == -3.0
    assert data["gaps"]["bottling_gap_kg"] == -2.0
    assert data["gaps"]["dispatch_gap_kg"] == -1.0
    assert data["ml_prediction"] == "NORMAL"
    assert data["final_status"] == "NORMAL"

def test_anomaly_case_2_processing_anomaly():
    payload = {
        "batch_id": "HC-BATCH-1002",
        "harvest_quantity_kg": 50.0,
        "processing_quantity_kg": 62.0,
        "bottled_quantity_kg": 60.0,
        "dispatched_quantity_kg": 58.0
    }
    response = client.post("/api/v1/anomaly/check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["batch_id"] == "HC-BATCH-1002"
    assert data["rule_check"]["processing_vs_harvest"] == "FAIL"
    assert data["gaps"]["processing_gap_kg"] == 12.0
    assert data["final_status"] == "ANOMALY"

def test_anomaly_case_3_bottling_anomaly():
    payload = {
        "batch_id": "HC-BATCH-1003",
        "harvest_quantity_kg": 50.0,
        "processing_quantity_kg": 48.0,
        "bottled_quantity_kg": 55.0,
        "dispatched_quantity_kg": 52.0
    }
    response = client.post("/api/v1/anomaly/check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["batch_id"] == "HC-BATCH-1003"
    assert data["rule_check"]["bottled_vs_processing"] == "FAIL"
    assert data["gaps"]["bottling_gap_kg"] == 7.0
    assert data["final_status"] == "ANOMALY"

def test_anomaly_case_4_dispatch_anomaly():
    payload = {
        "batch_id": "HC-BATCH-1004",
        "harvest_quantity_kg": 50.0,
        "processing_quantity_kg": 48.0,
        "bottled_quantity_kg": 46.0,
        "dispatched_quantity_kg": 52.0
    }
    response = client.post("/api/v1/anomaly/check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["batch_id"] == "HC-BATCH-1004"
    assert data["rule_check"]["dispatched_vs_bottled"] == "FAIL"
    assert data["gaps"]["dispatch_gap_kg"] == 6.0
    assert data["final_status"] == "ANOMALY"

def test_anomaly_case_5_multiple_violations():
    payload = {
        "batch_id": "HC-BATCH-1005",
        "harvest_quantity_kg": 50.0,
        "processing_quantity_kg": 60.0,
        "bottled_quantity_kg": 70.0,
        "dispatched_quantity_kg": 80.0
    }
    response = client.post("/api/v1/anomaly/check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["batch_id"] == "HC-BATCH-1005"
    assert data["rule_check"]["processing_vs_harvest"] == "FAIL"
    assert data["rule_check"]["bottled_vs_processing"] == "FAIL"
    assert data["rule_check"]["dispatched_vs_bottled"] == "FAIL"
    assert data["final_status"] == "ANOMALY"

def test_deterministic_rules_override_ml_prediction():
    """
    Test that deterministic mass-conservation rules force final_status == ANOMALY even if ML returns NORMAL.
    In case 3 (Bottling anomaly), ML model predicted NORMAL, but Rule FAIL forced final_status to ANOMALY.
    """
    payload = {
        "batch_id": "HC-BATCH-OVERRIDE",
        "harvest_quantity_kg": 50.0,
        "processing_quantity_kg": 48.0,
        "bottled_quantity_kg": 55.0,
        "dispatched_quantity_kg": 52.0
    }
    response = client.post("/api/v1/anomaly/check", json=payload)
    assert response.status_code == 200
    data = response.json()
    # Confirm rule check failed
    assert data["rule_check"]["bottled_vs_processing"] == "FAIL"
    # Even if ml_prediction is NORMAL, final_status must be ANOMALY
    assert data["final_status"] == "ANOMALY"

def test_anomaly_negative_quantities_validation():
    payload = {
        "batch_id": "HC-BATCH-NEG",
        "harvest_quantity_kg": -50.0,
        "processing_quantity_kg": 48.0,
        "bottled_quantity_kg": 46.0,
        "dispatched_quantity_kg": 44.0
    }
    response = client.post("/api/v1/anomaly/check", json=payload)
    assert response.status_code == 422
