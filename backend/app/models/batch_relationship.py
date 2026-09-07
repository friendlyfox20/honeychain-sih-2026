from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Float, Integer, DateTime, Text, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class BatchRelationship(Base):
    __tablename__ = "batch_relationships"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    parent_batch_id: Mapped[str] = mapped_column(String(100), ForeignKey("batches.batch_id"), index=True, nullable=False)
    child_batch_id: Mapped[str] = mapped_column(String(100), ForeignKey("batches.batch_id"), index=True, nullable=False)
    relationship_type: Mapped[str] = mapped_column(String(50), default="SPLIT", nullable=False) # SPLIT, MERGE, DERIVED, TRANSFER
    quantity_transferred_kg: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    parent_batch: Mapped["Batch"] = relationship("Batch", foreign_keys=[parent_batch_id], back_populates="child_relationships")
    child_batch: Mapped["Batch"] = relationship("Batch", foreign_keys=[child_batch_id], back_populates="parent_relationships")

    __table_args__ = (
        UniqueConstraint("parent_batch_id", "child_batch_id", name="uq_parent_child_relationship"),
        CheckConstraint("parent_batch_id != child_batch_id", name="ck_prevent_self_parenting"),
    )
