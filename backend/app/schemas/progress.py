from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.progress import ProgressState, SubmissionState
from app.schemas.pbl import ComponentOut
from app.schemas.notification import NotificationOut


class StudentProgressUpdate(BaseModel):
    progress_state: ProgressState


class StudentSubmissionToggle(BaseModel):
    submission_state: SubmissionState


class FacultyReviewCreate(BaseModel):
    student_id: int
    component_id: int
    internal_marks: Optional[float] = None  # Faculty-only
    feedback: Optional[str] = None
    is_rejected: bool = False


class FacultyReviewOut(BaseModel):
    id: int
    student_id: int
    student_name: str
    enrollment_number: str
    component_id: int
    component_title: str
    faculty_id: int
    faculty_name: str
    internal_marks: Optional[float] = None
    feedback: Optional[str] = None
    is_rejected: bool
    reviewed_at: datetime

    class Config:
        from_attributes = True


class SubjectPblSummary(BaseModel):
    pbl_id: int
    subject_id: int
    subject_name: str
    subject_code: str
    completed_components: int
    total_components: int
    percentage: int
    faculty_names: List[str] = []


class StudentDashboardOut(BaseModel):
    student_name: str
    enrollment_number: str
    email: Optional[str] = None
    phone_number: Optional[str] = None
    department_name: str
    semester_name: str
    division_name: str
    overall_progress_percentage: int
    active_pbl_count: int
    total_components_count: int
    completed_count: int
    pending_count: int
    upcoming_count: int
    upcoming_deadlines: List[ComponentOut] = []
    overdue_items: List[ComponentOut] = []
    subject_summaries: List[SubjectPblSummary] = []
    recent_notifications: List[NotificationOut] = []
