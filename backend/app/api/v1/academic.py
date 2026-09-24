from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.academic import Department, Program, AcademicYear, Semester, Division, Subject
from app.models.pbl import ComponentType
from app.models.user import Faculty
from app.schemas.academic import (
    DepartmentOut,
    AcademicYearOut,
    SemesterOut,
    DivisionOut,
    SubjectOut,
)
from app.schemas.pbl import ComponentTypeOut
from app.schemas.pbl import FacultySimpleOut

router = APIRouter(prefix="/academic", tags=["Academic Lookups"])


@router.get("/departments", response_model=List[DepartmentOut])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).filter(Department.is_active == True).all()


@router.get("/academic-years", response_model=List[AcademicYearOut])
def get_academic_years(db: Session = Depends(get_db)):
    return db.query(AcademicYear).order_by(AcademicYear.start_date.desc()).all()


@router.get("/semesters", response_model=List[SemesterOut])
def get_semesters(department_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Semester)
    if department_id:
        query = query.filter(Semester.department_id == department_id)
    sems = query.all()
    return [
        SemesterOut(
            id=s.id,
            name=s.name,
            number=s.number,
            academic_year_id=s.academic_year_id,
            department_id=s.department_id,
            program_id=s.program_id,
            academic_year_name=s.academic_year.name if s.academic_year else None,
            department_name=s.department.name if s.department else None
        )
        for s in sems
    ]


@router.get("/divisions", response_model=List[DivisionOut])
def get_divisions(semester_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Division)
    if semester_id:
        query = query.filter(Division.semester_id == semester_id)
    divs = query.all()
    return [
        DivisionOut(
            id=d.id,
            name=d.name,
            semester_id=d.semester_id,
            department_id=d.department_id,
            semester_name=d.semester.name if d.semester else None
        )
        for d in divs
    ]


@router.get("/subjects", response_model=List[SubjectOut])
def get_subjects(
    department_id: Optional[int] = None,
    semester_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Subject).filter(Subject.is_active == True)
    if department_id:
        query = query.filter(Subject.department_id == department_id)
    if semester_id:
        query = query.filter(Subject.semester_id == semester_id)
    subs = query.all()
    return [
        SubjectOut(
            id=s.id,
            name=s.name,
            subject_code=s.subject_code,
            semester_id=s.semester_id,
            department_id=s.department_id,
            description=s.description,
            is_active=s.is_active,
            semester_name=s.semester.name if s.semester else None,
            department_name=s.department.name if s.department else None
        )
        for s in subs
    ]


@router.get("/component-types", response_model=List[ComponentTypeOut])
def get_component_types(db: Session = Depends(get_db)):
    return db.query(ComponentType).filter(ComponentType.is_active == True).all()


@router.get("/faculty-list", response_model=List[FacultySimpleOut])
def get_faculty_list(db: Session = Depends(get_db)):
    faculty_members = db.query(Faculty).all()
    return [
        FacultySimpleOut(
            id=f.id,
            name=f.name,
            email=f.email,
            role_description="Faculty Guide"
        )
        for f in faculty_members
    ]
