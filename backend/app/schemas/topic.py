from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.pbl import TopicMode
from app.models.topic import TopicStatus


class TopicHistoryOut(BaseModel):
    id: int
    action: str
    changed_by_name: Optional[str] = None
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TopicBase(BaseModel):
    title: str
    description: Optional[str] = None


class TopicPropose(TopicBase):
    pbl_activity_id: int
    group_id: Optional[int] = None


class TopicCreate(TopicBase):
    pbl_activity_id: Optional[int] = None
    mode: Optional[TopicMode] = None
    assigned_to_group_id: Optional[int] = None
    assigned_to_student_id: Optional[int] = None


class TopicRejectRequest(BaseModel):
    reason: str


class TopicOut(TopicBase):
    id: int
    pbl_activity_id: int
    pbl_title: Optional[str] = None
    mode: TopicMode
    status: TopicStatus
    proposed_by_student_id: Optional[int] = None
    proposed_by_student_name: Optional[str] = None
    assigned_to_group_id: Optional[int] = None
    assigned_to_group_name: Optional[str] = None
    assigned_to_student_id: Optional[int] = None
    rejection_reason: Optional[str] = None
    history: List[TopicHistoryOut] = []
    created_at: datetime

    class Config:
        from_attributes = True
