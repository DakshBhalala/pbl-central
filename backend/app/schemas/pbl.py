from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, HttpUrl
from app.models.pbl import PblStatus, TopicMode, AssignmentScope


class ComponentTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: str = "FileText"
    is_active: bool = True


class ComponentTypeCreate(ComponentTypeBase):
    pass


class ComponentTypeOut(ComponentTypeBase):
    id: int

    class Config:
        from_attributes = True


class ComponentAssignmentCreate(BaseModel):
    scope_type: AssignmentScope = AssignmentScope.ALL
    target_id: Optional[int] = None  # division_id, group_id, or student_id
    custom_description: Optional[str] = None  # Group/Division specific instruction


class ComponentAssignmentUpdate(BaseModel):
    custom_description: Optional[str] = None


class ComponentAssignmentOut(BaseModel):
    id: int
    component_id: int
    scope_type: AssignmentScope
    target_id: Optional[int] = None
    target_label: Optional[str] = None
    custom_description: Optional[str] = None

    class Config:
        from_attributes = True


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
    assignments: Optional[List[ComponentAssignmentCreate]] = [ComponentAssignmentCreate(scope_type=AssignmentScope.ALL)]


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
    assignments: List[ComponentAssignmentOut] = []

    # Dynamic fields evaluated for the student viewing
    assignment_custom_description: Optional[str] = None  # Specific instruction for student's group
    deadline_state: Optional[str] = None  # UPCOMING, DUE_SOON, DUE_TODAY, OVERDUE, COMPLETED
    days_remaining: Optional[int] = None
    student_progress_state: Optional[str] = None  # TODO, IN_PROGRESS, DONE
    student_submission_state: Optional[str] = None  # NOT_SUBMITTED, SUBMITTED, REJECTED
    faculty_feedback: Optional[str] = None

    class Config:
        from_attributes = True


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

    class Config:
        from_attributes = True


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

    class Config:
        from_attributes = True


class PblActivityDetailOut(PblActivityOut):
    components: List[ComponentOut] = []


class PblDuplicateRequest(BaseModel):
    target_academic_year_id: int
    target_semester_id: int
    target_subject_id: Optional[int] = None
    new_title: Optional[str] = None
