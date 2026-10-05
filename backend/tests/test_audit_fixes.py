import pytest
from datetime import datetime, timedelta, timezone
from app.models.pbl import (
    PblActivity,
    Component,
)
from app.models.progress import SubmissionState, ProgressState
from app.models.user import Student, User, UserRole
from app.models.academic import Department


def test_student_components_cohort_resolution(client, student_token, db):
    """
    Verify that components belonging to the student's PBL activity are seamlessly
    resolved and accessible to the student.
    """
    headers = {"Authorization": f"Bearer {student_token}"}

    # Query student PBL detail
    res = client.get("/api/v1/students/me/pbl/1", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["components"]) >= 1
    comp1 = next((c for c in data["components"] if c["id"] == 1), None)
    assert comp1 is not None


def test_resubmission_prevention_after_rejection(client, student_token, faculty_token):
    """
    Requirement 8: Once faculty rejects a submission, student cannot resubmit
    through the platform (HTTP 400).
    """
    fac_headers = {"Authorization": f"Bearer {faculty_token}"}
    stud_headers = {"Authorization": f"Bearer {student_token}"}

    # Faculty reviews and rejects component 2 for student 1
    review_data = {
        "student_id": 1,
        "component_id": 2,
        "status": "REJECTED",
        "feedback": "Plagiarism detected in certificate document. Resubmission blocked.",
        "is_rejected": True
    }
    fac_res = client.post("/api/v1/faculty/reviews", headers=fac_headers, json=review_data)
    assert fac_res.status_code == 200

    # Student attempts to mark as SUBMITTED again
    sub_res = client.patch(
        "/api/v1/students/me/components/2/submission",
        headers=stud_headers,
        json={"submission_state": "SUBMITTED"}
    )
    assert sub_res.status_code == 400
    assert "rejected" in sub_res.json()["detail"].lower()


def test_student_profile_contact_control(client, student_token):
    """
    Requirement 12: Student controls Email and Phone, but cannot arbitrarily
    change Enrollment Number, Name, or Semester.
    """
    stud_headers = {"Authorization": f"Bearer {student_token}"}

    update_payload = {
        "email": "rahul.updated@student.edu",
        "phone_number": "+91 9876543210"
    }
    res = client.patch("/api/v1/students/me/profile", headers=stud_headers, json=update_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "rahul.updated@student.edu"
    assert data["phone_number"] == "+91 9876543210"

    # Verify through GET /profile
    get_res = client.get("/api/v1/students/me/profile", headers=stud_headers)
    assert get_res.status_code == 200
    profile = get_res.json()
    assert profile["email"] == "rahul.updated@student.edu"
    assert profile["phone_number"] == "+91 9876543210"
    assert profile["enrollment_number"] == "230101"


def test_department_isolation_and_cross_access_prevention(client, student_token, faculty_token, db):
    """
    Requirement 16 & 30: Prevent cross-department data tampering (IDOR check).
    """
    stud_headers = {"Authorization": f"Bearer {student_token}"}

    # Student 1 is in Department 1 (Computer Engineering, Semester 5)
    # Create component 999 belonging to a different department (Department 2)
    other_pbl = PblActivity(
        title="Cross Department Activity",
        subject_id=1,
        department_id=2, # Mechanical Engineering
        academic_year_id=1,
        semester_id=1,
        start_date=datetime.now(timezone.utc).date(),
        end_date=(datetime.now(timezone.utc) + timedelta(days=60)).date(),
    )
    db.add(other_pbl)
    db.commit()
    db.refresh(other_pbl)

    other_comp = Component(
        pbl_activity_id=other_pbl.id,
        component_type_id=1,
        title="Mechanical CAD Drawing",
        deadline=datetime.now(timezone.utc) + timedelta(days=30),
    )
    db.add(other_comp)
    db.commit()
    db.refresh(other_comp)

    # Student tries to update progress on a component from another department
    tamper_res = client.patch(
        f"/api/v1/students/me/components/{other_comp.id}/progress",
        headers=stud_headers,
        json={"progress_state": "DONE"}
    )
    # Must be 404 (not accessible to this student's department)
    assert tamper_res.status_code == 404


def test_marks_confidentiality_strict_audit(client, student_token):
    """
    Requirement 9: Strict check that no student endpoint ever leaks internal_marks.
    """
    stud_headers = {"Authorization": f"Bearer {student_token}"}

    endpoints = [
        "/api/v1/students/me/dashboard",
        "/api/v1/students/me/pbl",
        "/api/v1/students/me/pbl/1",
        "/api/v1/students/me/groups",
        "/api/v1/students/me/profile",
        "/api/v1/notifications",
    ]

    for ep in endpoints:
        res = client.get(ep, headers=stud_headers)
        assert res.status_code == 200
        content_str = res.text
        # String search for internal_marks key
        assert '"internal_marks"' not in content_str, f"Leaked internal_marks in {ep}"


def test_pbl_duplication_cleanliness(client, faculty_token):
    """
    Requirement 14: Duplicating a PBL copies the structure but does NOT copy
    students, groups, progress, marks, or submissions.
    """
    fac_headers = {"Authorization": f"Bearer {faculty_token}"}

    dup_payload = {
        "new_title": "Clean Cloned PBL Activity",
        "target_academic_year_id": 1,
        "target_semester_id": 1
    }
    dup_res = client.post("/api/v1/faculty/pbl/1/duplicate", headers=fac_headers, json=dup_payload)
    assert dup_res.status_code == 200
    new_pbl = dup_res.json()
    assert new_pbl["title"] == "Clean Cloned PBL Activity"
    assert new_pbl["id"] != 1
    # Check components copied
    assert len(new_pbl["components"]) >= 1

    # Verify no groups or student progress were copied to new PBL
    detail_res = client.get(f"/api/v1/faculty/pbl/{new_pbl['id']}", headers=fac_headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert len(detail.get("groups", [])) == 0


def test_submission_reset_prevention(client, student_token):
    """
    Requirement: Students must NOT be able to reset a submission after submitting.
    State machine: NOT_SUBMITTED -> SUBMITTED -> REJECTED.
    """
    headers = {"Authorization": f"Bearer {student_token}"}
    # 1. Mark as SUBMITTED
    sub_res = client.patch(
        "/api/v1/students/me/components/1/submission",
        headers=headers,
        json={"submission_state": "SUBMITTED"}
    )
    assert sub_res.status_code == 200

    # 2. Attempt to reset to NOT_SUBMITTED must fail with 400
    reset_res = client.patch(
        "/api/v1/students/me/components/1/submission",
        headers=headers,
        json={"submission_state": "NOT_SUBMITTED"}
    )
    assert reset_res.status_code == 400
    assert "cannot reset" in reset_res.json()["detail"].lower() or "not permitted" in reset_res.json()["detail"].lower()
