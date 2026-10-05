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
    PblStatus,
)
from app.models.group import Group, GroupMember, Project
from app.models.progress import StudentComponentProgress, SubmissionState, ProgressState
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
)
from app.schemas.group import GroupCreate, GroupOut, GroupMemberOut, ProjectOut
from app.schemas.progress import FacultyReviewCreate, FacultyReviewOut
from app.schemas.user import StudentOut, StudentCreate, FacultyOut, FacultyProfileUpdate
from app.services.pbl_service import duplicate_pbl_activity
from app.services.notification_service import (
    create_notification,
    notify_students_new_pbl,
    notify_students_new_component,
    notify_students_updated_component,
    notify_students_pbl_updated,
)
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

    # Submissions needing review: status SUBMITTED
    pending_submissions = (
        db.query(StudentComponentProgress)
        .join(Component, StudentComponentProgress.component_id == Component.id)
        .filter(
            Component.pbl_activity_id.in_(pbl_ids),
            StudentComponentProgress.submission_state == SubmissionState.SUBMITTED
        )
        .count() if pbl_ids else 0
    )

    pending_topics = 0

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


@router.patch("/me/profile", response_model=FacultyOut)
def update_faculty_profile(
    data: FacultyProfileUpdate,
    faculty: Optional[Faculty] = Depends(get_current_faculty),
    current_user: User = Depends(require_role([UserRole.FACULTY, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    target_faculty = faculty
    if not target_faculty and current_user.faculty_profile:
        target_faculty = current_user.faculty_profile
    if not target_faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")

    if data.name is not None and data.name.strip():
        target_faculty.name = data.name.strip()
    if data.email is not None:
        target_faculty.email = data.email.strip()
    if data.phone is not None:
        target_faculty.phone = data.phone.strip()
    if data.faculty_code is not None:
        target_faculty.faculty_code = data.faculty_code.strip()

    db.commit()
    db.refresh(target_faculty)
    return FacultyOut(
        id=target_faculty.id,
        user_id=target_faculty.user_id,
        faculty_code=target_faculty.faculty_code,
        name=target_faculty.name,
        email=target_faculty.email,
        phone=target_faculty.phone,
        username=target_faculty.user.username if target_faculty.user else "",
        created_at=target_faculty.created_at
    )


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
            created_comps.append(comp)

    db.commit()
    db.refresh(pbl)

    # Automatically notify all students in the enrolled department and semester only if published (ACTIVE)
    if pbl.status == PblStatus.ACTIVE:
        notify_students_new_pbl(db, pbl)

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
        faculty_dept_ids = [current_user.faculty_profile.department_id] if current_user.faculty_profile.department_id else []
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


@router.patch("/pbl/{pbl_id}", response_model=PblActivityDetailOut)
def update_pbl_activity(
    pbl_id: int,
    data: PblActivityUpdate,
    current_user: User = Depends(require_role([UserRole.FACULTY, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    pbl = db.query(PblActivity).filter(PblActivity.id == pbl_id).first()
    if not pbl:
        raise HTTPException(status_code=404, detail="PBL Activity not found")

    # If faculty, check department or assignment authorization
    if current_user.role == UserRole.FACULTY and current_user.faculty_profile:
        assigned_faculty_ids = [assoc.faculty_id for assoc in pbl.faculty_members]
        faculty_dept_ids = [current_user.faculty_profile.department_id] if current_user.faculty_profile.department_id else []
        if current_user.faculty_profile.id not in assigned_faculty_ids and pbl.department_id not in faculty_dept_ids:
            raise HTTPException(status_code=403, detail="You are not authorized to update this PBL activity")

    old_status = pbl.status
    update_dict = data.model_dump(exclude_unset=True)

    # Handle faculty assignment updates if provided
    if "faculty_ids" in update_dict and update_dict["faculty_ids"] is not None:
        new_fac_ids = set(update_dict.pop("faculty_ids"))
        db.query(PblFaculty).filter(PblFaculty.pbl_activity_id == pbl.id).delete()
        for fid in new_fac_ids:
            db.add(PblFaculty(pbl_activity_id=pbl.id, faculty_id=fid, role_description="Faculty Guide"))

    for field, val in update_dict.items():
        setattr(pbl, field, val)

    db.commit()
    db.refresh(pbl)

    new_status = pbl.status

    # Notification logic:
    # 1. Transition DRAFT -> ACTIVE: Faculty has published the activity! Notify students.
    if old_status == PblStatus.DRAFT and new_status == PblStatus.ACTIVE:
        notify_students_new_pbl(db, pbl)
    # 2. Activity was already ACTIVE and remains ACTIVE: If details changed, notify students of updates.
    elif old_status == PblStatus.ACTIVE and new_status == PblStatus.ACTIVE:
        if any(f in update_dict for f in ["title", "description", "start_date", "end_date"]):
            notify_students_pbl_updated(db, pbl)
    # 3. If in DRAFT or transitioned to DRAFT: Activity is hidden. Do not notify students.

    return get_pbl_activity_detail(pbl.id, current_user, db)


@router.post("/pbl/{pbl_id}/duplicate", response_model=PblActivityDetailOut)
def duplicate_pbl(
    pbl_id: int,
    req: PblDuplicateRequest,
    current_user: User = Depends(require_role([UserRole.FACULTY, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    try:
        new_pbl = duplicate_pbl_activity(db, pbl_id, req, current_user.id)
        notify_students_new_pbl(db, new_pbl)
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
    db.commit()
    db.refresh(comp)

    # Notify students assigned to this component only if parent PBL is ACTIVE (published)
    if pbl.status == PblStatus.ACTIVE:
        notify_students_new_component(db, comp, pbl)

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

    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(comp, field, val)

    db.commit()
    db.refresh(comp)

    # Only notify students if parent PBL activity is ACTIVE (published)
    if comp.pbl_activity and comp.pbl_activity.status == PblStatus.ACTIVE:
        notify_students_updated_component(db, comp, comp.pbl_activity)

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
    if comp.progress_records:
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
            is_rejected = (prog.submission_state == SubmissionState.REJECTED)
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
                "status": prog.submission_state.value,
                "feedback": prog.faculty_feedback,
                "is_rejected": is_rejected,
                "reviewed_at": prog.reviewed_at,
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

    progress = (
        db.query(StudentComponentProgress)
        .filter(
            StudentComponentProgress.student_id == data.student_id,
            StudentComponentProgress.component_id == data.component_id
        )
        .first()
    )
    if not progress:
        progress = StudentComponentProgress(
            student_id=data.student_id,
            component_id=data.component_id,
            progress_state=ProgressState.IN_PROGRESS,
            submission_state=SubmissionState.NOT_SUBMITTED
        )
        db.add(progress)

    is_rejected = data.is_rejected or (data.status and data.status.upper() == "REJECTED")
    now_utc = datetime.now(timezone.utc)

    if is_rejected:
        progress.submission_state = SubmissionState.REJECTED
        progress.progress_state = ProgressState.IN_PROGRESS
    else:
        progress.submission_state = SubmissionState.ACCEPTED
        progress.progress_state = ProgressState.DONE

    progress.faculty_feedback = data.feedback
    progress.reviewed_by_faculty_id = faculty_id
    progress.reviewed_at = now_utc

    # Notify student
    student = db.query(Student).filter(Student.id == data.student_id).first()
    comp = db.query(Component).filter(Component.id == data.component_id).first()
    fac_obj = db.query(Faculty).filter(Faculty.id == faculty_id).first()

    if student and comp:
        if is_rejected:
            msg = f"Submission for {comp.title} was rejected: {data.feedback or 'Please check instructions and resubmit'}"
            title = "Submission Needs Attention"
        else:
            msg = f"Submission for {comp.title} was accepted! {data.feedback or 'Good job!'}"
            title = "Submission Accepted"

        create_notification(
            db=db,
            user_id=student.user_id,
            title=title,
            message=msg,
            link=f"/student/pbl/{comp.pbl_activity_id}"
        )

    db.commit()
    db.refresh(progress)

    return FacultyReviewOut(
        id=progress.id,
        student_id=progress.student_id,
        student_name=student.name if student else "",
        enrollment_number=student.enrollment_number if student else "",
        component_id=progress.component_id,
        component_title=comp.title if comp else "",
        faculty_id=faculty_id,
        faculty_name=fac_obj.name if fac_obj else "Faculty Guide",
        status="REJECTED" if is_rejected else "ACCEPTED",
        is_rejected=is_rejected,
        feedback=progress.faculty_feedback,
        reviewed_at=progress.reviewed_at or now_utc
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
