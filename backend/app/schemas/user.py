from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    username: str
    user_id: int
    profile_id: Optional[int] = None
    name: Optional[str] = None


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None


class UserLogin(BaseModel):
    username: str
    password: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class UserBase(BaseModel):
    username: str
    role: UserRole
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class StudentBase(BaseModel):
    enrollment_number: str
    name: str
    department_id: int
    semester_id: int
    division_id: int
    email: Optional[str] = None
    phone_number: Optional[str] = None


class StudentCreate(StudentBase):
    password: Optional[str] = "Student@123"


class StudentProfileUpdate(BaseModel):
    email: Optional[str] = None
    phone_number: Optional[str] = None


class StudentOut(StudentBase):
    id: int
    user_id: int
    department_name: Optional[str] = None
    semester_name: Optional[str] = None
    division_name: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FacultyBase(BaseModel):
    faculty_code: Optional[str] = None
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None


class FacultyCreate(FacultyBase):
    username: str
    password: Optional[str] = "Faculty@123"


class FacultyOut(FacultyBase):
    id: int
    user_id: int
    username: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserOut(UserBase):
    id: int
    created_at: datetime
    student_profile: Optional[StudentOut] = None
    faculty_profile: Optional[FacultyOut] = None

    class Config:
        from_attributes = True
