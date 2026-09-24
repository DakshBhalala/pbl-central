def test_student_dashboard_components(client, student_token):
    headers = {"Authorization": f"Bearer {student_token}"}
    res = client.get("/api/v1/students/me/dashboard", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["student_name"] == "Rahul Patel"
    assert data["enrollment_number"] == "230101"
    assert data["active_pbl_count"] >= 4
    assert len(data["subject_summaries"]) >= 4

    # CRITICAL SECURITY CHECK: Check that internal_marks is nowhere in student components
    for comp in data["upcoming_deadlines"] + data["overdue_items"]:
        assert "internal_marks" not in comp


def test_student_progress_and_submission_update(client, student_token):
    headers = {"Authorization": f"Bearer {student_token}"}
    # Update progress
    res = client.patch(
        "/api/v1/students/me/components/1/progress",
        headers=headers,
        json={"progress_state": "DONE"}
    )
    assert res.status_code == 200
    assert res.json()["progress_state"] == "DONE"

    # Update submission
    res_sub = client.patch(
        "/api/v1/students/me/components/1/submission",
        headers=headers,
        json={"submission_state": "SUBMITTED"}
    )
    assert res_sub.status_code == 200
    assert res_sub.json()["submission_state"] == "SUBMITTED"


def test_faculty_submission_review_with_internal_marks(client, faculty_token):
    headers = {"Authorization": f"Bearer {faculty_token}"}
    review_data = {
        "student_id": 1,
        "component_id": 1,
        "internal_marks": 23.5,
        "feedback": "Clean packet trace analysis.",
        "is_rejected": False
    }
    res = client.post("/api/v1/faculty/reviews", headers=headers, json=review_data)
    assert res.status_code == 200
    data = res.json()
    assert data["internal_marks"] == 23.5
    assert data["feedback"] == "Clean packet trace analysis."
