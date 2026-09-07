from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Float, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class Batch(Base):
    __tablename__ = "batches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    batch_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    source_type: Mapped[str] = mapped_column(String(50), default="HIVE", nullable=False) # HIVE, HARVEST, COLLECTION, MERGED_BATCH
    source_reference: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    quantity_kg: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="CREATED", nullable=False) # CREATED, IN_COLLECTION, IN_PROCESSING, IN_LAB, PACKAGED, DISPATCHED, COMPLETED, FLAGGED
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    events: Mapped[List["SupplyChainEvent"]] = relationship("SupplyChainEvent", back_populates="batch", cascade="all, delete-orphan")
    lab_records: Mapped[List["LabRecord"]] = relationship("LabRecord", back_populates="batch", cascade="all, delete-orphan")
    evidences: Mapped[List["Evidence"]] = relationship("Evidence", back_populates="batch", cascade="all, delete-orphan")
    reconciliations: Mapped[List["ReconciliationRecord"]] = relationship("ReconciliationRecord", back_populates="batch", cascade="all, delete-orphan")
    
    parent_relationships: Mapped[List["BatchRelationship"]] = relationship(
        "BatchRelationship",
        foreign_keys="BatchRelationship.child_batch_id",
        back_populates="child_batch",
        cascade="all, delete-orphan"
    )
    child_relationships: Mapped[List["BatchRelationship"]] = relationship(
        "BatchRelationship",
        foreign_keys="BatchRelationship.parent_batch_id",
        back_populates="parent_batch",
        cascade="all, delete-orphan"
    )
    qr_verifications: Mapped[List["QRVerification"]] = relationship(
        "QRVerification",
        back_populates="batch",
        cascade="all, delete-orphan"
    )
    blockchain_anchors: Mapped[List["BlockchainAnchor"]] = relationship(
        "BlockchainAnchor",
        back_populates="batch",
        cascade="all, delete-orphan"
    )


