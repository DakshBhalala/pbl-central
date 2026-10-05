def test_student_login(client):
    res = client.post("/api/v1/auth/login", json={"username": "230101", "password": "Student@123"})
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "STUDENT"
    assert "access_token" in data
    assert data["name"] == "Rahul Patel"


def test_faculty_login(client):
    res = client.post("/api/v1/auth/login", json={"username": "faculty01", "password": "Faculty@123"})
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "FACULTY"
    assert data["name"] == "Dr. Rajesh Sharma"


def test_admin_login(client):
    res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "Admin@123"})
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "ADMIN"


def test_invalid_login(client):
    res = client.post("/api/v1/auth/login", json={"username": "230101", "password": "WrongPassword"})
    assert res.status_code == 401
