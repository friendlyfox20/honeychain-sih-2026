import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.models.base import Base

logger = logging.getLogger(__name__)

import os

db_url = settings.DATABASE_URL

if not db_url or not db_url.strip():
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    db_path = os.path.join(backend_dir, "honeychain_dev.db")
    db_url = f"sqlite:///{db_path}"
    logger.info(f"DATABASE_URL not set. Using absolute SQLite development database: {db_url}")

connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

try:
    engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)
except Exception as e:
    logger.error(f"Failed to initialize engine for {db_url}: {e}. Falling back to SQLite in-memory.")
    db_url = "sqlite:///:memory:"
    engine = create_engine(db_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    try:
        # Import all models so metadata registration occurs before create_all
        import app.models  # noqa
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        logger.warning(f"Database table initialization warning: {e}")

# Automatically initialize tables on module load
init_db()

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency to yield a database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
