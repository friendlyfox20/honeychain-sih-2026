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
    # Cross-platform URI formatting (Windows requires forward slashes in SQLite URIs)
    clean_db_path = db_path.replace("\\", "/")
    db_url = f"sqlite:///{clean_db_path}"
    logger.info(f"DATABASE_URL not set. Using absolute SQLite development database: {db_url}")

connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

try:
    engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)
except Exception as e:
    logger.error(f"Failed to initialize engine for {db_url}: {e}. Falling back to SQLite in-memory.")
    db_url = "sqlite:///:memory:"
    engine = create_engine(db_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_default_users_if_empty():
    """
    Ensures that if the users table is empty, the 5 standard demo users are seeded
    so that authentication works seamlessly out-of-the-box on every platform.
    """
    try:
        from app.models.user import User
        from app.core.security import hash_password
        db = SessionLocal()
        count = db.query(User).count()
        if count == 0:
            demo_users = [
                {"email": "beekeeper@honeychain.com", "name": "Rajesh Beekeeper", "role": "BEEKEEPER"},
                {"email": "collector@honeychain.com", "name": "Amit Collector", "role": "COLLECTOR"},
                {"email": "processor@honeychain.com", "name": "Priya Processor", "role": "PROCESSOR"},
                {"email": "lab@honeychain.com", "name": "Dr. Sunita Lab Analyst", "role": "LAB"},
                {"email": "admin@honeychain.com", "name": "HoneyChain Administrator", "role": "ADMIN"},
            ]
            password_hash = hash_password("password123")
            for u in demo_users:
                user = User(
                    email=u["email"],
                    name=u["name"],
                    role=u["role"],
                    password_hash=password_hash,
                    is_active=True
                )
                db.add(user)
            db.commit()
            logger.info("Automatically seeded 5 default demo accounts into database.")
        db.close()
    except Exception as e:
        logger.warning(f"Default user auto-seeding check skipped: {e}")

def init_db():
    try:
        # Import all models so metadata registration occurs before create_all
        import app.models  # noqa
        Base.metadata.create_all(bind=engine)
        seed_default_users_if_empty()
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
