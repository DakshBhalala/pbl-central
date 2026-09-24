from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_role
from app.models.user import User, Student, Faculty, UserRole
from app.models.academic import Department, Program, AcademicYear, Semester, Division, Subject
from app.models.pbl import ComponentType, PblActivity, Component, PblStatus
from app.models.progress import StudentComponentProgress, ProgressState
from app.schemas.academic import (
    DepartmentCreate, DepartmentOut,
    ProgramCreate, ProgramOut,
    AcademicYearCreate, AcademicYearOut,
    SemesterCreate, SemesterOut,
    DivisionCreate, DivisionOut,
    SubjectCreate, SubjectOut,
)
from app.schemas.pbl import ComponentTypeCreate, ComponentTypeOut, PblActivityOut, FacultySimpleOut
from app.schemas.user import StudentCreate, StudentOut, FacultyCreate, FacultyOut
from app.core.security import get_password_hash

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_role([UserRole.ADMIN]))])


@router.get("/dashboard")
def get_admin_dashboard(db: Session = Depends(get_db)):
    dept_count = db.query(Department).count()
    student_count = db.query(Student).count()
    faculty_count = db.query(Faculty).count()
    subject_count = db.query(Subject).count()
    active_pbl_count = db.query(PblActivity).filter(PblActivity.status == PblStatus.ACTIVE).count()
    total_progress = db.query(StudentComponentProgress).count()
    completed_progress = (
        db.query(StudentComponentProgress)
        .filter(StudentComponentProgress.progress_state == ProgressState.DONE)
        .count()
    )
    completion_rate = int(completed_progress / total_progress * 100) if total_progress > 0 else 0

    # Students by department
    depts = db.query(Department).all()
    students_by_dept = [
        {"name": d.code, "students": len(db.query(Student).filter(Student.department_id == d.id).all())}
        for d in depts
    ]

    # PBLs by semester
    sems = db.query(Semester).all()
    pbls_by_semester = [
        {"name": s.name, "count": len(db.query(PblActivity).filter(PblActivity.semester_id == s.id).all())}
        for s in sems[:6]
    ]

    return {
        "departments_count": dept_count,
        "students_count": student_count,
        "faculty_count": faculty_count,
        "subjects_count": subject_count,
        "active_pbl_count": active_pbl_count,
        "overall_completion_rate": completion_rate,
        "students_by_department": students_by_dept,
        "pbls_by_semester": pbls_by_semester
    }


# --- DEPARTMENTS CRUD ---
@router.get("/departments", response_model=List[DepartmentOut])
def list_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()


@router.post("/departments", response_model=DepartmentOut)
def create_department(data: DepartmentCreate, db: Session = Depends(get_db)):
    dept = Department(**data.dict())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


@router.patch("/departments/{id}", response_model=DepartmentOut)
def update_department(id: int, data: DepartmentCreate, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    for k, v in data.dict().items():
        setattr(dept, k, v)
    db.commit()
    db.refresh(dept)
    return dept


# --- ACADEMIC YEARS CRUD ---
@router.get("/academic-years", response_model=List[AcademicYearOut])
def list_academic_years(db: Session = Depends(get_db)):
    return db.query(AcademicYear).order_by(AcademicYear.start_date.desc()).all()


@router.post("/academic-years", response_model=AcademicYearOut)
def create_academic_year(data: AcademicYearCreate, db: Session = Depends(get_db)):
    ay = AcademicYear(**data.dict())
    db.add(ay)
    db.commit()
    db.refresh(ay)
    return ay


# --- SEMESTERS CRUD ---
@router.get("/semesters", response_model=List[SemesterOut])
def list_semesters(department_id: Optional[int] = None, db: Session = Depends(get_db)):
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


@router.post("/semesters", response_model=SemesterOut)
def create_semester(data: SemesterCreate, db: Session = Depends(get_db)):
    sem = Semester(**data.dict())
    db.add(sem)
    db.commit()
    db.refresh(sem)
    return SemesterOut(
        id=sem.id,
        name=sem.name,
        number=sem.number,
        academic_year_id=sem.academic_year_id,
        department_id=sem.department_id,
        program_id=sem.program_id,
        academic_year_name=sem.academic_year.name if sem.academic_year else None,
        department_name=sem.department.name if sem.department else None
    )


# --- DIVISIONS CRUD ---
@router.get("/divisions", response_model=List[DivisionOut])
def list_divisions(semester_id: Optional[int] = None, db: Session = Depends(get_db)):
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


@router.post("/divisions", response_model=DivisionOut)
def create_division(data: DivisionCreate, db: Session = Depends(get_db)):
    div = Division(**data.dict())
    db.add(div)
    db.commit()
    db.refresh(div)
    return DivisionOut(
        id=div.id,
        name=div.name,
        semester_id=div.semester_id,
        department_id=div.department_id,
        semester_name=div.semester.name if div.semester else None
    )


# --- SUBJECTS CRUD ---
@router.get("/subjects", response_model=List[SubjectOut])
def list_subjects(department_id: Optional[int] = None, semester_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Subject)
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


@router.post("/subjects", response_model=SubjectOut)
def create_subject(data: SubjectCreate, db: Session = Depends(get_db)):
    sub = Subject(**data.dict())
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return SubjectOut(
        id=sub.id,
        name=sub.name,
        subject_code=sub.subject_code,
        semester_id=sub.semester_id,
        department_id=sub.department_id,
        description=sub.description,
        is_active=sub.is_active,
        semester_name=sub.semester.name if sub.semester else None,
        department_name=sub.department.name if sub.department else None
    )


# --- COMPONENT TYPES CRUD ---
@router.get("/component-types", response_model=List[ComponentTypeOut])
def list_component_types(db: Session = Depends(get_db)):
    return db.query(ComponentType).all()


@router.post("/component-types", response_model=ComponentTypeOut)
def create_component_type(data: ComponentTypeCreate, db: Session = Depends(get_db)):
    ct = ComponentType(**data.dict())
    db.add(ct)
    db.commit()
    db.refresh(ct)
    return ct


@router.patch("/component-types/{id}", response_model=ComponentTypeOut)
def update_component_type(id: int, data: ComponentTypeCreate, db: Session = Depends(get_db)):
    ct = db.query(ComponentType).filter(ComponentType.id == id).first()
    if not ct:
        raise HTTPException(status_code=404, detail="Component type not found")
    for k, v in data.dict().items():
        setattr(ct, k, v)
    db.commit()
    db.refresh(ct)
    return ct


# --- FACULTY ACCOUNTS CRUD ---
@router.get("/faculty", response_model=List[FacultyOut])
def list_faculty_accounts(db: Session = Depends(get_db)):
    faculty_list = db.query(Faculty).all()
    return [
        FacultyOut(
            id=f.id,
            user_id=f.user_id,
            faculty_code=f.faculty_code,
            name=f.name,
            email=f.email,
            phone=f.phone,
            username=f.user.username if f.user else "",
            created_at=f.created_at
        )
        for f in faculty_list
    ]


@router.post("/faculty", response_model=FacultyOut)
def create_faculty_account(data: FacultyCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    user = User(
        username=data.username,
        password_hash=get_password_hash(data.password or "Faculty@123"),
        role=UserRole.FACULTY,
        is_active=True
    )
    db.add(user)
    db.flush()

    faculty = Faculty(
        user_id=user.id,
        faculty_code=data.faculty_code,
        name=data.name,
        email=data.email,
        phone=data.phone
    )
    db.add(faculty)
    db.commit()
    db.refresh(faculty)

    return FacultyOut(
        id=faculty.id,
        user_id=faculty.user_id,
        faculty_code=faculty.faculty_code,
        name=faculty.name,
        email=faculty.email,
        phone=faculty.phone,
        username=user.username,
        created_at=faculty.created_at
    )


# --- STUDENT ACCOUNTS CRUD ---
@router.get("/students", response_model=List[StudentOut])
def list_student_accounts(
    department_id: Optional[int] = None,
    semester_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Student)
    if department_id:
        query = query.filter(Student.department_id == department_id)
    if semester_id:
        query = query.filter(Student.semester_id == semester_id)
    students = query.all()

    return [
        StudentOut(
            id=s.id,
            user_id=s.user_id,
            enrollment_number=s.enrollment_number,
            name=s.name,
            email=s.email,
            phone_number=s.phone_number,
            department_id=s.department_id,
            semester_id=s.semester_id,
            division_id=s.division_id,
            department_name=s.department.name if s.department else None,
            semester_name=s.semester.name if s.semester else None,
            division_name=s.division.name if s.division else None,
            created_at=s.created_at
        )
        for s in students
    ]


@router.post("/students", response_model=StudentOut)
def create_student_account(data: StudentCreate, db: Session = Depends(get_db)):
    existing = db.query(Student).filter(Student.enrollment_number == data.enrollment_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Enrollment number already exists")

    user = User(
        username=data.enrollment_number,
        password_hash=get_password_hash(data.password or "Student@123"),
        role=UserRole.STUDENT,
        is_active=True
    )
    db.add(user)
    db.flush()

    student = Student(
        user_id=user.id,
        enrollment_number=data.enrollment_number,
        name=data.name,
        email=data.email,
        phone_number=data.phone_number,
        department_id=data.department_id,
        semester_id=data.semester_id,
        division_id=data.division_id
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    return StudentOut(
        id=student.id,
        user_id=student.user_id,
        enrollment_number=student.enrollment_number,
        name=student.name,
        email=student.email,
        phone_number=student.phone_number,
        department_id=student.department_id,
        semester_id=student.semester_id,
        division_id=student.division_id,
        department_name=student.department.name if student.department else None,
        semester_name=student.semester.name if student.semester else None,
        division_name=student.division.name if student.division else None,
        created_at=student.created_at
    )


# --- HISTORICAL DATA BROWSER ---
@router.get("/history", response_model=List[PblActivityOut])
def browse_historical_pbls(
    academic_year_id: Optional[int] = None,
    semester_id: Optional[int] = None,
    department_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(PblActivity)
    if academic_year_id:
        query = query.filter(PblActivity.academic_year_id == academic_year_id)
    if semester_id:
        query = query.filter(PblActivity.semester_id == semester_id)
    if department_id:
        query = query.filter(PblActivity.department_id == department_id)

    pbls = query.order_by(PblActivity.created_at.desc()).all()
    results = []
    for p in pbls:
        results.append(PblActivityOut(
            id=p.id,
            title=p.title,
            description=p.description,
            subject_id=p.subject_id,
            academic_year_id=p.academic_year_id,
            semester_id=p.semester_id,
            department_id=p.department_id,
            start_date=p.start_date,
            end_date=p.end_date,
            status=p.status,
            topic_mode=p.topic_mode,
            allow_student_groups=p.allow_student_groups,
            require_group_approval=p.require_group_approval,
            subject_name=p.subject.name if p.subject else None,
            subject_code=p.subject.subject_code if p.subject else None,
            academic_year_name=p.academic_year.name if p.academic_year else None,
            semester_name=p.semester.name if p.semester else None,
            department_name=p.department.name if p.department else None,
            faculty_members=[
                FacultySimpleOut(
                    id=assoc.faculty.id,
                    name=assoc.faculty.name,
                    email=assoc.faculty.email,
                    role_description=assoc.role_description
                )
                for assoc in p.faculty_members if assoc.faculty
            ],
            component_count=len(p.components),
            created_at=p.created_at
        ))
    return results
