from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.user import Student
from app.models.pbl import PblActivity, Component, ComponentAssignment, AssignmentScope, PblStatus
from app.models.group import Group, GroupMember
from app.models.progress import StudentComponentProgress, ProgressState, SubmissionState, FacultyReview
from app.schemas.pbl import ComponentOut, ComponentAssignmentOut
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
    student_group_ids_for_pbl: List[int]
) -> bool:
    """
    Checks if a component is assigned to the student based on assignment scopes:
    - ALL: applies to all students in the PBL's semester/department
    - DIVISION: matches student's division_id
    - GROUP: matches any of the student's group IDs for this PBL
    - STUDENT: matches student's ID directly
    If a component has no explicit assignments, default to ALL.
    """
    if not component.assignments:
        return True

    for assignment in component.assignments:
        if assignment.scope_type == AssignmentScope.ALL:
            return True
        elif assignment.scope_type == AssignmentScope.DIVISION and assignment.target_id == student.division_id:
            return True
        elif assignment.scope_type == AssignmentScope.STUDENT and assignment.target_id == student.id:
            return True
        elif assignment.scope_type == AssignmentScope.GROUP and assignment.target_id in student_group_ids_for_pbl:
            return True

    return False


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
    review = (
        db.query(FacultyReview)
        .filter(
            FacultyReview.student_id == student.id,
            FacultyReview.component_id == component.id
        )
        .first()
    )

    deadline_state, days_remaining = calculate_deadline_info(
        component.deadline,
        progress.progress_state,
        progress.submission_state
    )

    # Determine group-specific or division-specific custom description if configured
    student_group_ids = get_student_group_ids(db, student.id, component.pbl_activity_id)
    student_desc = None
    group_desc = None
    div_desc = None
    all_desc = None

    for a in component.assignments:
        scope = a.scope_type.value if hasattr(a.scope_type, 'value') else str(a.scope_type)
        if not a.custom_description:
            continue
        if scope == "STUDENT" and a.target_id == student.id:
            student_desc = a.custom_description
        elif scope == "GROUP" and a.target_id in student_group_ids:
            group_desc = a.custom_description
        elif scope == "DIVISION" and a.target_id == student.division_id:
            div_desc = a.custom_description
        elif scope == "ALL":
            all_desc = a.custom_description

    custom_desc = student_desc or group_desc or div_desc or all_desc

    assignments_out = [
        ComponentAssignmentOut(
            id=a.id,
            component_id=a.component_id,
            scope_type=a.scope_type,
            target_id=a.target_id,
            custom_description=a.custom_description,
        )
        for a in component.assignments
    ]

    return ComponentOut(
        id=component.id,
        pbl_activity_id=component.pbl_activity_id,
        component_type_id=component.component_type_id,
        component_type_name=component.component_type.name if component.component_type else None,
        component_type_icon=component.component_type.icon if component.component_type else "FileText",
        title=component.title,
        description=custom_desc if custom_desc else component.description,
        assignment_custom_description=custom_desc,
        deadline=component.deadline,
        submission_required=component.submission_required,
        external_submission_url=component.external_submission_url,
        external_classroom_url=component.external_classroom_url,
        external_resource_url=component.external_resource_url,
        is_group=component.is_group,
        created_at=component.created_at,
        assignments=assignments_out,
        deadline_state=deadline_state,
        days_remaining=days_remaining,
        student_progress_state=progress.progress_state.value,
        student_submission_state=progress.submission_state.value,
        faculty_feedback=review.feedback if review and review.feedback else None,
        # NOTE: Marks are STRICTLY NOT included in ComponentOut!
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
        student_group_ids = get_student_group_ids(db, student.id, pbl.id)
        for comp in pbl.components:
            if is_component_assigned_to_student(comp, student, student_group_ids):
                results.append(enrich_component_for_student(db, comp, student))

    return results
