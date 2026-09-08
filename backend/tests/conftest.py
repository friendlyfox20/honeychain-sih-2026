import os
import pytest

# Ensure tests use an isolated test SQLite database, preserving honeychain_dev.db
os.environ["DATABASE_URL"] = "sqlite:///honeychain_test.db"

from app.db.database import engine
from app.models.base import Base

@pytest.fixture(autouse=True)
def reset_database():
    """
    Clears and reinstantiates all database tables before every test execution for isolation.
    """
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
