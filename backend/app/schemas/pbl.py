from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, HttpUrl, ConfigDict
from app.models.pbl import PblStatus, TopicMode


class ComponentTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: str = "FileText"
    is_active: bool = True


class ComponentTypeCreate(ComponentTypeBase):
    pass


class ComponentTypeOut(ComponentTypeBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class ComponentCreate(BaseModel):
    component_type_id: int
    title: str
    description: Optional[str] = None
    deadline: datetime
    submission_required: bool = True
    external_submission_url: Optional[str] = None
    external_classroom_url: Optional[str] = None
    external_resource_url: Optional[str] = None
    is_group: bool = False


class ComponentUpdate(BaseModel):
    component_type_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    submission_required: Optional[bool] = None
    external_submission_url: Optional[str] = None
    external_classroom_url: Optional[str] = None
    external_resource_url: Optional[str] = None
    is_group: Optional[bool] = None


class ComponentOut(BaseModel):
    id: int
    pbl_activity_id: int
    component_type_id: int
    component_type_name: Optional[str] = None
    component_type_icon: Optional[str] = "FileText"
    title: str
    description: Optional[str] = None
    deadline: datetime
    submission_required: bool
    external_submission_url: Optional[str] = None
    external_classroom_url: Optional[str] = None
    external_resource_url: Optional[str] = None
    is_group: bool
    created_at: datetime

    # Dynamic fields evaluated for the student viewing
    deadline_state: Optional[str] = None  # UPCOMING, DUE_SOON, DUE_TODAY, OVERDUE, COMPLETED
    days_remaining: Optional[int] = None
    student_progress_state: Optional[str] = None  # TODO, IN_PROGRESS, DONE
    student_submission_state: Optional[str] = None  # NOT_SUBMITTED, SUBMITTED, ACCEPTED, REJECTED
    faculty_feedback: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class FacultyAssignment(BaseModel):
    faculty_id: int
    role_description: str = "Faculty Guide"


class PblActivityBase(BaseModel):
    title: str
    description: Optional[str] = None
    subject_id: int
    academic_year_id: int
    semester_id: int
    department_id: int
    start_date: date
    end_date: date
    status: PblStatus = PblStatus.ACTIVE
    topic_mode: TopicMode = TopicMode.STUDENT_PROPOSED
    allow_student_groups: bool = True
    require_group_approval: bool = False


class PblActivityCreate(PblActivityBase):
    faculty_ids: List[int] = []
    initial_components: Optional[List[ComponentCreate]] = []


class PblActivityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[PblStatus] = None
    topic_mode: Optional[TopicMode] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    allow_student_groups: Optional[bool] = None
    require_group_approval: Optional[bool] = None
    faculty_ids: Optional[List[int]] = None


class FacultySimpleOut(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    role_description: Optional[str] = "Faculty Guide"
    model_config = ConfigDict(from_attributes=True)


class PblActivityOut(PblActivityBase):
    id: int
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    academic_year_name: Optional[str] = None
    semester_name: Optional[str] = None
    department_name: Optional[str] = None
    faculty_members: List[FacultySimpleOut] = []
    component_count: int = 0
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PblActivityDetailOut(PblActivityOut):
    components: List[ComponentOut] = []


class PblDuplicateRequest(BaseModel):
    target_academic_year_id: int
    target_semester_id: int
    target_subject_id: Optional[int] = None
    new_title: Optional[str] = None
