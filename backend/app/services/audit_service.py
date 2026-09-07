import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)

def log_audit_event(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: str,
    actor_id: Optional[int] = None,
    details: Optional[str] = None
) -> AuditLog:
    """
    Creates and records an AuditLog entry.
    """
    try:
        log_entry = AuditLog(
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            details=details
        )
        db.add(log_entry)
        # Flush to include in transaction without committing prematurely
        db.flush()
        return log_entry
    except Exception as e:
        logger.error(f"Failed to record audit log: {e}")
        return None
