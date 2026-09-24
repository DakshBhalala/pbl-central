from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class Group(Base, TimestampMixin):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    pbl_activity_id = Column(Integer, ForeignKey("pbl_activities.id", ondelete="CASCADE"), nullable=False)
    component_id = Column(Integer, ForeignKey("components.id", ondelete="SET NULL"), nullable=True)

    group_name = Column(String(100), nullable=False)
    group_code = Column(String(50), nullable=False)  # e.g., "GRP-CN-01"
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    pbl_activity = relationship("PblActivity", back_populates="groups")
    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")
    project = relationship("Project", back_populates="group", uselist=False, cascade="all, delete-orphan")
    topics = relationship("Topic", back_populates="assigned_to_group")


class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    group = relationship("Group", back_populates="members")
    student = relationship("Student", back_populates="group_memberships")


class Project(Base, TimestampMixin):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=True)
    pbl_activity_id = Column(Integer, ForeignKey("pbl_activities.id", ondelete="CASCADE"), nullable=False)
    component_id = Column(Integer, ForeignKey("components.id", ondelete="SET NULL"), nullable=True)

    title = Column(String(200), nullable=False)
    topic = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    guide_faculty_id = Column(Integer, ForeignKey("faculty.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="In Progress", nullable=False)
    external_url = Column(String(500), nullable=True)

    group = relationship("Group", back_populates="project")
    guide_faculty = relationship("Faculty")
