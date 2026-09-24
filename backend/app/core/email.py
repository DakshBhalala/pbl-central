import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.EMAILS_FROM_EMAIL
        self.from_name = settings.EMAILS_FROM_NAME
        self.dev_logging = settings.DEV_EMAIL_LOGGING

    @property
    def is_configured(self) -> bool:
        return bool(self.smtp_host and self.smtp_port and self.smtp_user)

    def send_email(
        self,
        to_email: str,
        subject: str,
        body_text: str,
        body_html: Optional[str] = None
    ) -> bool:
        """
        Sends an email or logs safely in development mode.
        Returns True if sent or successfully logged in dev mode.
        """
        if not self.is_configured:
            if self.dev_logging:
                logger.info(
                    f"\n--- [DEV EMAIL DISPATCH] ---\n"
                    f"To: {to_email}\n"
                    f"Subject: {subject}\n"
                    f"Body: {body_text}\n"
                    f"----------------------------"
                )
                print(f"[DEV EMAIL LOG] Sent notification to {to_email}: {subject}")
                return True
            return False

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = to_email

            part1 = MIMEText(body_text, "plain")
            msg.attach(part1)

            if body_html:
                part2 = MIMEText(body_html, "html")
                msg.attach(part2)

            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.from_email, [to_email], msg.as_string())
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False


email_service = EmailService()
