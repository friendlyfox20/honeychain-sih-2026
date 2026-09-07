from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class BlockchainAnchor(Base):
    __tablename__ = "blockchain_anchors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    batch_id: Mapped[str] = mapped_column(String(100), ForeignKey("batches.batch_id"), index=True, nullable=False)
    record_type: Mapped[str] = mapped_column(String(50), default="BATCH_FULL", nullable=False)
    record_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    payload_hash: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    blockchain_provider: Mapped[str] = mapped_column(String(50), default="mock", nullable=False)
    network: Mapped[str] = mapped_column(String(50), default="local", nullable=False)
    transaction_hash: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    block_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="ANCHORED", nullable=False) # PENDING, ANCHORED, FAILED, VERIFIED, TAMPERED
    anchored_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    batch: Mapped["Batch"] = relationship("Batch", back_populates="blockchain_anchors")
