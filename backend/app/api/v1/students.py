from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_student, require_role
from app.models.user import Student, UserRole
from app.models.pbl import PblActivity, Component, PblStatus, TopicMode
from app.models.group import Group, GroupMember, Project
from app.models.topic import Topic, TopicHistory, TopicStatus
from app.models.progress import StudentComponentProgress, ProgressState, SubmissionState
from app.models.notification import Notification
from app.schemas.user import StudentOut, StudentProfileUpdate
from app.schemas.progress import (
    StudentDashboardOut,
    SubjectPblSummary,
    StudentProgressUpdate,
    StudentSubmissionToggle,
)
from app.schemas.pbl import ComponentOut, PblActivityOut, PblActivityDetailOut, FacultySimpleOut
from app.schemas.group import GroupCreate, GroupOut, GroupMemberOut, ProjectOut
from app.schemas.topic import TopicOut, TopicPropose, TopicHistoryOut
from app.schemas.notification import NotificationOut
from app.services.assignment_service import (
    get_assigned_components_for_student,
    get_student_group_ids,
    enrich_component_for_student,
    get_or_create_progress,
    is_component_assigned_to_student,
)

router = APIRouter(prefix="/students", tags=["Student"])


@router.get("/me/dashboard", response_model=StudentDashboardOut)
def get_student_dashboard(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    assigned_comps = get_assigned_components_for_student(db, student)

    # Filter by deadline state
    completed_items = [c for c in assigned_comps if c.deadline_state == "COMPLETED"]
    overdue_items = [c for c in assigned_comps if c.deadline_state == "OVERDUE"]
    upcoming_items = [c for c in assigned_comps if c.deadline_state in ("UPCOMING", "DUE_SOON", "DUE_TODAY")]
    
    # Sort upcoming by nearest deadline
    upcoming_items.sort(key=lambda x: x.deadline)
    overdue_items.sort(key=lambda x: x.deadline)

    total_comps = len(assigned_comps)
    completed_count = len(completed_items)
    pending_count = total_comps - completed_count
    overall_percentage = int((completed_count / total_comps * 100)) if total_comps > 0 else 0

    # Get active PBLs for subject summary
    active_pbls = (
        db.query(PblActivity)
        .filter(
            PblActivity.department_id == student.department_id,
            PblActivity.semester_id == student.semester_id,
            PblActivity.status == PblStatus.ACTIVE
        )
        .all()
    )

    subject_summaries: List[SubjectPblSummary] = []
    for pbl in active_pbls:
        pbl_comps = [c for c in assigned_comps if c.pbl_activity_id == pbl.id]
        pbl_completed = [c for c in pbl_comps if c.deadline_state == "COMPLETED"]
        comp_count = len(pbl_comps)
        comp_done = len(pbl_completed)
        percentage = int((comp_done / comp_count * 100)) if comp_count > 0 else 0
        faculty_names = [assoc.faculty.name for assoc in pbl.faculty_members if assoc.faculty]

        subject_summaries.append(SubjectPblSummary(
            pbl_id=pbl.id,
            subject_id=pbl.subject_id,
            subject_name=pbl.subject.name if pbl.subject else "Subject",
            subject_code=pbl.subject.subject_code if pbl.subject else "CODE",
            completed_components=comp_done,
            total_components=comp_count,
            percentage=percentage,
            faculty_names=faculty_names
        ))

    # Recent notifications for this user
    recent_notifs = (
        db.query(Notification)
        .filter(Notification.user_id == student.user_id)
        .order_by(Notification.created_at.desc())
        .limit(5)
        .all()
    )

    return StudentDashboardOut(
        student_name=student.name,
        enrollment_number=student.enrollment_number,
        email=student.email,
        phone_number=student.phone_number,
        department_name=student.department.name if student.department else "",
        semester_name=student.semester.name if student.semester else "",
        division_name=student.division.name if student.division else "",
        overall_progress_percentage=overall_percentage,
        active_pbl_count=len(active_pbls),
        total_components_count=total_comps,
        completed_count=completed_count,
        pending_count=pending_count,
        upcoming_count=len(upcoming_items),
        upcoming_deadlines=upcoming_items[:8],
        overdue_items=overdue_items,
        subject_summaries=subject_summaries,
        recent_notifications=[NotificationOut.from_orm(n) for n in recent_notifs]
    )


@router.get("/me/pbl", response_model=List[PblActivityOut])
def get_student_pbl_activities(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    pbls = (
        db.query(PblActivity)
        .filter(
            PblActivity.department_id == student.department_id,
            PblActivity.semester_id == student.semester_id,
            PblActivity.status == PblStatus.ACTIVE
        )
        .all()
    )
    result = []
    for p in pbls:
        out = PblActivityOut(
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
        )
        result.append(out)
    return result


@router.get("/me/pbl/{pbl_id}", response_model=PblActivityDetailOut)
def get_student_pbl_detail(
    pbl_id: int,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    pbl = (
        db.query(PblActivity)
        .filter(
            PblActivity.id == pbl_id,
            PblActivity.department_id == student.department_id,
            PblActivity.semester_id == student.semester_id
        )
        .first()
    )
    if not pbl:
        raise HTTPException(status_code=404, detail="PBL activity not found or access denied")

    comps = get_assigned_components_for_student(db, student, pbl_activity_id=pbl.id)

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
        component_count=len(comps),
        created_at=pbl.created_at,
        components=comps
    )


@router.patch("/me/components/{component_id}/progress")
def update_student_component_progress(
    component_id: int,
    data: StudentProgressUpdate,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    comp = db.query(Component).filter(Component.id == component_id).first()
    if not comp or comp.pbl_activity.department_id != student.department_id or comp.pbl_activity.semester_id != student.semester_id:
        raise HTTPException(status_code=404, detail="Component not found or access denied")

    student_group_ids = get_student_group_ids(db, student.id, comp.pbl_activity_id)
    if not is_component_assigned_to_student(comp, student, student_group_ids):
        raise HTTPException(status_code=403, detail="This component is not assigned to your group or division")

    progress = get_or_create_progress(db, student.id, component_id)
    progress.progress_state = data.progress_state
    db.commit()
    return {"message": "Progress updated", "progress_state": progress.progress_state.value}


@router.patch("/me/components/{component_id}/submission")
def update_student_component_submission(
    component_id: int,
    data: StudentSubmissionToggle,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    comp = db.query(Component).filter(Component.id == component_id).first()
    if not comp or comp.pbl_activity.department_id != student.department_id or comp.pbl_activity.semester_id != student.semester_id:
        raise HTTPException(status_code=404, detail="Component not found or access denied")

    student_group_ids = get_student_group_ids(db, student.id, comp.pbl_activity_id)
    if not is_component_assigned_to_student(comp, student, student_group_ids):
        raise HTTPException(status_code=403, detail="This component is not assigned to your group or division")

    progress = get_or_create_progress(db, student.id, component_id)

    # Spec: Students must NOT be able to resubmit through the platform after rejection!
    if progress.submission_state == SubmissionState.REJECTED:
        raise HTTPException(
            status_code=400,
            detail="Item was rejected by faculty. Submissions cannot be resubmitted through the platform. Please contact your faculty guide."
        )

    # Spec: Students must NOT be able to reset or revert a submission once submitted!
    if progress.submission_state == SubmissionState.SUBMITTED:
        if data.submission_state != SubmissionState.SUBMITTED:
            raise HTTPException(
                status_code=400,
                detail="Deliverable has already been submitted. Students cannot reset or revert a submitted deliverable."
            )
        return {"message": "Deliverable already submitted", "submission_state": progress.submission_state.value}

    # Only allow transitioning from NOT_SUBMITTED -> SUBMITTED
    if data.submission_state != SubmissionState.SUBMITTED:
        raise HTTPException(
            status_code=400,
            detail="Students can only submit deliverables. Reverting to NOT_SUBMITTED is not permitted."
        )

    progress.submission_state = data.submission_state
    if not progress.submitted_at:
        progress.submitted_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Submission status updated", "submission_state": progress.submission_state.value}


@router.get("/me/groups", response_model=List[GroupOut])
def get_student_groups(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    memberships = (
        db.query(GroupMember)
        .filter(GroupMember.student_id == student.id)
        .all()
    )
    result = []
    for m in memberships:
        grp = m.group
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

        result.append(GroupOut(
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
    return result


@router.post("/me/topics/propose", response_model=TopicOut)
def propose_topic(
    data: TopicPropose,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    pbl = db.query(PblActivity).filter(PblActivity.id == data.pbl_activity_id).first()
    if not pbl:
        raise HTTPException(status_code=404, detail="PBL activity not found")

    # Spec: Student-proposed topic starts as APPROVED unless faculty rejects it!
    topic = Topic(
        pbl_activity_id=data.pbl_activity_id,
        title=data.title,
        description=data.description,
        mode=TopicMode.STUDENT_PROPOSED,
        status=TopicStatus.APPROVED,
        proposed_by_student_id=student.id,
        assigned_to_group_id=data.group_id,
        assigned_to_student_id=student.id if not data.group_id else None
    )
    db.add(topic)
    db.flush()

    # Add history log
    history = TopicHistory(
        topic_id=topic.id,
        action="PROPOSED_AND_AUTO_APPROVED",
        changed_by_user_id=student.user_id,
        comment="Topic proposed by student and automatically set to Approved per platform rules."
    )
    db.add(history)
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
        proposed_by_student_id=student.id,
        proposed_by_student_name=student.name,
        assigned_to_group_id=topic.assigned_to_group_id,
        assigned_to_student_id=topic.assigned_to_student_id,
        created_at=topic.created_at,
        history=[
            TopicHistoryOut(
                id=history.id,
                action=history.action,
                changed_by_name=student.name,
                comment=history.comment,
                created_at=history.created_at
            )
        ]
    )


@router.post("/me/pbl/{pbl_id}/groups", response_model=GroupOut)
def create_student_group(
    pbl_id: int,
    data: GroupCreate,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    pbl = db.query(PblActivity).filter(PblActivity.id == pbl_id).first()
    if not pbl or pbl.department_id != student.department_id or pbl.semester_id != student.semester_id:
        raise HTTPException(status_code=404, detail="PBL activity not found or access denied")

    if not pbl.allow_student_groups:
        raise HTTPException(status_code=403, detail="Student group creation is disabled for this PBL activity")

    existing_grp_ids = get_student_group_ids(db, student.id, pbl.id)
    if existing_grp_ids:
        raise HTTPException(status_code=400, detail="You are already in a group for this PBL activity")

    import uuid
    code = f"GRP-{pbl.id}-{uuid.uuid4().hex[:5].upper()}"
    group = Group(
        pbl_activity_id=pbl.id,
        group_name=data.group_name,
        group_code=code,
        created_by=student.user_id
    )
    db.add(group)
    db.flush()

    member = GroupMember(group_id=group.id, student_id=student.id)
    db.add(member)
    db.commit()
    db.refresh(group)

    return GroupOut(
        id=group.id,
        pbl_activity_id=group.pbl_activity_id,
        pbl_title=pbl.title,
        group_name=group.group_name,
        group_code=group.group_code,
        members=[
            GroupMemberOut(
                id=member.id,
                student_id=student.id,
                student_name=student.name,
                enrollment_number=student.enrollment_number,
                joined_at=member.joined_at
            )
        ],
        created_at=group.created_at
    )


@router.post("/me/groups/join", response_model=GroupOut)
def join_student_group(
    payload: Dict[str, str] = Body(...),
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    group_code = payload.get("group_code", "").strip()
    if not group_code:
        raise HTTPException(status_code=400, detail="Group code is required")

    group = db.query(Group).filter(Group.group_code == group_code).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group code not found")

    pbl = group.pbl_activity
    if pbl.department_id != student.department_id or pbl.semester_id != student.semester_id:
        raise HTTPException(status_code=403, detail="Group belongs to a different department or semester")

    if not pbl.allow_student_groups:
        raise HTTPException(status_code=403, detail="Student self-grouping is disabled for this PBL activity")

    existing_grp_ids = get_student_group_ids(db, student.id, pbl.id)
    if existing_grp_ids:
        raise HTTPException(status_code=400, detail="You are already in a group for this PBL activity")

    member = GroupMember(group_id=group.id, student_id=student.id)
    db.add(member)
    db.commit()
    db.refresh(group)

    return GroupOut(
        id=group.id,
        pbl_activity_id=group.pbl_activity_id,
        pbl_title=pbl.title,
        group_name=group.group_name,
        group_code=group.group_code,
        members=[
            GroupMemberOut(
                id=m.id,
                student_id=m.student_id,
                student_name=m.student.name if m.student else "",
                enrollment_number=m.student.enrollment_number if m.student else "",
                joined_at=m.joined_at
            )
            for m in group.members
        ],
        created_at=group.created_at
    )


@router.get("/me/pbl/{pbl_id}/available-topics", response_model=List[TopicOut])
def get_available_topics_for_pbl(
    pbl_id: int,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    pbl = db.query(PblActivity).filter(PblActivity.id == pbl_id).first()
    if not pbl or pbl.department_id != student.department_id or pbl.semester_id != student.semester_id:
        raise HTTPException(status_code=404, detail="PBL activity not found or access denied")

    topics = db.query(Topic).filter(
        Topic.pbl_activity_id == pbl_id,
        Topic.mode == TopicMode.STUDENT_LIST
    ).all()

    results = []
    for t in topics:
        results.append(TopicOut(
            id=t.id,
            pbl_activity_id=t.pbl_activity_id,
            pbl_title=pbl.title,
            title=t.title,
            description=t.description,
            mode=t.mode,
            status=t.status,
            assigned_to_group_id=t.assigned_to_group_id,
            assigned_to_group_name=t.assigned_to_group.group_name if t.assigned_to_group else None,
            assigned_to_student_id=t.assigned_to_student_id,
            created_at=t.created_at
        ))
    return results


@router.post("/me/pbl/{pbl_id}/topics/{topic_id}/select", response_model=TopicOut)
def select_topic_from_pool(
    pbl_id: int,
    topic_id: int,
    payload: Dict[str, Any] = Body(default={}),
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    pbl = db.query(PblActivity).filter(PblActivity.id == pbl_id).first()
    if not pbl or pbl.department_id != student.department_id or pbl.semester_id != student.semester_id:
        raise HTTPException(status_code=404, detail="PBL activity not found or access denied")

    topic = db.query(Topic).filter(
        Topic.id == topic_id,
        Topic.pbl_activity_id == pbl_id
    ).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found in this PBL activity")

    group_id = payload.get("group_id")
    if group_id:
        student_group_ids = get_student_group_ids(db, student.id, pbl.id)
        if group_id not in student_group_ids:
            raise HTTPException(status_code=403, detail="You are not a member of the selected group")

    # Spec: Do NOT prevent duplicate topics at system level. Duplicates are allowed.
    assigned_topic = Topic(
        pbl_activity_id=pbl.id,
        title=topic.title,
        description=topic.description,
        mode=TopicMode.STUDENT_LIST,
        status=TopicStatus.APPROVED,
        assigned_to_group_id=group_id,
        assigned_to_student_id=student.id if not group_id else None,
        proposed_by_student_id=student.id
    )
    db.add(assigned_topic)
    db.flush()

    history = TopicHistory(
        topic_id=assigned_topic.id,
        action="SELECTED_FROM_POOL",
        changed_by_user_id=student.user_id,
        comment=f"Topic selected from faculty pool by {student.name}"
    )
    db.add(history)
    db.commit()
    db.refresh(assigned_topic)

    return TopicOut(
        id=assigned_topic.id,
        pbl_activity_id=pbl.id,
        pbl_title=pbl.title,
        title=assigned_topic.title,
        description=assigned_topic.description,
        mode=assigned_topic.mode,
        status=assigned_topic.status,
        proposed_by_student_id=student.id,
        proposed_by_student_name=student.name,
        assigned_to_group_id=assigned_topic.assigned_to_group_id,
        assigned_to_student_id=assigned_topic.assigned_to_student_id,
        created_at=assigned_topic.created_at,
        history=[
            TopicHistoryOut(
                id=history.id,
                action=history.action,
                changed_by_name=student.name,
                comment=history.comment,
                created_at=history.created_at
            )
        ]
    )


@router.get("/me/profile", response_model=StudentOut)
def get_student_profile(
    student: Student = Depends(get_current_student)
):
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


@router.patch("/me/profile", response_model=StudentOut)
def update_student_profile(
    data: StudentProfileUpdate,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    if data.email is not None:
        student.email = data.email.strip()
    if data.phone_number is not None:
        student.phone_number = data.phone_number.strip()
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

