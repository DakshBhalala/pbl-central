from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class GroupMemberOut(BaseModel):
    id: int
    student_id: int
    student_name: str
    enrollment_number: str
    joined_at: datetime

    class Config:
        from_attributes = True


class ProjectBase(BaseModel):
    title: str
    topic: Optional[str] = None
    description: Optional[str] = None
    guide_faculty_id: Optional[int] = None
    status: str = "In Progress"
    external_url: Optional[str] = None


class ProjectCreate(ProjectBase):
    pbl_activity_id: int
    group_id: Optional[int] = None
    component_id: Optional[int] = None


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    topic: Optional[str] = None
    description: Optional[str] = None
    guide_faculty_id: Optional[int] = None
    status: Optional[str] = None
    external_url: Optional[str] = None


class ProjectOut(ProjectBase):
    id: int
    group_id: Optional[int] = None
    pbl_activity_id: int
    guide_faculty_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class GroupBase(BaseModel):
    group_name: str
    group_code: str


class GroupCreate(GroupBase):
    pbl_activity_id: int
    component_id: Optional[int] = None
    member_student_ids: List[int] = []


class GroupOut(GroupBase):
    id: int
    pbl_activity_id: int
    pbl_title: Optional[str] = None
    component_id: Optional[int] = None
    members: List[GroupMemberOut] = []
    project: Optional[ProjectOut] = None
    created_at: datetime

    class Config:
        from_attributes = True
