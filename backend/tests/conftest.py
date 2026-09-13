import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from backend.app.database.session import Base, get_db
from backend.app.database.models import User, NotificationPreference
from backend.app.main import app

# In-memory SQLite configuration for fast, isolated testing
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Create test tables and seed the development user for the test session."""
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()
    dev_user = User(
        id=1,
        name="Test Farmer",
        email="testfarmer@kisanmitra.ai",
        preferred_language="hi",
    )
    db.add(dev_user)
    db.flush()
    pref = NotificationPreference(
        user_id=dev_user.id,
        weather_alerts=True,
        mandi_alerts=True,
        scheme_alerts=True,
        disease_alerts=True,
    )
    db.add(pref)
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    """Yield a database session for an individual test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """Yield a TestClient with overridden get_db dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
