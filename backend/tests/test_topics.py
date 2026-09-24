def test_student_propose_topic_auto_approved(client, student_token):
    headers = {"Authorization": f"Bearer {student_token}"}
    payload = {
        "pbl_activity_id": 1,
        "title": "Autonomous Drone Pathfinding with Obstacle Avoidance",
        "description": "Simulating dynamic A* routing in 3D environment."
    }
    res = client.post("/api/v1/students/me/topics/propose", headers=headers, json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "APPROVED"
    assert data["mode"] == "STUDENT_PROPOSED"
    assert len(data["history"]) >= 1


def test_faculty_reject_and_approve_topic(client, faculty_token):
    headers = {"Authorization": f"Bearer {faculty_token}"}
    # Reject topic 1
    reject_res = client.patch(
        "/api/v1/faculty/topics/1/reject",
        headers=headers,
        json={"reason": "Topic scope is too broad for one semester."}
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "REJECTED"
    assert reject_res.json()["rejection_reason"] == "Topic scope is too broad for one semester."

    # Re-approve topic 1
    approve_res = client.patch(
        "/api/v1/faculty/topics/1/approve",
        headers=headers
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "APPROVED"
