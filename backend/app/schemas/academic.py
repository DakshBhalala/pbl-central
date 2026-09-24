from datetime import date
from typing import Optional, List
from pydantic import BaseModel


class DepartmentBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    is_active: bool = True


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentOut(DepartmentBase):
    id: int

    class Config:
        from_attributes = True


class ProgramBase(BaseModel):
    name: str
    code: str
    department_id: int


class ProgramCreate(ProgramBase):
    pass


class ProgramOut(ProgramBase):
    id: int
    department_name: Optional[str] = None

    class Config:
        from_attributes = True


class AcademicYearBase(BaseModel):
    name: str
    start_date: date
    end_date: date
    is_current: bool = False


class AcademicYearCreate(AcademicYearBase):
    pass


class AcademicYearOut(AcademicYearBase):
    id: int

    class Config:
        from_attributes = True


class SemesterBase(BaseModel):
    name: str
    number: int
    academic_year_id: int
    department_id: int
    program_id: Optional[int] = None


class SemesterCreate(SemesterBase):
    pass


class SemesterOut(SemesterBase):
    id: int
    academic_year_name: Optional[str] = None
    department_name: Optional[str] = None

    class Config:
        from_attributes = True


class DivisionBase(BaseModel):
    name: str
    semester_id: int
    department_id: int


class DivisionCreate(DivisionBase):
    pass


class DivisionOut(DivisionBase):
    id: int
    semester_name: Optional[str] = None

    class Config:
        from_attributes = True


class SubjectBase(BaseModel):
    name: str
    subject_code: str
    semester_id: int
    department_id: int
    description: Optional[str] = None
    is_active: bool = True


class SubjectCreate(SubjectBase):
    pass


class SubjectOut(SubjectBase):
    id: int
    semester_name: Optional[str] = None
    department_name: Optional[str] = None

    class Config:
        from_attributes = True
