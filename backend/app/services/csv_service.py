import csv
import io
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.user import User, Student, UserRole
from app.models.academic import Department, Semester, Division
from app.core.security import get_password_hash


def parse_and_validate_student_csv(
    db: Session,
    csv_content: str,
    default_department_id: int
) -> Dict[str, Any]:
    """
    Parses CSV content, validates each row against the database,
    detects internal & existing database duplicates, and provides a preview.
    Expected CSV columns: name, enrollment_number, semester (number or name), division (name), email (opt), phone (opt)
    """
    f = io.StringIO(csv_content.strip())
    reader = csv.DictReader(f)

    valid_rows: List[Dict[str, Any]] = []
    invalid_rows: List[Dict[str, Any]] = []
    seen_enrollments = set()

    # Pre-cache semesters & divisions for department
    dept = db.query(Department).filter(Department.id == default_department_id).first()
    if not dept:
        return {
            "error": "Invalid department ID provided",
            "total": 0,
            "valid_count": 0,
            "invalid_count": 0,
            "valid_rows": [],
            "invalid_rows": []
        }

    semesters = {str(s.number): s for s in dept.semesters}
    # Also index by name like "Semester 5"
    for s in dept.semesters:
        semesters[s.name.lower()] = s

    for row_idx, row in enumerate(reader, start=2):
        # Normalize header keys (strip whitespace, lowercase)
        normalized_row = {k.strip().lower() if k else "": v.strip() if v else "" for k, v in row.items()}
        
        name = normalized_row.get("name", "")
        enrollment = normalized_row.get("enrollment_number", "") or normalized_row.get("enrollment", "")
        sem_val = normalized_row.get("semester", "")
        div_val = normalized_row.get("division", "")
        email = normalized_row.get("email", "")
        phone = normalized_row.get("phone", "") or normalized_row.get("phone_number", "")

        errors = []
        if not name:
            errors.append("Missing name")
        if not enrollment:
            errors.append("Missing enrollment number")
        elif enrollment in seen_enrollments:
            errors.append(f"Duplicate enrollment number in file: {enrollment}")
        else:
            # Check DB
            existing = db.query(Student).filter(Student.enrollment_number == enrollment).first()
            if existing:
                errors.append(f"Enrollment number already exists in system: {enrollment}")

        # Validate semester
        target_sem = None
        if not sem_val:
            errors.append("Missing semester")
        else:
            sem_key = sem_val.lower().replace("semester", "").strip()
            target_sem = semesters.get(sem_key) or semesters.get(sem_val.lower())
            if not target_sem:
                errors.append(f"Semester '{sem_val}' not found in department {dept.name}")

        # Validate division
        target_div = None
        if not div_val:
            errors.append("Missing division")
        elif target_sem:
            target_div = next((d for d in target_sem.divisions if d.name.lower() == div_val.lower()), None)
            if not target_div:
                errors.append(f"Division '{div_val}' not found in {target_sem.name}")

        if errors:
            invalid_rows.append({
                "row_number": row_idx,
                "raw_data": row,
                "errors": errors
            })
        else:
            seen_enrollments.add(enrollment)
            valid_rows.append({
                "row_number": row_idx,
                "name": name,
                "enrollment_number": enrollment,
                "email": email or f"{enrollment.lower()}@college.edu",
                "phone_number": phone or None,
                "department_id": default_department_id,
                "department_name": dept.name,
                "semester_id": target_sem.id,
                "semester_name": target_sem.name,
                "division_id": target_div.id,
                "division_name": target_div.name,
            })

    return {
        "total": len(valid_rows) + len(invalid_rows),
        "valid_count": len(valid_rows),
        "invalid_count": len(invalid_rows),
        "valid_rows": valid_rows,
        "invalid_rows": invalid_rows,
    }


def execute_student_import(
    db: Session,
    valid_rows: List[Dict[str, Any]],
    default_password: str = "Student@123"
) -> Dict[str, Any]:
    created_students = []
    password_hash = get_password_hash(default_password)

    for item in valid_rows:
        # Create user account
        user = User(
            username=item["enrollment_number"],
            password_hash=password_hash,
            role=UserRole.STUDENT,
            is_active=True
        )
        db.add(user)
        db.flush()

        student = Student(
            user_id=user.id,
            enrollment_number=item["enrollment_number"],
            name=item["name"],
            email=item.get("email"),
            phone_number=item.get("phone_number"),
            department_id=item["department_id"],
            semester_id=item["semester_id"],
            division_id=item["division_id"],
        )
        db.add(student)
        created_students.append(item["enrollment_number"])

    db.commit()
    return {
        "success": True,
        "imported_count": len(created_students),
        "enrollments": created_students
    }
