from datetime import datetime, timezone
from typing import Tuple, Optional
from app.models.progress import ProgressState, SubmissionState


def calculate_deadline_info(
    deadline: datetime,
    progress_state: Optional[ProgressState] = None,
    submission_state: Optional[SubmissionState] = None,
    due_soon_days: int = 3
) -> Tuple[str, int]:
    """
    Computes deadline_state ('COMPLETED', 'OVERDUE', 'DUE_TODAY', 'DUE_SOON', 'UPCOMING')
    and days_remaining.
    """
    now = datetime.now(timezone.utc)
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)

    # If marked completed by student or already submitted
    if progress_state == ProgressState.DONE or submission_state == SubmissionState.SUBMITTED:
        delta = deadline - now
        days_remaining = int(delta.total_seconds() // 86400)
        return "COMPLETED", days_remaining

    delta = deadline - now
    total_seconds = delta.total_seconds()
    days_remaining = int(total_seconds // 86400)

    if total_seconds < 0:
        return "OVERDUE", days_remaining

    # Check if due today (same UTC calendar date)
    if deadline.date() == now.date():
        return "DUE_TODAY", 0

    if total_seconds <= (due_soon_days * 86400):
        return "DUE_SOON", max(days_remaining, 1)

    return "UPCOMING", days_remaining
