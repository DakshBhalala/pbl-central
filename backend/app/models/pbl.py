import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, Date, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class PblStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"


class TopicMode(str, enum.Enum):
    FACULTY_ASSIGNED = "FACULTY_ASSIGNED"
    STUDENT_LIST = "STUDENT_LIST"
    STUDENT_PROPOSED = "STUDENT_PROPOSED"
    NO_TOPIC = "NO_TOPIC"


class AssignmentScope(str, enum.Enum):
    ALL = "ALL"
    DIVISION = "DIVISION"
    GROUP = "GROUP"
    STUDENT = "STUDENT"


class PblActivity(Base, TimestampMixin):
    __tablename__ = "pbl_activities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)

    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(Enum(PblStatus), default=PblStatus.ACTIVE, nullable=False)
    topic_mode = Column(Enum(TopicMode), default=TopicMode.STUDENT_PROPOSED, nullable=False)

    allow_student_groups = Column(Boolean, default=True, nullable=False)
    require_group_approval = Column(Boolean, default=False, nullable=False)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    archived_at = Column(DateTime, nullable=True)

    # Relationships
    subject = relationship("Subject", back_populates="pbl_activities")
    academic_year = relationship("AcademicYear", back_populates="pbl_activities")
    semester = relationship("Semester", back_populates="pbl_activities")
    department = relationship("Department")
    faculty_members = relationship("PblFaculty", back_populates="pbl_activity", cascade="all, delete-orphan")
    components = relationship("Component", back_populates="pbl_activity", cascade="all, delete-orphan")
    groups = relationship("Group", back_populates="pbl_activity", cascade="all, delete-orphan")
    topics = relationship("Topic", back_populates="pbl_activity", cascade="all, delete-orphan")


class PblFaculty(Base):
    __tablename__ = "pbl_faculty"

    id = Column(Integer, primary_key=True, index=True)
    pbl_activity_id = Column(Integer, ForeignKey("pbl_activities.id", ondelete="CASCADE"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False)
    role_description = Column(String(100), default="Faculty Guide", nullable=False)

    pbl_activity = relationship("PblActivity", back_populates="faculty_members")
    faculty = relationship("Faculty", back_populates="pbl_associations")


class ComponentType(Base):
    __tablename__ = "component_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), default="FileText", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    components = relationship("Component", back_populates="component_type")


class Component(Base, TimestampMixin):
    __tablename__ = "components"

    id = Column(Integer, primary_key=True, index=True)
    pbl_activity_id = Column(Integer, ForeignKey("pbl_activities.id", ondelete="CASCADE"), nullable=False)
    component_type_id = Column(Integer, ForeignKey("component_types.id"), nullable=False)

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    deadline = Column(DateTime, nullable=False)
    
    submission_required = Column(Boolean, default=True, nullable=False)
    external_submission_url = Column(String(500), nullable=True)
    external_classroom_url = Column(String(500), nullable=True)
    external_resource_url = Column(String(500), nullable=True)

    is_group = Column(Boolean, default=False, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    archived_at = Column(DateTime, nullable=True)

    # Relationships
    pbl_activity = relationship("PblActivity", back_populates="components")
    component_type = relationship("ComponentType", back_populates="components")
    assignments = relationship("ComponentAssignment", back_populates="component", cascade="all, delete-orphan")
    progress_records = relationship("StudentComponentProgress", back_populates="component", cascade="all, delete-orphan")
    faculty_reviews = relationship("FacultyReview", back_populates="component", cascade="all, delete-orphan")


class ComponentAssignment(Base):
    __tablename__ = "component_assignments"

    id = Column(Integer, primary_key=True, index=True)
    component_id = Column(Integer, ForeignKey("components.id", ondelete="CASCADE"), nullable=False)
    scope_type = Column(Enum(AssignmentScope), default=AssignmentScope.ALL, nullable=False)
    target_id = Column(Integer, nullable=True)  # division_id, group_id, or student_id when scope != ALL
    custom_description = Column(Text, nullable=True)  # Distinct instructions for this group/division/student

    component = relationship("Component", back_populates="assignments")
