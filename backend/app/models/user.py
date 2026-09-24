import enum
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class UserRole(str, enum.Enum):
    STUDENT = "STUDENT"
    FACULTY = "FACULTY"
    ADMIN = "ADMIN"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.STUDENT)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    student_profile = relationship("Student", back_populates="user", uselist=False, cascade="all, delete-orphan")
    faculty_profile = relationship("Faculty", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Student(Base, TimestampMixin):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    enrollment_number = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=True)
    phone_number = Column(String(30), nullable=True)

    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    division_id = Column(Integer, ForeignKey("divisions.id"), nullable=False)

    # Relationships
    user = relationship("User", back_populates="student_profile")
    department = relationship("Department")
    semester = relationship("Semester")
    division = relationship("Division")
    group_memberships = relationship("GroupMember", back_populates="student", cascade="all, delete-orphan")
    progress_entries = relationship("StudentComponentProgress", back_populates="student", cascade="all, delete-orphan")


class Faculty(Base, TimestampMixin):
    __tablename__ = "faculty"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    faculty_code = Column(String(50), unique=True, index=True, nullable=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=True)
    phone = Column(String(30), nullable=True)

    # Relationships
    user = relationship("User", back_populates="faculty_profile")
    pbl_associations = relationship("PblFaculty", back_populates="faculty", cascade="all, delete-orphan")
    departments = relationship("FacultyDepartment", back_populates="faculty", cascade="all, delete-orphan")


class FacultyDepartment(Base):
    __tablename__ = "faculty_departments"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)

    faculty = relationship("Faculty", back_populates="departments")
    department = relationship("Department")
