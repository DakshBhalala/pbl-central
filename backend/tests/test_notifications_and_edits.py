import pytest
from datetime import datetime, timedelta, timezone


def test_new_pbl_activity_notifies_students(client, db, faculty_token, student_token):
    from app.models.user import Student
    faculty_headers = {"Authorization": f"Bearer {faculty_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # Retrieve student from db to obtain current enrolled semester and department
    rahul = db.query(Student).filter(Student.enrollment_number == "230101").first()
    assert rahul is not None
    dept_id = rahul.department_id
    sem_id = rahul.semester_id

    # Create new PBL activity as Faculty in that student's department and semester
    today = datetime.now(timezone.utc).date()
    pbl_payload = {
        "title": "Cloud Computing Infrastructure Project",
        "description": "Design and deploy scalable microservices",
        "subject_id": 1,
        "academic_year_id": 1,
        "semester_id": sem_id,
        "department_id": dept_id,
        "start_date": str(today),
        "end_date": str(today + timedelta(days=90)),
        "status": "ACTIVE",
        "topic_mode": "STUDENT_PROPOSED",
        "allow_student_groups": True,
        "require_group_approval": False,
        "faculty_ids": [1]
    }
    create_res = client.post("/api/v1/faculty/pbl", headers=faculty_headers, json=pbl_payload)
    assert create_res.status_code == 200
    pbl_data = create_res.json()
    pbl_id = pbl_data["id"]

    # Student should now have received a notification about this new PBL
    notif_res = client.get("/api/v1/notifications", headers=student_headers)
    assert notif_res.status_code == 200
    notifs = notif_res.json()["notifications"]

    matching_pbl_notifs = [
        n for n in notifs
        if "Cloud Computing Infrastructure Project" in n["title"] or "Cloud Computing Infrastructure Project" in n["message"]
    ]
    assert len(matching_pbl_notifs) > 0
    assert matching_pbl_notifs[0]["link"] == f"/student/pbl/{pbl_id}"


def test_new_component_notifies_students(client, faculty_token, student_token):
    faculty_headers = {"Authorization": f"Bearer {faculty_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # Add component to PBL 1
    comp_payload = {
        "component_type_id": 1,
        "title": "Automated Deployment Pipeline Milestone",
        "description": "Submit GitHub Actions workflow YAML",
        "deadline": (datetime.now(timezone.utc) + timedelta(days=14)).isoformat(),
        "submission_required": True,
        "is_group": False,
        "assignments": [
            {
                "scope_type": "ALL",
                "target_id": None
            }
        ]
    }
    comp_res = client.post("/api/v1/faculty/pbl/1/components", headers=faculty_headers, json=comp_payload)
    assert comp_res.status_code == 200

    # Student should have received milestone notification
    notif_res = client.get("/api/v1/notifications", headers=student_headers)
    assert notif_res.status_code == 200
    notifs = notif_res.json()["notifications"]

    matching_comp_notifs = [
        n for n in notifs
        if "Automated Deployment Pipeline Milestone" in n["title"] or "Automated Deployment Pipeline Milestone" in n["message"]
    ]
    assert len(matching_comp_notifs) > 0


def test_faculty_profile_update(client, faculty_token):
    faculty_headers = {"Authorization": f"Bearer {faculty_token}"}
    patch_res = client.patch(
        "/api/v1/faculty/me/profile",
        headers=faculty_headers,
        json={"phone": "+91 9876543210", "email": "rajesh.updated@college.edu"}
    )
    assert patch_res.status_code == 200
    data = patch_res.json()
    assert data["phone"] == "+91 9876543210"
    assert data["email"] == "rajesh.updated@college.edu"


def test_admin_student_and_faculty_editing(client, admin_token):
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Edit student
    student_edit = client.patch(
        "/api/v1/admin/students/1",
        headers=admin_headers,
        json={"phone_number": "+91 9123456780", "name": "Rahul P. Patel"}
    )
    assert student_edit.status_code == 200
    assert student_edit.json()["phone_number"] == "+91 9123456780"
    assert student_edit.json()["name"] == "Rahul P. Patel"

    # Edit faculty
    faculty_edit = client.patch(
        "/api/v1/admin/faculty/1",
        headers=admin_headers,
        json={"phone": "+91 9998887776", "faculty_code": "CSE-FAC-01"}
    )
    assert faculty_edit.status_code == 200
    assert faculty_edit.json()["phone"] == "+91 9998887776"
    assert faculty_edit.json()["faculty_code"] == "CSE-FAC-01"


def test_draft_hidden_pbl_and_publish_workflow(client, db, faculty_token, student_token):
    from app.models.user import Student
    faculty_headers = {"Authorization": f"Bearer {faculty_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}

    rahul = db.query(Student).filter(Student.enrollment_number == "230101").first()
    assert rahul is not None

    today = datetime.now(timezone.utc).date()
    # 1. Create a DRAFT (hidden) PBL
    draft_payload = {
        "title": "Secret Robotics Challenge",
        "description": "Embedded ROS 2 controllers",
        "subject_id": 1,
        "academic_year_id": 1,
        "semester_id": rahul.semester_id,
        "department_id": rahul.department_id,
        "start_date": str(today),
        "end_date": str(today + timedelta(days=60)),
        "status": "DRAFT",
        "topic_mode": "NO_TOPIC",
        "allow_student_groups": True,
        "require_group_approval": False,
        "faculty_ids": [1]
    }
    create_res = client.post("/api/v1/faculty/pbl", headers=faculty_headers, json=draft_payload)
    assert create_res.status_code == 200
    pbl_id = create_res.json()["id"]

    # Student must NOT receive any notification about draft PBL
    notif_res = client.get("/api/v1/notifications", headers=student_headers)
    assert notif_res.status_code == 200
    draft_notifs = [
        n for n in notif_res.json()["notifications"]
        if "Secret Robotics Challenge" in n["title"]
    ]
    assert len(draft_notifs) == 0

    # Student cannot view draft PBL
    student_pbl_res = client.get(f"/api/v1/students/me/pbl/{pbl_id}", headers=student_headers)
    assert student_pbl_res.status_code == 404

    # 2. Add component to the draft PBL -> student must NOT be notified while hidden
    comp_res = client.post(
        f"/api/v1/faculty/pbl/{pbl_id}/components",
        headers=faculty_headers,
        json={
            "component_type_id": 1,
            "title": "Robotics URDF Modeling",
            "description": "Submit kinematics model",
            "deadline": (datetime.now(timezone.utc) + timedelta(days=10)).isoformat(),
            "submission_required": True,
            "is_group": False,
            "assignments": [{"scope_type": "ALL", "target_id": None}]
        }
    )
    assert comp_res.status_code == 200
    comp_id = comp_res.json()["id"]

    notif_res2 = client.get("/api/v1/notifications", headers=student_headers)
    comp_notifs = [
        n for n in notif_res2.json()["notifications"]
        if "Robotics URDF Modeling" in n["title"]
    ]
    assert len(comp_notifs) == 0

    # 3. Faculty Publishes the PBL (status: DRAFT -> ACTIVE)
    publish_res = client.patch(
        f"/api/v1/faculty/pbl/{pbl_id}",
        headers=faculty_headers,
        json={"status": "ACTIVE"}
    )
    assert publish_res.status_code == 200
    assert publish_res.json()["status"] == "ACTIVE"

    # Now student receives the notification that the PBL is active/published!
    notif_res3 = client.get("/api/v1/notifications", headers=student_headers)
    pub_notifs = [
        n for n in notif_res3.json()["notifications"]
        if "Secret Robotics Challenge" in n["title"] or "Secret Robotics Challenge" in n["message"]
    ]
    assert len(pub_notifs) > 0

    # And student can now view the PBL!
    student_pbl_active = client.get(f"/api/v1/students/me/pbl/{pbl_id}", headers=student_headers)
    assert student_pbl_active.status_code == 200

    # 4. In published state, faculty updates the component -> student receives update notification
    update_comp_res = client.patch(
        f"/api/v1/faculty/components/{comp_id}",
        headers=faculty_headers,
        json={
            "title": "Robotics URDF Modeling (Revised Spec)",
            "description": "Updated deadline and submission guidelines"
        }
    )
    assert update_comp_res.status_code == 200

    notif_res4 = client.get("/api/v1/notifications", headers=student_headers)
    updated_comp_notifs = [
        n for n in notif_res4.json()["notifications"]
        if "Robotics URDF Modeling (Revised Spec)" in n["title"]
    ]
    assert len(updated_comp_notifs) > 0

