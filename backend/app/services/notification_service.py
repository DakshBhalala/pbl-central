from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.user import User, Student
from app.models.pbl import PblActivity, Component, AssignmentScope
from app.models.group import GroupMember
from app.core.email import email_service


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    link: Optional[str] = None,
    send_email_copy: bool = False,
    user_email: Optional[str] = None
) -> Notification:
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        link=link,
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    if send_email_copy:
        if not user_email:
            user = db.query(User).filter(User.id == user_id).first()
            if user and user.student_profile and user.student_profile.email:
                user_email = user.student_profile.email
            elif user and user.faculty_profile and user.faculty_profile.email:
                user_email = user.faculty_profile.email

        if user_email:
            email_service.send_email(
                to_email=user_email,
                subject=f"[PBL Central] {title}",
                body_text=f"{message}\n\nView details at PBL Central: {link or '/'}"
            )

    return notif


def broadcast_pbl_notification(
    db: Session,
    user_ids: List[int],
    title: str,
    message: str,
    link: Optional[str] = None
):
    for uid in user_ids:
        create_notification(db, uid, title, message, link, send_email_copy=False)


def notify_students_new_pbl(db: Session, pbl: PblActivity):
    """Notify all students enrolled in the department and semester when a new PBL activity is introduced."""
    students = db.query(Student).filter(
        Student.department_id == pbl.department_id,
        Student.semester_id == pbl.semester_id
    ).all()

    subject_name = pbl.subject.name if pbl.subject else "Your Course"
    title = f"New PBL Activity: {pbl.title}"
    msg = f"A new Project-Based Learning activity '{pbl.title}' has been introduced for {subject_name}."

    for s in students:
        create_notification(
            db=db,
            user_id=s.user_id,
            title=title,
            message=msg,
            link=f"/student/pbl/{pbl.id}"
        )


def notify_students_new_component(db: Session, comp: Component, pbl: PblActivity):
    """Notify students targeted by assignments when a new milestone/component is added."""
    user_ids = set()
    deadline_str = comp.deadline.strftime("%b %d, %Y") if comp.deadline else "TBD"

    for a in comp.assignments:
        if a.scope_type == AssignmentScope.ALL:
            students = db.query(Student).filter(
                Student.department_id == pbl.department_id,
                Student.semester_id == pbl.semester_id
            ).all()
            for s in students:
                user_ids.add(s.user_id)
        elif a.scope_type == AssignmentScope.DIVISION and a.target_id:
            students = db.query(Student).filter(Student.division_id == a.target_id).all()
            for s in students:
                user_ids.add(s.user_id)
        elif a.scope_type == AssignmentScope.GROUP and a.target_id:
            members = db.query(GroupMember).filter(GroupMember.group_id == a.target_id).all()
            for m in members:
                if m.student:
                    user_ids.add(m.student.user_id)
        elif a.scope_type == AssignmentScope.STUDENT and a.target_id:
            st = db.query(Student).filter(Student.id == a.target_id).first()
            if st:
                user_ids.add(st.user_id)

    title = f"New Milestone: {comp.title}"
    msg = f"A new milestone '{comp.title}' has been added to '{pbl.title}'. Due on {deadline_str}."
    link = f"/student/pbl/{pbl.id}"

    for uid in user_ids:
        create_notification(
            db=db,
            user_id=uid,
            title=title,
            message=msg,
            link=link
        )

