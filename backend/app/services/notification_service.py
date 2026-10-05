from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.user import User, Student
from app.models.pbl import PblActivity, Component
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
    """Notify students enrolled in the PBL cohort when a new milestone/component is added."""
    students = db.query(Student).filter(
        Student.department_id == pbl.department_id,
        Student.semester_id == pbl.semester_id
    ).all()
    deadline_str = comp.deadline.strftime("%b %d, %Y") if comp.deadline else "TBD"

    title = f"New Milestone: {comp.title}"
    msg = f"A new milestone '{comp.title}' has been added to '{pbl.title}'. Due on {deadline_str}."
    link = f"/student/pbl/{pbl.id}"

    for s in students:
        create_notification(
            db=db,
            user_id=s.user_id,
            title=title,
            message=msg,
            link=link
        )


def notify_students_updated_component(db: Session, comp: Component, pbl: PblActivity):
    """Notify students enrolled in the PBL cohort when an existing milestone/component is modified."""
    students = db.query(Student).filter(
        Student.department_id == pbl.department_id,
        Student.semester_id == pbl.semester_id
    ).all()
    deadline_str = comp.deadline.strftime("%b %d, %Y") if comp.deadline else "TBD"

    title = f"Milestone Updated: {comp.title}"
    msg = f"The milestone '{comp.title}' in '{pbl.title}' has been updated. Due on {deadline_str}."
    link = f"/student/pbl/{pbl.id}"

    for s in students:
        create_notification(
            db=db,
            user_id=s.user_id,
            title=title,
            message=msg,
            link=link
        )


def notify_students_pbl_updated(db: Session, pbl: PblActivity):
    """Notify all students in the cohort when PBL activity details are updated."""
    students = db.query(Student).filter(
        Student.department_id == pbl.department_id,
        Student.semester_id == pbl.semester_id
    ).all()

    title = f"Project Updated: {pbl.title}"
    msg = f"The project details for '{pbl.title}' have been updated by faculty."

    for s in students:
        create_notification(
            db=db,
            user_id=s.user_id,
            title=title,
            message=msg,
            link=f"/student/pbl/{pbl.id}"
        )

