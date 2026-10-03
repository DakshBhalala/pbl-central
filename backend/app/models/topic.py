import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin
from app.models.pbl import TopicMode


class TopicStatus(str, enum.Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    PENDING = "PENDING"


class Topic(Base, TimestampMixin):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    pbl_activity_id = Column(Integer, ForeignKey("pbl_activities.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(250), nullable=False)
    description = Column(Text, nullable=True)

    mode = Column(Enum(TopicMode), default=TopicMode.STUDENT_PROPOSED, nullable=False)
    status = Column(Enum(TopicStatus), default=TopicStatus.APPROVED, nullable=False)

    proposed_by_student_id = Column(Integer, ForeignKey("students.id", ondelete="SET NULL"), nullable=True)
    assigned_to_group_id = Column(Integer, ForeignKey("groups.id", ondelete="SET NULL"), nullable=True)
    assigned_to_student_id = Column(Integer, ForeignKey("students.id", ondelete="SET NULL"), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Relationships
    pbl_activity = relationship("PblActivity", back_populates="topics")
    proposed_by_student = relationship("Student", foreign_keys=[proposed_by_student_id])
    assigned_to_student = relationship("Student", foreign_keys=[assigned_to_student_id])
    assigned_to_group = relationship("Group", back_populates="topics")
