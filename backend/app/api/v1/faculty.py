from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Body
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_faculty, require_role
from app.models.user import Faculty, UserRole, Student, User
from app.models.academic import Subject, AcademicYear, Semester, Department
from app.models.pbl import (
    PblActivity,
    PblFaculty,
    Component,
    ComponentAssignment,
    PblStatus,
    AssignmentScope,
    TopicMode,
)
from app.models.group import Group, GroupMember, Project
from app.models.topic import Topic, TopicHistory, TopicStatus
from app.models.progress import StudentComponentProgress, FacultyReview, SubmissionState, ProgressState
from app.schemas.pbl import (
    PblActivityCreate,
    PblActivityUpdate,
    PblActivityOut,
    PblActivityDetailOut,
    PblDuplicateRequest,
    ComponentCreate,
    ComponentUpdate,
    ComponentOut,
    FacultySimpleOut,
    ComponentAssignmentOut,
    ComponentAssignmentUpdate,
)
from app.schemas.group import GroupCreate, GroupOut, GroupMemberOut, ProjectOut
from app.schemas.topic import TopicCreate, TopicOut, TopicRejectRequest, TopicHistoryOut
from app.schemas.progress import FacultyReviewCreate, FacultyReviewOut
from app.schemas.user import StudentOut, StudentCreate
from app.services.pbl_service import duplicate_pbl_activity
from app.services.csv_service import parse_and_validate_student_csv, execute_student_import
from app.services.notification_service import create_notification
from app.services.deadline_service import calculate_deadline_info

router = APIRouter(prefix="/faculty", tags=["Faculty"])


@router.get("/me/dashboard")
def get_faculty_dashboard(
    faculty: Optional[Faculty] = Depends(get_current_faculty),
    current_user: User = Depends(require_role([UserRole.FACULTY, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    query = db.query(PblActivity)
    if faculty:
        query = query.join(PblFaculty, PblFaculty.pbl_activity_id == PblActivity.id).filter(
            PblFaculty.faculty_id == faculty.id
        )
    pbl_activities = query.all()
    pbl_ids = [p.id for p in pbl_activities]

    # Components count
    total_components = (
        db.query(Component)
        .filter(Component.pbl_activity_id.in_(pbl_ids))
        .count() if pbl_ids else 0
    )

    # Submissions needing review: status SUBMITTED without a faculty review yet
    pending_submissions = (
        db.query(StudentComponentProgress)
        .join(Component, StudentComponentProgress.component_id == Component.id)
        .outerjoin(
            FacultyReview,
            (FacultyReview.student_id == StudentComponentProgress.student_id) &
            (FacultyReview.component_id == StudentComponentProgress.component_id)
        )
        .filter(
            Component.pbl_activity_id.in_(pbl_ids),
            StudentComponentProgress.submission_state == SubmissionState.SUBMITTED,
            FacultyReview.id == None
        )
        .count() if pbl_ids else 0
    )

    # Topics pending action (student proposed)
    pending_topics = (
        db.query(Topic)
        .filter(
            Topic.pbl_activity_id.in_(pbl_ids),
            Topic.mode == TopicMode.STUDENT_PROPOSED,
            Topic.status == TopicStatus.APPROVED  # currently auto-approved, available for review/rejection
        )
        .count() if pbl_ids else 0
    )

    # Overdue components count across student assignments
    now = datetime.now(timezone.utc)
    overdue_count = (
        db.query(StudentComponentProgress)
        .join(Component, StudentComponentProgress.component_id == Component.id)
        .filter(
            Component.pbl_activity_id.in_(pbl_ids),
            Component.deadline < now,
            StudentComponentProgress.progress_state != ProgressState.DONE,
            StudentComponentProgress.submission_state != SubmissionState.SUBMITTED
        )
        .count() if pbl_ids else 0
    )

    # Recent student submissions
    recent_submissions_query = (
        db.query(StudentComponentProgress, Student, Component)
        .join(Student, StudentComponentProgress.student_id == Student.id)
        .join(Component, StudentComponentProgress.component_id == Component.id)
        .filter(
            Component.pbl_activity_id.in_(pbl_ids),
            StudentComponentProgress.submission_state == SubmissionState.SUBMITTED
        )
        .order_by(StudentComponentProgress.submitted_at.desc())
        .limit(6)
        .all() if pbl_ids else []
    )

    recent_submissions = [
        {
            "student_id": student.id,
            "student_name": student.name,
            "enrollment_number": student.enrollment_number,
            "component_id": comp.id,
            "component_title": comp.title,
            "submitted_at": prog.submitted_at
        }
        for prog, student, comp in recent_submissions_query
    ]

    return {
        "faculty_name": faculty.name if faculty else "Administrator",
        "active_pbl_count": len(pbl_activities),
        "total_components": total_components,
        "pending_reviews": pending_submissions,
        "pending_topics": pending_topics,
        "overdue_items": overdue_count,
        "recent_submissions": recent_submissions,
    }


@router.get("/pbl", response_model=List[PblActivityOut])
def list_faculty_pbl_activities(
    faculty: Optional[Faculty] = Depends(get_current_faculty),
    db: Session = Depends(get_db)
):
    query = db.query(PblActivity)
    if faculty:
        query = query.join(PblFaculty, PblFaculty.pbl_activity_id == PblActivity.id).filter(
            PblFaculty.faculty_id == faculty.id
        )
    pbls = query.order_by(PblActivity.created_at.desc()).all()

    result = []
    for p in pbls:
        result.append(PblActivityOut(
            id=p.id,
            title=p.title,
            description=p.description,
            subject_id=p.subject_id,
            academic_year_id=p.academic_year_id,
            semester_id=p.semester_id,
            department_id=p.department_id,
            start_date=p.start_date,
            end_date=p.end_date,
            status=p.status,
            topic_mode=p.topic_mode,
            allow_student_groups=p.allow_student_groups,
            require_group_approval=p.require_group_approval,
            subject_name=p.subject.name if p.subject else None,
            subject_code=p.subject.subject_code if p.subject else None,
            academic_year_name=p.academic_year.name if p.academic_year else None,
            semester_name=p.semester.name if p.semester else None,
            department_name=p.department.name if p.department else None,
            faculty_members=[
                FacultySimpleOut(
                    id=assoc.faculty.id,
                    name=assoc.faculty.name,
                    email=assoc.faculty.email,
                    role_description=assoc.role_description
                )
                for assoc in p.faculty_members if assoc.faculty
            ],
            component_count=len(p.components),
            created_at=p.created_at
        ))
    return result


@router.post("/pbl", response_model=PblActivityDetailOut)
def create_pbl_activity(
    data: PblActivityCreate,
    current_user: User = Depends(require_role([UserRole.FACULTY, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    pbl = PblActivity(
        title=data.title,
        description=data.description,
        subject_id=data.subject_id,
        academic_year_id=data.academic_year_id,
        semester_id=data.semester_id,
        department_id=data.department_id,
        start_date=data.start_date,
        end_date=data.end_date,
        status=data.status,
        topic_mode=data.topic_mode,
        allow_student_groups=data.allow_student_groups,
        require_group_approval=data.require_group_approval,
        created_by=current_user.id
    )
    db.add(pbl)
    db.flush()

    # Assign faculty members
    faculty_ids_to_assign = set(data.faculty_ids)
    if current_user.faculty_profile and current_user.faculty_profile.id not in faculty_ids_to_assign:
        faculty_ids_to_assign.add(current_user.faculty_profile.id)

    for fid in faculty_ids_to_assign:
        assoc = PblFaculty(pbl_activity_id=pbl.id, faculty_id=fid, role_description="Faculty Guide")
        db.add(assoc)

    # Create initial components if provided in PBL builder
    created_comps = []
    if data.initial_components:
        for c_data in data.initial_components:
            comp = Component(
                pbl_activity_id=pbl.id,
                component_type_id=c_data.component_type_id,
                title=c_data.title,
                description=c_data.description,
                deadline=c_data.deadline,
                submission_required=c_data.submission_required,
                external_submission_url=c_data.external_submission_url,
                external_classroom_url=c_data.external_classroom_url,
                external_resource_url=c_data.external_resource_url,
                is_group=c_data.is_group,
                created_by=current_user.id
            )
            db.add(comp)
            db.flush()

            if c_data.assignments:
                for a_data in c_data.assignments:
                    assignment = ComponentAssignment(
                        component_id=comp.id,
                        scope_type=a_data.scope_type,
                        target_id=a_data.target_id,
                        custom_description=a_data.custom_description
                    )
                    db.add(assignment)
            else:
                db.add(ComponentAssignment(
                    component_id=comp.id,
                    scope_type=AssignmentScope.ALL,
                    target_id=None
                ))
            created_comps.append(comp)

    db.commit()
    db.refresh(pbl)

    # Fetch created components for response
    comps_out = [
        ComponentOut(
            id=c.id,
            pbl_activity_id=c.pbl_activity_id,
            component_type_id=c.component_type_id,
            component_type_name=c.component_type.name if c.component_type else None,
            component_type_icon=c.component_type.icon if c.component_type else "FileText",
            title=c.title,
            description=c.description,
            deadline=c.deadline,
            submission_required=c.submission_required,
            external_submission_url=c.external_submission_url,
            external_classroom_url=c.external_classroom_url,
            external_resource_url=c.external_resource_url,
            is_group=c.is_group,
            created_at=c.created_at,
            assignments=[
                ComponentAssignmentOut(
                    id=a.id,
                    component_id=a.component_id,
                    scope_type=a.scope_type,
                    target_id=a.target_id
                )
                for a in c.assignments
            ]
        )
        for c in pbl.components
    ]

    return PblActivityDetailOut(
        id=pbl.id,
        title=pbl.title,
        description=pbl.description,
        subject_id=pbl.subject_id,
        academic_year_id=pbl.academic_year_id,
        semester_id=pbl.semester_id,
        department_id=pbl.department_id,
        start_date=pbl.start_date,
        end_date=pbl.end_date,
        status=pbl.status,
        topic_mode=pbl.topic_mode,
        allow_student_groups=pbl.allow_student_groups,
        require_group_approval=pbl.require_group_approval,
        subject_name=pbl.subject.name if pbl.subject else None,
        subject_code=pbl.subject.subject_code if pbl.subject else None,
        academic_year_name=pbl.academic_year.name if pbl.academic_year else None,
        semester_name=pbl.semester.name if pbl.semester else None,
        department_name=pbl.department.name if pbl.department else None,
        faculty_members=[
            FacultySimpleOut(
                id=assoc.faculty.id,
                name=assoc.faculty.name,
                email=assoc.faculty.email,
                role_description=assoc.role_description
            )
            for assoc in pbl.faculty_members if assoc.faculty
        ],
        component_count=len(comps_out),
        created_at=pbl.created_at,
        components=comps_out
    )


@router.get("/pbl/{pbl_id}", response_model=PblActivityDetailOut)
def get_pbl_activity_detail(
    pbl_id: int,
    current_user: User = Depends(require_role([UserRole.FACULTY, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    pbl = db.query(PblActivity).filter(PblActivity.id == pbl_id).first()
    if not pbl:
        raise HTTPException(status_code=404, detail="PBL Activity not found")

    # If faculty, ensure authorization to access this activity
    if current_user.role == UserRole.FACULTY and current_user.faculty_profile:
        assigned_faculty_ids = [assoc.faculty_id for assoc in pbl.faculty_members]
        faculty_dept_ids = [d.department_id for d in current_user.faculty_profile.departments]
        if current_user.faculty_profile.id not in assigned_faculty_ids and pbl.department_id not in faculty_dept_ids:
            raise HTTPException(status_code=403, detail="You are not authorized to view this department's PBL activity")

    active_comps = [c for c in pbl.components if not c.archived_at]

    comps_out = [
        ComponentOut(
            id=c.id,
            pbl_activity_id=c.pbl_activity_id,
            component_type_id=c.component_type_id,
            component_type_name=c.component_type.name if c.component_type else None,
            component_type_icon=c.component_type.icon if c.component_type else "FileText",
            title=c.title,
            description=c.description,
            deadline=c.deadline,
            submission_required=c.submission_required,
            external_submission_url=c.external_submission_url,
            external_classroom_url=c.external_classroom_url,
            external_resource_url=c.external_resource_url,
            is_group=c.is_group,
            created_at=c.created_at,
            assignments=[
                ComponentAssignmentOut(
                    id=a.id,
                    component_id=a.component_id,
                    scope_type=a.scope_type,
                    target_id=a.target_id,
                    custom_description=a.custom_description
                )
                for a in c.assignments
            ]
        )
        for c in active_comps
    ]

    return PblActivityDetailOut(
        id=pbl.id,
        title=pbl.title,
        description=pbl.description,
        subject_id=pbl.subject_id,
        academic_year_id=pbl.academic_year_id,
        semester_id=pbl.semester_id,
        department_id=pbl.department_id,
        start_date=pbl.start_date,
        end_date=pbl.end_date,
        status=pbl.status,
        topic_mode=pbl.topic_mode,
        allow_student_groups=pbl.allow_student_groups,
        require_group_approval=pbl.require_group_approval,
        subject_name=pbl.subject.name if pbl.subject else None,
        subject_code=pbl.subject.subject_code if pbl.subject else None,
        academic_year_name=pbl.academic_year.name if pbl.academic_year else None,
        semester_name=pbl.semester.name if pbl.semester else None,
        department_name=pbl.department.name if pbl.department else None,
        faculty_members=[
            FacultySimpleOut(
                id=assoc.faculty.id,
                name=assoc.faculty.name,
                email=assoc.faculty.email,
                role_description=assoc.role_description
            )
            for assoc in pbl.faculty_members if assoc.faculty
        ],
        component_count=len(comps_out),
        created_at=pbl.created_at,
        components=comps_out
    )


@router.post("/pbl/{pbl_id}/duplicate", response_model=PblActivityDetailOut)
def duplicate_pbl(
    pbl_id: int,
    req: PblDuplicateRequest,
    current_user: User = Depends(require_role([UserRole.FACULTY, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    try:
        new_pbl = duplicate_pbl_activity(db, pbl_id, req, current_user.id)
        return get_pbl_activity_detail(new_pbl.id, current_user, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/pbl/{pbl_id}/components", response_model=ComponentOut)
def add_pbl_component(
    pbl_id: int,
    data: ComponentCreate,
    current_user: User = Depends(require_role([UserRole.FACULTY, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    pbl = db.query(PblActivity).filter(PblActivity.id == pbl_id).first()
    if not pbl:
        raise HTTPException(status_code=404, detail="PBL activity not found")

    comp = Component(
        pbl_activity_id=pbl.id,
        component_type_id=data.component_type_id,
        title=data.title,
        description=data.description,
        deadline=data.deadline,
        submission_required=data.submission_required,
        external_submission_url=data.external_submission_url,
        external_classroom_url=data.external_classroom_url,
        external_resource_url=data.external_resource_url,
        is_group=data.is_group,
        created_by=current_user.id
    )
    db.add(comp)
    db.flush()

    if data.assignments:
        for a_data in data.assignments:
            db.add(ComponentAssignment(
                component_id=comp.id,
                scope_type=a_data.scope_type,
                target_id=a_data.target_id,
                custom_description=a_data.custom_description
            ))
    else:
        db.add(ComponentAssignment(
            component_id=comp.id,
            scope_type=AssignmentScope.ALL,
            target_id=None
        ))

    db.commit()
    db.refresh(comp)

    return ComponentOut(
        id=comp.id,
        pbl_activity_id=comp.pbl_activity_id,
        component_type_id=comp.component_type_id,
        component_type_name=comp.component_type.name if comp.component_type else None,
        component_type_icon=comp.component_type.icon if comp.component_type else "FileText",
        title=comp.title,
        description=comp.description,
        deadline=comp.deadline,
        submission_required=comp.submission_required,
        external_submission_url=comp.external_submission_url,
        external_classroom_url=comp.external_classroom_url,
        external_resource_url=comp.external_resource_url,
        is_group=comp.is_group,
        created_at=comp.created_at,
        assignments=[
            ComponentAssignmentOut(
                id=a.id,
                component_id=a.component_id,
                scope_type=a.scope_type,
                target_id=a.target_id
            )
            for a in comp.assignments
        ]
    )


@router.patch("/components/{component_id}", response_model=ComponentOut)
def update_component(
    component_id: int,
    data: ComponentUpdate,
    current_user: User = Depends(require_role([UserRole.FACULTY, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    comp = db.query(Component).filter(Component.id == component_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Component not found")

    for field, val in data.dict(exclude_unset=True).items():
        setattr(comp, field, val)

    db.commit()
    db.refresh(comp)

    return ComponentOut(
        id=comp.id,
        pbl_activity_id=comp.pbl_activity_id,
        component_type_id=comp.component_type_id,
        component_type_name=comp.component_type.name if comp.component_type else None,
        component_type_icon=comp.component_type.icon if comp.component_type else "FileText",
        title=comp.title,
        description=comp.description,
        deadline=comp.deadline,
        submission_required=comp.submission_required,
        external_submission_url=comp.external_submission_url,
        external_classroom_url=comp.external_classroom_url,
        external_resource_url=comp.external_resource_url,
        is_group=comp.is_group,
        created_at=comp.created_at,
        assignments=[
            ComponentAssignmentOut(
                id=a.id,
                component_id=a.component_id,
                scope_type=a.scope_type,
                target_id=a.target_id
            )
            for a in comp.assignments
        ]
    )


@router.patch("/components/{component_id}/assignments/{assignment_id}", response_model=ComponentAssignmentOut)
def update_component_assignment(
    component_id: int,
    assignment_id: int,
    data: ComponentAssignmentUpdate,
    current_user: User = Depends(require_role([UserRole.FACULTY, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    assignment = db.query(ComponentAssignment).filter(
        ComponentAssignment.id == assignment_id,
        ComponentAssignment.component_id == component_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Component assignment not found")

    assignment.custom_description = data.custom_description
    db.commit()
    db.refresh(assignment)
    return ComponentAssignmentOut(
        id=assignment.id,
        component_id=assignment.component_id,
        scope_type=assignment.scope_type,
        target_id=assignment.target_id,
        custom_description=assignment.custom_description
    )


@router.delete("/components/{component_id}")
def delete_component(
    component_id: int,
    current_user: User = Depends(require_role([UserRole.FACULTY, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    comp = db.query(Component).filter(Component.id == component_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Component not found")

    # If student submissions or progress records exist, soft-delete to preserve academic history
    if comp.progress_records or comp.faculty_reviews:
        comp.archived_at = datetime.now(timezone.utc)
        db.commit()
        return {"message": "Component archived successfully to preserve student records", "archived": True}

    db.delete(comp)
    db.commit()
    return {"message": "Component deleted successfully", "archived": False}


@router.get("/pbl/{pbl_id}/submissions")
def list_pbl_submissions(
    pbl_id: int,
    db: Session = Depends(get_db)
):
    """
    Returns submissions list for a given PBL activity with student info,
    submission state, external links, internal marks, and feedback.
    """
    pbl = db.query(PblActivity).filter(PblActivity.id == pbl_id).first()
    if not pbl:
        raise HTTPException(status_code=404, detail="PBL Activity not found")

    results = []
    for comp in pbl.components:
        for prog in comp.progress_records:
            student = prog.student
            review = (
                db.query(FacultyReview)
                .filter(FacultyReview.student_id == student.id, FacultyReview.component_id == comp.id)
                .first()
            )

            results.append({
                "component_id": comp.id,
                "component_title": comp.title,
                "student_id": student.id,
                "student_name": student.name,
                "enrollment_number": student.enrollment_number,
                "division_name": student.division.name if student.division else "",
                "submission_state": prog.submission_state.value,
                "progress_state": prog.progress_state.value,
                "submitted_at": prog.submitted_at,
                "internal_marks": review.internal_marks if review else None,
                "feedback": review.feedback if review else None,
                "is_rejected": review.is_rejected if review else False,
            })

    return results


@router.post("/reviews", response_model=FacultyReviewOut)
def review_submission(
    data: FacultyReviewCreate,
    faculty: Optional[Faculty] = Depends(get_current_faculty),
    current_user: User = Depends(require_role([UserRole.FACULTY, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    faculty_id = faculty.id if faculty else 1

    review = (
        db.query(FacultyReview)
        .filter(
            FacultyReview.student_id == data.student_id,
            FacultyReview.component_id == data.component_id
        )
        .first()
    )
    if not review:
        review = FacultyReview(
            student_id=data.student_id,
            component_id=data.component_id,
            faculty_id=faculty_id
        )
        db.add(review)

    review.internal_marks = data.internal_marks
    review.feedback = data.feedback
    review.is_rejected = data.is_rejected
    review.reviewed_at = datetime.now(timezone.utc)

    # Update student's submission state accordingly
    progress = (
        db.query(StudentComponentProgress)
        .filter(
            StudentComponentProgress.student_id == data.student_id,
            StudentComponentProgress.component_id == data.component_id
        )
        .first()
    )
    if progress:
        if data.is_rejected:
            progress.submission_state = SubmissionState.REJECTED
        elif progress.submission_state == SubmissionState.NOT_SUBMITTED:
            # If faculty reviews without rejection, can treat as accepted
            progress.submission_state = SubmissionState.SUBMITTED

    # Notify student
    student = db.query(Student).filter(Student.id == data.student_id).first()
    comp = db.query(Component).filter(Component.id == data.component_id).first()
    if student and comp:
        msg = f"Feedback on {comp.title}: {data.feedback or 'Reviewed by faculty'}"
        if data.is_rejected:
            msg = f"Submission for {comp.title} was rejected: {data.feedback or 'Please check instructions'}"
        create_notification(
            db=db,
            user_id=student.user_id,
            title="Faculty Feedback Received" if not data.is_rejected else "Submission Needs Attention",
            message=msg,
            link=f"/student/pbl/{comp.pbl_activity_id}"
        )

    db.commit()
    db.refresh(review)

    return FacultyReviewOut(
        id=review.id,
        student_id=review.student_id,
        student_name=review.student.name if review.student else "",
        enrollment_number=review.student.enrollment_number if review.student else "",
        component_id=review.component_id,
        component_title=review.component.title if review.component else "",
        faculty_id=review.faculty_id,
        faculty_name=review.faculty.name if review.faculty else "Faculty",
        internal_marks=review.internal_marks,
        feedback=review.feedback,
        is_rejected=review.is_rejected,
        reviewed_at=review.reviewed_at
    )


@router.get("/pbl/{pbl_id}/groups", response_model=List[GroupOut])
def get_pbl_groups(
    pbl_id: int,
    db: Session = Depends(get_db)
):
    groups = db.query(Group).filter(Group.pbl_activity_id == pbl_id).all()
    results = []
    for grp in groups:
        proj_out = None
        if grp.project:
            proj = grp.project
            proj_out = ProjectOut(
                id=proj.id,
                title=proj.title,
                topic=proj.topic,
                description=proj.description,
                guide_faculty_id=proj.guide_faculty_id,
                guide_faculty_name=proj.guide_faculty.name if proj.guide_faculty else None,
                status=proj.status,
                external_url=proj.external_url,
                pbl_activity_id=proj.pbl_activity_id,
                group_id=proj.group_id,
                created_at=proj.created_at
            )

        members_out = [
            GroupMemberOut(
                id=gm.id,
                student_id=gm.student_id,
                student_name=gm.student.name if gm.student else "",
                enrollment_number=gm.student.enrollment_number if gm.student else "",
                joined_at=gm.joined_at
            )
            for gm in grp.members
        ]

        results.append(GroupOut(
            id=grp.id,
            pbl_activity_id=grp.pbl_activity_id,
            pbl_title=grp.pbl_activity.title if grp.pbl_activity else "",
            component_id=grp.component_id,
            group_name=grp.group_name,
            group_code=grp.group_code,
            members=members_out,
            project=proj_out,
            created_at=grp.created_at
        ))
    return results


@router.post("/pbl/{pbl_id}/groups", response_model=GroupOut)
def create_group(
    pbl_id: int,
    data: GroupCreate,
    current_user: User = Depends(require_role([UserRole.FACULTY, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    pbl = db.query(PblActivity).filter(PblActivity.id == pbl_id).first()
    if not pbl:
        raise HTTPException(status_code=404, detail="PBL activity not found")

    grp = Group(
        pbl_activity_id=pbl_id,
        component_id=data.component_id,
        group_name=data.group_name,
        group_code=data.group_code,
        created_by=current_user.id
    )
    db.add(grp)
    db.flush()

    for sid in data.member_student_ids:
        db.add(GroupMember(group_id=grp.id, student_id=sid))

    db.commit()
    db.refresh(grp)

    members_out = [
        GroupMemberOut(
            id=gm.id,
            student_id=gm.student_id,
            student_name=gm.student.name if gm.student else "",
            enrollment_number=gm.student.enrollment_number if gm.student else "",
            joined_at=gm.joined_at
        )
        for gm in grp.members
    ]

    return GroupOut(
        id=grp.id,
        pbl_activity_id=grp.pbl_activity_id,
        pbl_title=pbl.title,
        component_id=grp.component_id,
        group_name=grp.group_name,
        group_code=grp.group_code,
        members=members_out,
        created_at=grp.created_at
    )


@router.get("/pbl/{pbl_id}/topics", response_model=List[TopicOut])
def get_pbl_topics(
    pbl_id: int,
    db: Session = Depends(get_db)
):
    topics = db.query(Topic).filter(Topic.pbl_activity_id == pbl_id).all()
    results = []
    for t in topics:
        hist_out = [
            TopicHistoryOut(
                id=h.id,
                action=h.action,
                changed_by_name=h.changed_by_user.username if h.changed_by_user else "System",
                comment=h.comment,
                created_at=h.created_at
            )
            for h in t.history
        ]
        results.append(TopicOut(
            id=t.id,
            pbl_activity_id=t.pbl_activity_id,
            pbl_title=t.pbl_activity.title if t.pbl_activity else "",
            title=t.title,
            description=t.description,
            mode=t.mode,
            status=t.status,
            proposed_by_student_id=t.proposed_by_student_id,
            proposed_by_student_name=t.proposed_by_student.name if t.proposed_by_student else None,
            assigned_to_group_id=t.assigned_to_group_id,
            assigned_to_group_name=t.assigned_to_group.group_name if t.assigned_to_group else None,
            assigned_to_student_id=t.assigned_to_student_id,
            rejection_reason=t.rejection_reason,
            history=hist_out,
            created_at=t.created_at
        ))
    return results


@router.patch("/topics/{topic_id}/reject", response_model=TopicOut)
def reject_topic(
    topic_id: int,
    data: TopicRejectRequest,
    current_user: User = Depends(require_role([UserRole.FACULTY, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    topic.status = TopicStatus.REJECTED
    topic.rejection_reason = data.reason

    hist = TopicHistory(
        topic_id=topic.id,
        action="REJECTED_BY_FACULTY",
        changed_by_user_id=current_user.id,
        comment=data.reason
    )
    db.add(hist)

    # Notify student
    if topic.proposed_by_student:
        create_notification(
            db=db,
            user_id=topic.proposed_by_student.user_id,
            title=f"Topic Proposal Rejected: {topic.title}",
            message=f"Reason: {data.reason}",
            link=f"/student/pbl/{topic.pbl_activity_id}"
        )

    db.commit()
    db.refresh(topic)

    hist_out = [
        TopicHistoryOut(
            id=h.id,
            action=h.action,
            changed_by_name=h.changed_by_user.username if h.changed_by_user else "Faculty",
            comment=h.comment,
            created_at=h.created_at
        )
        for h in topic.history
    ]

    return TopicOut(
        id=topic.id,
        pbl_activity_id=topic.pbl_activity_id,
        pbl_title=topic.pbl_activity.title if topic.pbl_activity else "",
        title=topic.title,
        description=topic.description,
        mode=topic.mode,
        status=topic.status,
        proposed_by_student_id=topic.proposed_by_student_id,
        proposed_by_student_name=topic.proposed_by_student.name if topic.proposed_by_student else None,
        assigned_to_group_id=topic.assigned_to_group_id,
        assigned_to_group_name=topic.assigned_to_group.group_name if topic.assigned_to_group else None,
        assigned_to_student_id=topic.assigned_to_student_id,
        rejection_reason=topic.rejection_reason,
        history=hist_out,
        created_at=topic.created_at
    )


@router.patch("/topics/{topic_id}/approve", response_model=TopicOut)
def approve_topic(
    topic_id: int,
    current_user: User = Depends(require_role([UserRole.FACULTY, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    topic.status = TopicStatus.APPROVED
    topic.rejection_reason = None

    hist = TopicHistory(
        topic_id=topic.id,
        action="APPROVED_BY_FACULTY",
        changed_by_user_id=current_user.id,
        comment="Topic approved by faculty"
    )
    db.add(hist)

    if topic.proposed_by_student:
        create_notification(
            db=db,
            user_id=topic.proposed_by_student.user_id,
            title=f"Topic Approved: {topic.title}",
            message="Your proposed topic has been approved by faculty.",
            link=f"/student/pbl/{topic.pbl_activity_id}"
        )

    db.commit()
    db.refresh(topic)

    hist_out = [
        TopicHistoryOut(
            id=h.id,
            action=h.action,
            changed_by_name=h.changed_by_user.username if h.changed_by_user else "Faculty",
            comment=h.comment,
            created_at=h.created_at
        )
        for h in topic.history
    ]

    return TopicOut(
        id=topic.id,
        pbl_activity_id=topic.pbl_activity_id,
        pbl_title=topic.pbl_activity.title if topic.pbl_activity else "",
        title=topic.title,
        description=topic.description,
        mode=topic.mode,
        status=topic.status,
        proposed_by_student_id=topic.proposed_by_student_id,
        proposed_by_student_name=topic.proposed_by_student.name if topic.proposed_by_student else None,
        assigned_to_group_id=topic.assigned_to_group_id,
        assigned_to_group_name=topic.assigned_to_group.group_name if topic.assigned_to_group else None,
        assigned_to_student_id=topic.assigned_to_student_id,
        rejection_reason=topic.rejection_reason,
        history=hist_out,
        created_at=topic.created_at
    )


@router.post("/pbl/{pbl_id}/topics", response_model=TopicOut)
def create_pbl_topic(
    pbl_id: int,
    data: TopicCreate,
    current_user: User = Depends(require_role([UserRole.FACULTY, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    pbl = db.query(PblActivity).filter(PblActivity.id == pbl_id).first()
    if not pbl:
        raise HTTPException(status_code=404, detail="PBL activity not found")

    topic = Topic(
        pbl_activity_id=pbl.id,
        title=data.title,
        description=data.description,
        mode=data.mode or pbl.topic_mode,
        status=TopicStatus.APPROVED,
        assigned_to_group_id=data.assigned_to_group_id,
        assigned_to_student_id=data.assigned_to_student_id
    )
    db.add(topic)
    db.flush()

    hist = TopicHistory(
        topic_id=topic.id,
        action="CREATED_BY_FACULTY",
        changed_by_user_id=current_user.id,
        comment="Topic added to pool by faculty"
    )
    db.add(hist)
    db.commit()
    db.refresh(topic)

    return TopicOut(
        id=topic.id,
        pbl_activity_id=topic.pbl_activity_id,
        pbl_title=pbl.title,
        title=topic.title,
        description=topic.description,
        mode=topic.mode,
        status=topic.status,
        assigned_to_group_id=topic.assigned_to_group_id,
        assigned_to_group_name=topic.assigned_to_group.group_name if topic.assigned_to_group else None,
        assigned_to_student_id=topic.assigned_to_student_id,
        history=[
            TopicHistoryOut(
                id=hist.id,
                action=hist.action,
                changed_by_name=current_user.username,
                comment=hist.comment,
                created_at=hist.created_at
            )
        ],
        created_at=topic.created_at
    )


@router.patch("/topics/{topic_id}/assign", response_model=TopicOut)
def assign_topic(
    topic_id: int,
    payload: Dict[str, Any] = Body(...),
    current_user: User = Depends(require_role([UserRole.FACULTY, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    group_id = payload.get("group_id")
    student_id = payload.get("student_id")
    if group_id is not None:
        topic.assigned_to_group_id = group_id
    if student_id is not None:
        topic.assigned_to_student_id = student_id

    hist = TopicHistory(
        topic_id=topic.id,
        action="ASSIGNED_BY_FACULTY",
        changed_by_user_id=current_user.id,
        comment=f"Topic assigned to group {group_id} / student {student_id}"
    )
    db.add(hist)
    db.commit()
    db.refresh(topic)

    hist_out = [
        TopicHistoryOut(
            id=h.id,
            action=h.action,
            changed_by_name=h.changed_by_user.username if h.changed_by_user else "Faculty",
            comment=h.comment,
            created_at=h.created_at
        )
        for h in topic.history
    ]

    return TopicOut(
        id=topic.id,
        pbl_activity_id=topic.pbl_activity_id,
        pbl_title=topic.pbl_activity.title if topic.pbl_activity else "",
        title=topic.title,
        description=topic.description,
        mode=topic.mode,
        status=topic.status,
        proposed_by_student_id=topic.proposed_by_student_id,
        proposed_by_student_name=topic.proposed_by_student.name if topic.proposed_by_student else None,
        assigned_to_group_id=topic.assigned_to_group_id,
        assigned_to_group_name=topic.assigned_to_group.group_name if topic.assigned_to_group else None,
        assigned_to_student_id=topic.assigned_to_student_id,
        rejection_reason=topic.rejection_reason,
        history=hist_out,
        created_at=topic.created_at
    )


@router.post("/students/import-preview")
async def preview_student_import(
    department_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    content = await file.read()
    csv_text = content.decode("utf-8", errors="replace")
    return parse_and_validate_student_csv(db, csv_text, department_id)


@router.post("/students/import-execute")
def execute_student_import_action(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    valid_rows = payload.get("valid_rows", [])
    if not valid_rows:
        raise HTTPException(status_code=400, detail="No valid rows to import")
    return execute_student_import(db, valid_rows)


@router.get("/students", response_model=List[StudentOut])
def list_faculty_students(
    department_id: Optional[int] = None,
    semester_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Student)
    if department_id:
        query = query.filter(Student.department_id == department_id)
    if semester_id:
        query = query.filter(Student.semester_id == semester_id)
    students = query.all()
    return [
        StudentOut(
            id=s.id,
            user_id=s.user_id,
            enrollment_number=s.enrollment_number,
            name=s.name,
            email=s.email,
            phone_number=s.phone_number,
            department_id=s.department_id,
            semester_id=s.semester_id,
            division_id=s.division_id,
            department_name=s.department.name if s.department else None,
            semester_name=s.semester.name if s.semester else None,
            division_name=s.division.name if s.division else None,
            created_at=s.created_at
        )
        for s in students
    ]


@router.post("/students", response_model=StudentOut)
def create_faculty_student(
    payload: StudentCreate,
    db: Session = Depends(get_db)
):
    from app.services.auth_service import hash_password
    existing_user = db.query(User).filter(User.username == payload.enrollment_number).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Student with this enrollment already exists")
    user = User(
        username=payload.enrollment_number,
        password_hash=hash_password(payload.password or "Student@123"),
        role=UserRole.STUDENT,
        is_active=True
    )
    db.add(user)
    db.flush()
    student = Student(
        user_id=user.id,
        enrollment_number=payload.enrollment_number,
        name=payload.name,
        email=payload.email,
        phone_number=payload.phone_number,
        department_id=payload.department_id,
        semester_id=payload.semester_id,
        division_id=payload.division_id
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return StudentOut(
        id=student.id,
        user_id=student.user_id,
        enrollment_number=student.enrollment_number,
        name=student.name,
        email=student.email,
        phone_number=student.phone_number,
        department_id=student.department_id,
        semester_id=student.semester_id,
        division_id=student.division_id,
        department_name=student.department.name if student.department else None,
        semester_name=student.semester.name if student.semester else None,
        division_name=student.division.name if student.division else None,
        created_at=student.created_at
    )


@router.get("/analytics")
def get_faculty_analytics(
    faculty: Optional[Faculty] = Depends(get_current_faculty),
    db: Session = Depends(get_db)
):
    query = db.query(PblActivity)
    if faculty:
        query = query.join(PblFaculty, PblFaculty.pbl_activity_id == PblActivity.id).filter(
            PblFaculty.faculty_id == faculty.id
        )
    pbls = query.all()

    subject_data = []
    for p in pbls:
        comp_ids = [c.id for c in p.components]
        total_records = (
            db.query(StudentComponentProgress)
            .filter(StudentComponentProgress.component_id.in_(comp_ids))
            .count() if comp_ids else 0
        )
        completed_records = (
            db.query(StudentComponentProgress)
            .filter(
                StudentComponentProgress.component_id.in_(comp_ids),
                StudentComponentProgress.progress_state == ProgressState.DONE
            )
            .count() if comp_ids else 0
        )
        rate = int((completed_records / total_records * 100)) if total_records > 0 else 0

        subject_data.append({
            "name": p.subject.name if p.subject else p.title,
            "completionRate": rate,
            "totalComponents": len(p.components),
            "studentsTracked": total_records
        })

    return {
        "subjects": subject_data,
    }
