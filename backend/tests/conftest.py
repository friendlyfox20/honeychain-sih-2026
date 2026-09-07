import pytest
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
