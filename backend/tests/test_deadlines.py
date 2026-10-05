from datetime import datetime, timedelta, timezone
from app.services.deadline_service import calculate_deadline_info
from app.models.progress import ProgressState, SubmissionState


def test_deadline_calculation_states():
    now = datetime.now(timezone.utc)

    # 1. Completed by student progress
    state, _ = calculate_deadline_info(now + timedelta(days=5), progress_state=ProgressState.DONE)
    assert state == "COMPLETED"

    # 2. Completed by submission
    state, _ = calculate_deadline_info(now + timedelta(days=5), submission_state=SubmissionState.SUBMITTED)
    assert state == "COMPLETED"

    # 3. Overdue
    state, days = calculate_deadline_info(now - timedelta(days=2))
    assert state == "OVERDUE"
    assert days < 0

    # 4. Due today
    state, days = calculate_deadline_info(now + timedelta(hours=2))
    assert state == "DUE_TODAY"

    # 5. Due soon (<= 3 days)
    state, days = calculate_deadline_info(now + timedelta(days=2))
    assert state == "DUE_SOON"
    assert days <= 3

    # 6. Upcoming (> 3 days)
    state, days = calculate_deadline_info(now + timedelta(days=10))
    assert state == "UPCOMING"
    assert days >= 4


def test_duplicate_pbl(client, faculty_token):
    headers = {"Authorization": f"Bearer {faculty_token}"}
    req = {
        "target_academic_year_id": 1,
        "target_semester_id": 1,
        "new_title": "Computer Networks PBL 2027 Cloned"
    }
    res = client.post("/api/v1/faculty/pbl/1/duplicate", headers=headers, json=req)
    assert res.status_code == 200
    data = res.json()
    assert data["title"] == "Computer Networks PBL 2027 Cloned"
    assert len(data["components"]) >= 3
