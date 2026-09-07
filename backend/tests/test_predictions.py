import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

client = TestClient(app)

def test_honey_yield_prediction_valid():
    payload = {
        "environmental_temperature": 22.5,
        "relative_humidity": 75.0,
        "hive_temperature": 33.5,
        "hive_humidity": 58.0,
        "wind_speed": 4.5,
        "date": "2024-11-15"
    }
    response = client.post("/api/v1/predictions/yield", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction_type"] == "honey_yield"
    assert data["model"] == "best_honey_yield_model"
    assert isinstance(data["predicted_yield_kg"], float)
    assert data["predicted_yield_kg"] > 0

def test_daily_production_prediction_valid():
    payload = {
        "environmental_temperature": 22.5,
        "relative_humidity": 75.0,
        "hive_temperature": 33.5,
        "hive_humidity": 58.0,
        "wind_speed": 4.5,
        "date": "2024-11-15"
    }
    response = client.post("/api/v1/predictions/daily-production", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction_type"] == "daily_honey_production"
    assert data["model"] == "daily_production_best_model"
    assert isinstance(data["predicted_production_kg"], float)

def test_yield_prediction_invalid_payload():
    payload = {
        "environmental_temperature": "invalid_number",
        "relative_humidity": 75.0,
        "hive_temperature": 33.5,
        "hive_humidity": 58.0,
        "wind_speed": 4.5,
        "date": "2024-11-15"
    }
    response = client.post("/api/v1/predictions/yield", json=payload)
    assert response.status_code == 422
