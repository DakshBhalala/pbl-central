from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.user import Student
from app.models.pbl import PblActivity, Component, PblStatus
from app.models.group import Group, GroupMember
from app.models.progress import StudentComponentProgress, ProgressState, SubmissionState
from app.schemas.pbl import ComponentOut
from app.services.deadline_service import calculate_deadline_info


def get_student_group_ids(db: Session, student_id: int, pbl_activity_id: Optional[int] = None) -> List[int]:
    query = (
        db.query(GroupMember.group_id)
        .join(Group, GroupMember.group_id == Group.id)
        .filter(GroupMember.student_id == student_id)
    )
    if pbl_activity_id:
        query = query.filter(Group.pbl_activity_id == pbl_activity_id)
    return [r[0] for r in query.all()]


def is_component_assigned_to_student(
    component: Component,
    student: Student,
    student_group_ids_for_pbl: Optional[List[int]] = None
) -> bool:
    """
    In the simplified design, all components of a PBL activity apply to all students
    enrolled in that activity's department and semester.
    """
    return True


def get_or_create_progress(
    db: Session,
    student_id: int,
    component_id: int
) -> StudentComponentProgress:
    progress = (
        db.query(StudentComponentProgress)
        .filter(
            StudentComponentProgress.student_id == student_id,
            StudentComponentProgress.component_id == component_id
        )
        .first()
    )
    if not progress:
        progress = StudentComponentProgress(
            student_id=student_id,
            component_id=component_id,
            progress_state=ProgressState.TODO,
            submission_state=SubmissionState.NOT_SUBMITTED
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)
    return progress


def enrich_component_for_student(
    db: Session,
    component: Component,
    student: Student
) -> ComponentOut:
    progress = get_or_create_progress(db, student.id, component.id)

    deadline_state, days_remaining = calculate_deadline_info(
        component.deadline,
        progress.progress_state,
        progress.submission_state
    )

    return ComponentOut(
        id=component.id,
        pbl_activity_id=component.pbl_activity_id,
        component_type_id=component.component_type_id,
        component_type_name=component.component_type.name if component.component_type else None,
        component_type_icon=component.component_type.icon if component.component_type else "FileText",
        title=component.title,
        description=component.description,
        deadline=component.deadline,
        submission_required=component.submission_required,
        external_submission_url=component.external_submission_url,
        external_classroom_url=component.external_classroom_url,
        external_resource_url=component.external_resource_url,
        is_group=component.is_group,
        created_at=component.created_at,
        deadline_state=deadline_state,
        days_remaining=days_remaining,
        student_progress_state=progress.progress_state.value,
        student_submission_state=progress.submission_state.value,
        faculty_feedback=progress.faculty_feedback,
    )


def get_assigned_components_for_student(
    db: Session,
    student: Student,
    pbl_activity_id: Optional[int] = None
) -> List[ComponentOut]:
    # Find all active PBL activities applicable to the student's department and semester
    pbl_query = db.query(PblActivity).filter(
        PblActivity.department_id == student.department_id,
        PblActivity.semester_id == student.semester_id,
        PblActivity.status == PblStatus.ACTIVE
    )
    if pbl_activity_id:
        pbl_query = pbl_query.filter(PblActivity.id == pbl_activity_id)

    pbl_activities = pbl_query.all()
    results: List[ComponentOut] = []

    for pbl in pbl_activities:
        for comp in pbl.components:
            results.append(enrich_component_for_student(db, comp, student))

    return results
