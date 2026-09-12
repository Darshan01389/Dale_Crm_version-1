import os
import sys
# Ensure backend directory is on python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
os.environ["TESTING"] = "True"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

# Determine Database URL for testing
from app.core.config import settings
DATABASE_URL = os.environ.get("TEST_DATABASE_URL") or settings.DATABASE_URL

# For Postgres, isolate tests in a dedicated schema
connect_args = {}
if "sqlite" not in DATABASE_URL:
    connect_args["options"] = "-c search_path=test_schema"

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    poolclass=NullPool,
)

# Run schema migrations and create the schema before importing main
if "sqlite" not in DATABASE_URL:
    base_engine = create_engine(DATABASE_URL, poolclass=NullPool)
    with base_engine.connect() as conn:
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS test_schema"))
        conn.commit()
    base_engine.dispose()

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Patch core database with test engine BEFORE uvicorn/main loads
import app.core.database
app.core.database.engine = engine
app.core.database.SessionLocal = TestingSessionLocal

from main import app
from app.core.database import Base, get_db

@pytest.fixture(scope="session", autouse=True)
def cleanup_test_schema():
    # Drop and recreate test_schema before starting to clean any stale tables from aborted runs
    if "sqlite" not in DATABASE_URL:
        base_engine = create_engine(DATABASE_URL, poolclass=NullPool)
        with base_engine.connect() as conn:
            conn.execute(text("DROP SCHEMA IF EXISTS test_schema CASCADE"))
            conn.execute(text("CREATE SCHEMA test_schema"))
            conn.commit()
        base_engine.dispose()
    yield
    # Tear down test_schema completely after all tests finish
    if "sqlite" not in DATABASE_URL:
        base_engine = create_engine(DATABASE_URL, poolclass=NullPool)
        with base_engine.connect() as conn:
            conn.execute(text("DROP SCHEMA IF EXISTS test_schema CASCADE"))
            conn.commit()
        base_engine.dispose()

@pytest.fixture(scope="function")
def db():
    """Create clean tables inside test_schema for each test case."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        # Delete all records from tables in dependency order (children first)
        for table in reversed(Base.metadata.sorted_tables):
            try:
                session.execute(table.delete())
                session.commit()
            except Exception:
                session.rollback()
        session.close()

@pytest.fixture(scope="function")
def client(db):
    """Override get_db dependency and return a TestClient."""
    def override_get_db():
        try:
            yield db
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
