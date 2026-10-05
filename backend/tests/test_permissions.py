def test_student_cannot_access_admin_routes(client, student_token):
    headers = {"Authorization": f"Bearer {student_token}"}
    res = client.get("/api/v1/admin/dashboard", headers=headers)
    assert res.status_code == 403


def test_student_cannot_access_faculty_routes(client, student_token):
    headers = {"Authorization": f"Bearer {student_token}"}
    res = client.get("/api/v1/faculty/me/dashboard", headers=headers)
    assert res.status_code == 403


def test_admin_can_access_admin_dashboard(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.get("/api/v1/admin/dashboard", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "departments_count" in data
    assert data["departments_count"] >= 5


def test_faculty_can_access_faculty_dashboard(client, faculty_token):
    headers = {"Authorization": f"Bearer {faculty_token}"}
    res = client.get("/api/v1/faculty/me/dashboard", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "active_pbl_count" in data
