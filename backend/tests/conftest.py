import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.main import app
from app.seed import seed_database

# Use test sqlite database
TEST_DB_URL = "sqlite:///./test_pbl.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    test_db = TestingSessionLocal()
    try:
        seed_database(db=test_db)
    finally:
        test_db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def student_token(client):
    res = client.post("/api/v1/auth/login", json={"username": "230101", "password": "Student@123"})
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.fixture
def faculty_token(client):
    res = client.post("/api/v1/auth/login", json={"username": "faculty01", "password": "Faculty@123"})
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.fixture
def admin_token(client):
    res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "Admin@123"})
    assert res.status_code == 200
    return res.json()["access_token"]
