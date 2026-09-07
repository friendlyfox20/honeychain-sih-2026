import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from tests.auth_helpers import get_auth_headers

client = TestClient(app)

@pytest.fixture(autouse=True)
def set_mock_stt_provider(monkeypatch):
    """
    Sets STT provider to mock mode during automated pytest runs for deterministic offline execution.
    """
    monkeypatch.setattr(settings, "VOICE_STT_PROVIDER", "mock")

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

def test_voice_query_requires_authentication():
    res = client.post("/api/v1/voice/query", json={"text": "Show me the trace of batch BATCH-H001"})
    assert res.status_code == 401

def test_voice_query_batch_trace_intent():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-VOICE-01", 100.0, headers)

    res = client.post("/api/v1/voice/query", json={"text": "Show me the trace of batch BATCH-VOICE-01"}, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "BATCH_TRACE"
    assert data["batch_id"] == "BATCH-VOICE-01"
    assert "data" in data

def test_voice_query_batch_status_intent():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-VOICE-STATUS", 80.0, headers)

    res = client.post("/api/v1/voice/query", json={"text": "What is the status of batch BATCH-VOICE-STATUS"}, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "BATCH_STATUS"
    assert data["batch_id"] == "BATCH-VOICE-STATUS"
    assert data["data"]["status"] == "CREATED"

def test_voice_query_batch_genealogy_intent():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-VOICE-GEN", 120.0, headers)

    res = client.post("/api/v1/voice/query", json={"text": "Show me the genealogy of batch BATCH-VOICE-GEN"}, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "BATCH_GENEALOGY"
    assert data["batch_id"] == "BATCH-VOICE-GEN"

def test_voice_query_batch_ancestors_intent():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-VOICE-ANC", 90.0, headers)

    res = client.post("/api/v1/voice/query", json={"text": "Show me the ancestors of batch BATCH-VOICE-ANC"}, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "BATCH_ANCESTORS"
    assert data["batch_id"] == "BATCH-VOICE-ANC"

def test_voice_query_batch_descendants_intent():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-VOICE-DESC", 110.0, headers)

    res = client.post("/api/v1/voice/query", json={"text": "Show me the descendants of batch BATCH-VOICE-DESC"}, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "BATCH_DESCENDANTS"
    assert data["batch_id"] == "BATCH-VOICE-DESC"

def test_voice_query_batch_lab_intent_rbac():
    headers_admin = get_auth_headers(client, role="ADMIN")
    headers_beekeeper = get_auth_headers(client, role="BEEKEEPER")
    create_sample_batch("BATCH-VOICE-LAB", 100.0, headers_admin)

    # Beekeeper gets 403 Forbidden for lab intent
    res_bk = client.post("/api/v1/voice/query", json={"text": "Show lab result for batch BATCH-VOICE-LAB"}, headers=headers_beekeeper)
    assert res_bk.status_code == 403
    assert "not authorized" in res_bk.json()["detail"].lower()

    # Admin gets 200 OK
    res_admin = client.post("/api/v1/voice/query", json={"text": "Show lab result for batch BATCH-VOICE-LAB"}, headers=headers_admin)
    assert res_admin.status_code == 200
    assert res_admin.json()["intent"] == "BATCH_LAB"

def test_voice_query_batch_evidence_intent():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-VOICE-EV", 50.0, headers)

    res = client.post("/api/v1/voice/query", json={"text": "Show evidence for batch BATCH-VOICE-EV"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["intent"] == "BATCH_EVIDENCE"

def test_voice_query_batch_reconciliation_intent():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-VOICE-REC", 60.0, headers)

    res = client.post("/api/v1/voice/query", json={"text": "Show mass conservation reconciliation for batch BATCH-VOICE-REC"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["intent"] == "BATCH_RECONCILIATION"

def test_voice_query_batch_anomaly_intent():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-VOICE-ANOM", 70.0, headers)

    res = client.post("/api/v1/voice/query", json={"text": "Does batch BATCH-VOICE-ANOM have any anomalies?"}, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "BATCH_ANOMALY"
    assert "has_anomalies" in data["data"]

def test_voice_query_yield_prediction_intent():
    headers = get_auth_headers(client, role="ADMIN")
    res = client.post("/api/v1/voice/query", json={"text": "Predict honey yield for my apiary"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["intent"] == "YIELD_PREDICTION"

def test_voice_query_daily_production_intent():
    headers = get_auth_headers(client, role="ADMIN")
    res = client.post("/api/v1/voice/query", json={"text": "Predict daily production rate"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["intent"] == "DAILY_PRODUCTION_PREDICTION"

def test_voice_query_nonexistent_batch_returns_404():
    headers = get_auth_headers(client, role="ADMIN")
    res = client.post("/api/v1/voice/query", json={"text": "Show trace of batch BATCH-NONEXISTENT-999"}, headers=headers)
    assert res.status_code == 404

def test_voice_query_unsupported_intent_returns_400():
    headers = get_auth_headers(client, role="ADMIN")
    res = client.post("/api/v1/voice/query", json={"text": "What is the capital of France?"}, headers=headers)
    assert res.status_code == 400
    assert "unable to determine" in res.json()["detail"].lower()

def test_voice_transcribe_valid_audio():
    headers = get_auth_headers(client, role="ADMIN")
    # Simulate small valid WAV file header + silence bytes
    audio_data = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00"

    res = client.post(
        "/api/v1/voice/transcribe",
        files={"file": ("sample.wav", io.BytesIO(audio_data), "audio/wav")},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert "transcript" in data
    assert data["provider"] == "mock"

def test_voice_transcribe_unsupported_format_returns_400():
    headers = get_auth_headers(client, role="ADMIN")
    res = client.post(
        "/api/v1/voice/transcribe",
        files={"file": ("script.txt", io.BytesIO(b"Hello world"), "text/plain")},
        headers=headers
    )
    assert res.status_code == 400
    assert "unsupported audio format" in res.json()["detail"].lower()

def test_voice_transcribe_oversized_file_returns_400(monkeypatch):
    headers = get_auth_headers(client, role="ADMIN")
    monkeypatch.setattr(settings, "VOICE_MAX_FILE_SIZE_MB", 1)
    huge_data = b"0" * (2 * 1024 * 1024) # 2MB > 1MB limit

    res = client.post(
        "/api/v1/voice/transcribe",
        files={"file": ("large.wav", io.BytesIO(huge_data), "audio/wav")},
        headers=headers
    )
    assert res.status_code == 400
    assert "exceeds maximum allowed limit" in res.json()["detail"].lower()

def test_voice_ask_combined_audio_endpoint():
    headers = get_auth_headers(client, role="ADMIN")
    create_sample_batch("BATCH-H001", 100.0, headers)
    audio_data = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00"

    res = client.post(
        "/api/v1/voice/ask",
        files={"file": ("recording.wav", io.BytesIO(audio_data), "audio/wav")},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "BATCH_TRACE"
    assert data["batch_id"] == "BATCH-H001"
    assert data["provider"] == "mock"
