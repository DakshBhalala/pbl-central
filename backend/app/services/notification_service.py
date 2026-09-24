from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.user import User
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
