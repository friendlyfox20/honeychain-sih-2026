import re
import logging
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.models.batch import Batch
from app.schemas.voice import VoiceQueryResponse
from app.services import (
    batch_service,
    supply_chain_service,
    genealogy_service,
    lab_service,
    evidence_service,
    reconciliation_service,
    ml_service,
    anomaly_service
)

logger = logging.getLogger(__name__)

INTENT_KEYWORDS = [
    ("BATCH_GENEALOGY", ["genealogy", "lineage", "family tree", "genealogy graph"]),
    ("BATCH_ANCESTORS", ["ancestor", "ancestors", "parent", "parents", "upstream", "where did it come from"]),
    ("BATCH_DESCENDANTS", ["descendant", "descendants", "child", "children", "downstream", "products came from"]),
    ("BATCH_ANOMALY", ["anomaly", "anomalies", "suspicious", "flagged", "violation", "adulterated"]),
    ("BATCH_LAB", ["lab", "laboratory", "test", "purity", "hmf", "c4", "moisture"]),
    ("BATCH_EVIDENCE", ["evidence", "photo", "document", "certificate", "receipt"]),
    ("BATCH_RECONCILIATION", ["reconciliation", "reconcile", "mass conservation", "loss"]),
    ("YIELD_PREDICTION", ["yield prediction", "predict yield", "honey yield"]),
    ("DAILY_PRODUCTION_PREDICTION", ["daily production", "production rate", "daily rate"]),
    ("BATCH_TRACE", ["trace", "history", "timeline", "events", "movement"]),
    ("BATCH_STATUS", ["status", "state", "where is", "verified"])
]

def extract_batch_id(text: str) -> Optional[str]:
    # Look for explicit BATCH-XXX patterns first
    match = re.search(r'\b(BATCH-[A-Za-z0-9_\-]+)\b', text, re.IGNORECASE)
    if match:
        return match.group(1).upper()

    # Look for patterns like H001, P001, F001, H-101, etc.
    match_short = re.search(r'\b([H|P|F|C|B]\d{3,}[A-Za-z0-9_\-]*)\b', text, re.IGNORECASE)
    if match_short:
        return match_short.group(1).upper()

    # Look for word after "batch" or "for" or "of"
    match_after_word = re.search(r'\b(?:batch|batch_id|id)\s+([A-Za-z0-9_\-]+)\b', text, re.IGNORECASE)
    if match_after_word:
        return match_after_word.group(1).upper()

    return None

def detect_intent(text: str) -> str:
    text_lower = text.lower()
    for intent, keywords in INTENT_KEYWORDS:
        for kw in keywords:
            if kw in text_lower:
                return intent
    return "UNKNOWN_INTENT"

from app.schemas.prediction import HoneyYieldRequest, DailyProductionRequest
from app.schemas.batch import BatchDetailResponse

def execute_voice_query(
    db: Session,
    text: str,
    current_user: User,
    provider: Optional[str] = None
) -> VoiceQueryResponse:
    if not text or not text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voice query text cannot be empty."
        )

    intent = detect_intent(text)
    batch_id = extract_batch_id(text)

    if intent == "UNKNOWN_INTENT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to determine HoneyChain intent from voice query."
        )

    # ML Predictions intents (which don't require batch_id)
    if intent == "YIELD_PREDICTION":
        req = HoneyYieldRequest(
            environmental_temperature=22.5,
            relative_humidity=75.0,
            hive_temperature=33.5,
            hive_humidity=58.0,
            wind_speed=4.5,
            date="2024-11-15"
        )
        res = ml_service.predict_honey_yield(req)
        return VoiceQueryResponse(
            transcript=text,
            intent=intent,
            batch_id=None,
            message="Honey yield prediction calculated successfully",
            data=res,
            provider=provider
        )

    if intent == "DAILY_PRODUCTION_PREDICTION":
        req = DailyProductionRequest(
            environmental_temperature=22.5,
            relative_humidity=75.0,
            hive_temperature=33.5,
            hive_humidity=58.0,
            wind_speed=4.5,
            date="2024-11-15"
        )
        res = ml_service.predict_daily_production(req)
        return VoiceQueryResponse(
            transcript=text,
            intent=intent,
            batch_id=None,
            message="Daily honey production rate prediction calculated successfully",
            data=res,
            provider=provider
        )

    # All other intents require a valid batch_id
    if not batch_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Intent '{intent}' detected, but no valid batch ID was found in voice query."
        )

    # Validate batch exists in DB
    batch = db.query(Batch).filter(Batch.batch_id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch with ID '{batch_id}' not found."
        )

    # Role permission check for intent execution
    user_role = current_user.role.upper()
    if intent == "BATCH_LAB" and user_role not in {"LAB", "ADMIN"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access forbidden: User role '{user_role}' is not authorized to access laboratory test records."
        )

    # Execute intent by delegating to existing Phase 1–5 services
    if intent == "BATCH_STATUS":
        data = BatchDetailResponse.model_validate(batch_service.get_batch_by_id(db, batch_id))
        msg = f"Batch '{batch_id}' status retrieved: {data.status}"
    elif intent == "BATCH_TRACE":
        data = supply_chain_service.get_batch_trace(db, batch_id)
        msg = f"HoneyChain event trace for batch '{batch_id}' retrieved successfully"
    elif intent == "BATCH_GENEALOGY":
        data = genealogy_service.get_genealogy_graph(db, batch_id)
        msg = f"Genealogy graph for batch '{batch_id}' retrieved successfully"
    elif intent == "BATCH_ANCESTORS":
        data = genealogy_service.get_ancestors(db, batch_id)
        msg = f"Upstream ancestors for batch '{batch_id}' retrieved successfully"
    elif intent == "BATCH_DESCENDANTS":
        data = genealogy_service.get_descendants(db, batch_id)
        msg = f"Downstream descendants for batch '{batch_id}' retrieved successfully"
    elif intent == "BATCH_LAB":
        data = lab_service.get_lab_records(db, batch_id)
        msg = f"Laboratory records for batch '{batch_id}' retrieved successfully"
    elif intent == "BATCH_EVIDENCE":
        data = evidence_service.get_evidence(db, batch_id)
        msg = f"Evidence metadata for batch '{batch_id}' retrieved successfully"
    elif intent == "BATCH_RECONCILIATION":
        trace = supply_chain_service.get_batch_trace(db, batch_id)
        data = trace.reconciliations
        msg = f"Quantity reconciliation records for batch '{batch_id}' retrieved successfully"
    elif intent == "BATCH_ANOMALY":
        trace = supply_chain_service.get_batch_trace(db, batch_id)
        data = {"batch_id": batch_id, "has_anomalies": trace.has_anomalies}
        msg = f"Anomaly assessment for batch '{batch_id}': {'Anomalies Detected' if trace.has_anomalies else 'No Anomalies Detected'}"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported intent '{intent}'"
        )

    return VoiceQueryResponse(
        transcript=text,
        intent=intent,
        batch_id=batch_id,
        message=msg,
        data=data,
        provider=provider
    )

