from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Float, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class SupplyChainEvent(Base):
    __tablename__ = "supply_chain_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    batch_id: Mapped[str] = mapped_column(String(100), ForeignKey("batches.batch_id"), index=True, nullable=False)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False) # HARVEST, COLLECTION, PROCESSING, LAB_SUBMISSION, LAB_RESULT, PACKAGING, DISPATCH, TRANSFER
    location: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    actor_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    quantity_kg: Mapped[float] = mapped_column(Float, default=0.0)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    batch: Mapped["Batch"] = relationship("Batch", back_populates="events")
