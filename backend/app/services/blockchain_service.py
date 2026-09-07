import os
import json
import hashlib
import logging
from abc import ABC, abstractmethod
from datetime import datetime, date, timezone
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.config import settings
from app.models.batch import Batch
from app.models.blockchain_anchor import BlockchainAnchor
from app.schemas.blockchain import (
    BlockchainAnchorResponse,
    BlockchainVerificationResponse,
    TransactionDetailResponse
)
from app.services.supply_chain_service import get_batch_trace
from app.services.audit_service import log_audit_event

logger = logging.getLogger(__name__)

def default_json_serializer(obj: Any) -> str:
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} is not JSON serializable")

def compute_canonical_hash(payload_data: Dict[str, Any]) -> str:
    """
    Computes a deterministic SHA-256 hex string hash from a structured payload dictionary.
    Keys are sorted deterministically and JSON is formatted compactly.
    """
    canonical_json = json.dumps(
        payload_data,
        sort_keys=True,
        separators=(',', ':'),
        default=default_json_serializer
    )
    return hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()

class BaseBlockchainProvider(ABC):
    @abstractmethod
    def anchor_hash(self, payload_hash: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def verify_hash(self, payload_hash: str, transaction_hash: str) -> bool:
        pass

    @abstractmethod
    def get_transaction(self, transaction_hash: str) -> Dict[str, Any]:
        pass

class MockBlockchainProvider(BaseBlockchainProvider):
    def anchor_hash(self, payload_hash: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        batch_id = metadata.get("batch_id", "UNKNOWN")
        raw_seed = f"MOCK_CHAIN:{payload_hash}:{batch_id}:{settings.BLOCKCHAIN_NETWORK}"
        tx_hash = "0x" + hashlib.sha256(raw_seed.encode('utf-8')).hexdigest()
        block_num = 1000000 + (int(tx_hash[2:10], 16) % 500000)

        return {
            "transaction_hash": tx_hash,
            "block_number": block_num,
            "network": settings.BLOCKCHAIN_NETWORK,
            "provider": "mock",
            "status": "ANCHORED"
        }

    def verify_hash(self, payload_hash: str, transaction_hash: str) -> bool:
        return transaction_hash.startswith("0x") and len(transaction_hash) == 66

    def get_transaction(self, transaction_hash: str) -> Dict[str, Any]:
        return {
            "transaction_hash": transaction_hash,
            "network": settings.BLOCKCHAIN_NETWORK,
            "provider": "mock",
            "block_number": 1054321,
            "status": "CONFIRMED",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

class Web3BlockchainProvider(BaseBlockchainProvider):
    def __init__(self):
        self.rpc_url = settings.BLOCKCHAIN_RPC_URL
        self.contract_address = settings.BLOCKCHAIN_CONTRACT_ADDRESS

    def anchor_hash(self, payload_hash: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        if not self.rpc_url:
            logger.warning("Web3 RPC URL not configured. Falling back to deterministic anchor mock.")
            return MockBlockchainProvider().anchor_hash(payload_hash, metadata)
        
        # Web3 EVM transaction submission placeholder
        batch_id = metadata.get("batch_id", "UNKNOWN")
        raw_seed = f"WEB3_EVM:{payload_hash}:{batch_id}:{self.contract_address}"
        tx_hash = "0x" + hashlib.sha256(raw_seed.encode('utf-8')).hexdigest()
        return {
            "transaction_hash": tx_hash,
            "block_number": 18945200,
            "network": settings.BLOCKCHAIN_NETWORK,
            "provider": "web3",
            "status": "ANCHORED"
        }

    def verify_hash(self, payload_hash: str, transaction_hash: str) -> bool:
        return True

    def get_transaction(self, transaction_hash: str) -> Dict[str, Any]:
        return {
            "transaction_hash": transaction_hash,
            "network": settings.BLOCKCHAIN_NETWORK,
            "provider": "web3",
            "block_number": 18945200,
            "status": "CONFIRMED",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

def get_blockchain_provider() -> BaseBlockchainProvider:
    provider_name = settings.BLOCKCHAIN_PROVIDER.lower() if settings.BLOCKCHAIN_PROVIDER else "mock"
    if provider_name == "web3":
        return Web3BlockchainProvider()
    return MockBlockchainProvider()

def _construct_canonical_payload(db: Session, batch_id: str, record_type: str) -> Dict[str, Any]:
    batch = db.query(Batch).filter(Batch.batch_id == batch_id).first()
    trace_data = get_batch_trace(db, batch_id)
    return {
        "batch_id": trace_data.batch_id,
        "quantity_kg": float(batch.quantity_kg) if batch and batch.quantity_kg is not None else None,
        "source_type": batch.source_type if batch else None,
        "current_status": trace_data.current_status,
        "trace": [t.model_dump(mode="json") for t in trace_data.trace],
        "lab_records": [l.model_dump(mode="json") for l in trace_data.lab_records],
        "reconciliations": [r.model_dump(mode="json") for r in trace_data.reconciliations],
        "has_anomalies": trace_data.has_anomalies
    }

def anchor_batch_integrity(
    db: Session,
    batch_id: str,
    record_type: str = "BATCH_FULL",
    actor_id: Optional[int] = None
) -> BlockchainAnchorResponse:
    if not settings.BLOCKCHAIN_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Blockchain integrity anchoring is currently disabled in system configuration."
        )

    batch = db.query(Batch).filter(Batch.batch_id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch with ID '{batch_id}' not found."
        )

    payload_dict = _construct_canonical_payload(db, batch_id, record_type)
    payload_hash = compute_canonical_hash(payload_dict)

    # Check for existing identical anchor to prevent duplicate anchoring
    existing_anchor = db.query(BlockchainAnchor).filter(
        BlockchainAnchor.batch_id == batch_id,
        BlockchainAnchor.record_type == record_type,
        BlockchainAnchor.payload_hash == payload_hash,
        BlockchainAnchor.status.in_(["ANCHORED", "VERIFIED"])
    ).first()

    if existing_anchor:
        return BlockchainAnchorResponse.model_validate(existing_anchor)

    provider = get_blockchain_provider()
    tx_meta = provider.anchor_hash(payload_hash, {"batch_id": batch_id, "record_type": record_type})

    anchor = BlockchainAnchor(
        batch_id=batch_id,
        record_type=record_type,
        payload_hash=payload_hash,
        blockchain_provider=tx_meta["provider"],
        network=tx_meta["network"],
        transaction_hash=tx_meta["transaction_hash"],
        block_number=tx_meta.get("block_number"),
        status=tx_meta.get("status", "ANCHORED"),
        created_by=actor_id
    )
    db.add(anchor)
    db.flush()

    log_audit_event(
        db=db,
        action="ANCHOR_BLOCKCHAIN_RECORD",
        entity_type="BlockchainAnchor",
        entity_id=str(anchor.id),
        actor_id=actor_id,
        details=f"Anchored batch '{batch_id}' ({record_type}) with SHA-256 hash {payload_hash[:16]}... on {tx_meta['network']} (Tx: {tx_meta['transaction_hash'][:18]}...)"
    )

    db.commit()
    db.refresh(anchor)
    return BlockchainAnchorResponse.model_validate(anchor)

def get_blockchain_anchors_for_batch(db: Session, batch_id: str) -> List[BlockchainAnchorResponse]:
    batch = db.query(Batch).filter(Batch.batch_id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch with ID '{batch_id}' not found."
        )

    anchors = db.query(BlockchainAnchor).filter(
        BlockchainAnchor.batch_id == batch_id
    ).order_by(BlockchainAnchor.anchored_at.desc()).all()

    return [BlockchainAnchorResponse.model_validate(a) for a in anchors]

def verify_batch_integrity(
    db: Session,
    batch_id: str,
    actor_id: Optional[int] = None
) -> BlockchainVerificationResponse:
    if not settings.BLOCKCHAIN_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Blockchain integrity verification is currently disabled in system configuration."
        )

    batch = db.query(Batch).filter(Batch.batch_id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch with ID '{batch_id}' not found."
        )

    anchor = db.query(BlockchainAnchor).filter(
        BlockchainAnchor.batch_id == batch_id
    ).order_by(BlockchainAnchor.anchored_at.desc()).first()

    if not anchor:
        return BlockchainVerificationResponse(
            verified=False,
            integrity_status="NOT_ANCHORED",
            batch_id=batch_id,
            current_payload_hash="",
            message=f"No blockchain anchor proof record found for batch '{batch_id}'."
        )

    # Recalculate hash from current authoritative DB state
    current_payload_dict = _construct_canonical_payload(db, batch_id, anchor.record_type)
    current_hash = compute_canonical_hash(current_payload_dict)

    if current_hash == anchor.payload_hash:
        anchor.status = "VERIFIED"

        log_audit_event(
            db=db,
            action="VERIFY_BLOCKCHAIN_RECORD",
            entity_type="BlockchainAnchor",
            entity_id=str(anchor.id),
            actor_id=actor_id,
            details=f"Successfully verified blockchain integrity proof for batch '{batch_id}' (Hash match: {current_hash[:16]}...)"
        )
        db.commit()

        return BlockchainVerificationResponse(
            verified=True,
            integrity_status="VERIFIED",
            batch_id=batch_id,
            current_payload_hash=current_hash,
            anchored_payload_hash=anchor.payload_hash,
            transaction_hash=anchor.transaction_hash,
            network=anchor.network,
            message="Integrity verified: Current database record hash matches anchored blockchain proof."
        )
    else:
        anchor.status = "TAMPERED"

        log_audit_event(
            db=db,
            action="BLOCKCHAIN_INTEGRITY_MISMATCH",
            entity_type="BlockchainAnchor",
            entity_id=str(anchor.id),
            actor_id=actor_id,
            details=f"INTEGRITY MISMATCH DETECTED for batch '{batch_id}'! Current hash {current_hash[:16]}... != Anchored hash {anchor.payload_hash[:16]}..."
        )
        db.commit()

        return BlockchainVerificationResponse(
            verified=False,
            integrity_status="TAMPERED",
            batch_id=batch_id,
            current_payload_hash=current_hash,
            anchored_payload_hash=anchor.payload_hash,
            transaction_hash=anchor.transaction_hash,
            network=anchor.network,
            message="INTEGRITY MISMATCH DETECTED: Authoritative database record has been altered after blockchain anchoring!"
        )

def get_transaction_by_hash(db: Session, transaction_hash: str) -> TransactionDetailResponse:
    if not transaction_hash or not transaction_hash.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction hash string cannot be empty."
        )

    anchor = db.query(BlockchainAnchor).filter(
        BlockchainAnchor.transaction_hash == transaction_hash
    ).first()

    if not anchor:
        # Check provider mock transaction
        provider = get_blockchain_provider()
        tx = provider.get_transaction(transaction_hash)
        return TransactionDetailResponse(
            transaction_hash=transaction_hash,
            network=tx.get("network", settings.BLOCKCHAIN_NETWORK),
            provider=tx.get("provider", "mock"),
            block_number=tx.get("block_number"),
            payload_hash="",
            status=tx.get("status", "CONFIRMED"),
            anchored_at=datetime.now(timezone.utc)
        )

    return TransactionDetailResponse(
        transaction_hash=anchor.transaction_hash,
        network=anchor.network,
        provider=anchor.blockchain_provider,
        block_number=anchor.block_number,
        payload_hash=anchor.payload_hash,
        status=anchor.status,
        anchored_at=anchor.anchored_at
    )
