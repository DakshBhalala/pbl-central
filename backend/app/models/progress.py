import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, Text, Boolean, ForeignKey, Enum, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class ProgressState(str, enum.Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"


class SubmissionState(str, enum.Enum):
    NOT_SUBMITTED = "NOT_SUBMITTED"
    SUBMITTED = "SUBMITTED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


class StudentComponentProgress(Base, TimestampMixin):
    __tablename__ = "student_component_progress"
    __table_args__ = (
        UniqueConstraint("student_id", "component_id", name="uq_student_component_progress"),
    )

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    component_id = Column(Integer, ForeignKey("components.id", ondelete="CASCADE"), nullable=False)

    progress_state = Column(Enum(ProgressState), default=ProgressState.TODO, nullable=False)
    submission_state = Column(Enum(SubmissionState), default=SubmissionState.NOT_SUBMITTED, nullable=False)
    submitted_at = Column(DateTime, nullable=True)

    # Faculty Review & Feedback (Accept / Reject decision)
    faculty_feedback = Column(Text, nullable=True)
    reviewed_by_faculty_id = Column(Integer, ForeignKey("faculty.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    # Relationships
    student = relationship("Student", back_populates="progress_entries")
    component = relationship("Component", back_populates="progress_records")
    reviewed_by_faculty = relationship("Faculty")
