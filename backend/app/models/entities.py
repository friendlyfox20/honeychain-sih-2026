from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Float, Integer, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(30), default="consumer", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class Batch(Base):
    __tablename__ = "batches"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    batch_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    origin_apiary: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    harvest_quantity_kg: Mapped[float] = mapped_column(Float, default=0.0)
    processing_quantity_kg: Mapped[float] = mapped_column(Float, default=0.0)
    bottled_quantity_kg: Mapped[float] = mapped_column(Float, default=0.0)
    dispatched_quantity_kg: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(50), default="created")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class SupplyChainEvent(Base):
    __tablename__ = "supply_chain_events"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    batch_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    stage: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. harvest, processing, lab, packaging, distribution
    location: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    quantity_kg: Mapped[float] = mapped_column(Float, default=0.0)
    handler_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class LabRecord(Base):
    __tablename__ = "lab_records"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    batch_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    pollen_count: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    moisture_content_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    hmf_mg_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    c4_sugar_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="pending") # passed, failed, pending
    tested_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class Evidence(Base):
    __tablename__ = "evidences"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    batch_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    evidence_type: Mapped[str] = mapped_column(String(50), nullable=False) # document, image, lab_pdf
    file_uri: Mapped[str] = mapped_column(String(255), nullable=False)
    hash_checksum: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class ReconciliationRecord(Base):
    __tablename__ = "reconciliation_records"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    batch_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    rule_anomaly: Mapped[int] = mapped_column(Integer, default=0)
    ml_anomaly: Mapped[int] = mapped_column(Integer, default=0)
    final_status: Mapped[str] = mapped_column(String(30), nullable=False)
    details_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    checked_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class QRRecord(Base):
    __tablename__ = "qr_records"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    batch_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    qr_code_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    verification_url: Mapped[str] = mapped_column(String(255), nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    actor: Mapped[str] = mapped_column(String(100), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
