from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models.pbl import PblActivity, Component, ComponentAssignment, PblFaculty, PblStatus, AssignmentScope
from app.models.academic import Semester, AcademicYear, Subject
from app.schemas.pbl import PblDuplicateRequest


def duplicate_pbl_activity(
    db: Session,
    source_pbl_id: int,
    req: PblDuplicateRequest,
    current_user_id: int
) -> PblActivity:
    source_pbl = db.query(PblActivity).filter(PblActivity.id == source_pbl_id).first()
    if not source_pbl:
        raise ValueError("Source PBL activity not found")

    target_year = db.query(AcademicYear).filter(AcademicYear.id == req.target_academic_year_id).first()
    if not target_year:
        raise ValueError("Target academic year not found")

    target_sem = db.query(Semester).filter(Semester.id == req.target_semester_id).first()
    if not target_sem:
        raise ValueError("Target semester not found")

    target_subject_id = req.target_subject_id or source_pbl.subject_id
    target_subject = db.query(Subject).filter(Subject.id == target_subject_id).first()
    if not target_subject:
        raise ValueError("Target subject not found")

    title = req.new_title or f"{source_pbl.title} ({target_sem.name} {target_year.name})"

    new_pbl = PblActivity(
        title=title,
        description=source_pbl.description,
        subject_id=target_subject_id,
        academic_year_id=req.target_academic_year_id,
        semester_id=req.target_semester_id,
        department_id=target_sem.department_id,
        start_date=target_year.start_date,
        end_date=target_year.end_date,
        status=PblStatus.ACTIVE,
        topic_mode=source_pbl.topic_mode,
        allow_student_groups=source_pbl.allow_student_groups,
        require_group_approval=source_pbl.require_group_approval,
        created_by=current_user_id,
    )
    db.add(new_pbl)
    db.flush()

    # Replicate faculty assignments
    for faculty_assoc in source_pbl.faculty_members:
        new_faculty_assoc = PblFaculty(
            pbl_activity_id=new_pbl.id,
            faculty_id=faculty_assoc.faculty_id,
            role_description=faculty_assoc.role_description
        )
        db.add(new_faculty_assoc)

    # Replicate components
    for comp in source_pbl.components:
        new_comp = Component(
            pbl_activity_id=new_pbl.id,
            component_type_id=comp.component_type_id,
            title=comp.title,
            description=comp.description,
            # For duplicated PBL, set deadline relative to target year end date or a month from now
            deadline=datetime.combine(target_year.end_date, datetime.min.time(), tzinfo=timezone.utc),
            submission_required=comp.submission_required,
            external_submission_url=comp.external_submission_url,
            external_classroom_url=comp.external_classroom_url,
            external_resource_url=comp.external_resource_url,
            is_group=comp.is_group,
            created_by=current_user_id,
        )
        db.add(new_comp)
        db.flush()

        # Replicate generic ALL assignment scope
        has_generic_scope = False
        for assign in comp.assignments:
            if assign.scope_type == AssignmentScope.ALL:
                new_assign = ComponentAssignment(
                    component_id=new_comp.id,
                    scope_type=AssignmentScope.ALL,
                    target_id=None
                )
                db.add(new_assign)
                has_generic_scope = True
                break

        if not has_generic_scope:
            # Default to ALL in newly duplicated activity
            db.add(ComponentAssignment(
                component_id=new_comp.id,
                scope_type=AssignmentScope.ALL,
                target_id=None
            ))

    db.commit()
    db.refresh(new_pbl)
    return new_pbl
