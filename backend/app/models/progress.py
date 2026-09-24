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

    # Relationships
    student = relationship("Student", back_populates="progress_entries")
    component = relationship("Component", back_populates="progress_records")


class FacultyReview(Base):
    __tablename__ = "faculty_reviews"
    __table_args__ = (
        UniqueConstraint("student_id", "component_id", name="uq_faculty_student_component_review"),
    )

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    component_id = Column(Integer, ForeignKey("components.id", ondelete="CASCADE"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False)

    internal_marks = Column(Float, nullable=True)  # STRICTLY HIDDEN from students
    feedback = Column(Text, nullable=True)
    is_rejected = Column(Boolean, default=False, nullable=False)
    reviewed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    student = relationship("Student")
    component = relationship("Component", back_populates="faculty_reviews")
    faculty = relationship("Faculty")
