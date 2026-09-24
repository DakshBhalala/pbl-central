from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False)
    code = Column(String(20), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    programs = relationship("Program", back_populates="department", cascade="all, delete-orphan")
    semesters = relationship("Semester", back_populates="department")
    subjects = relationship("Subject", back_populates="department")


class Program(Base):
    __tablename__ = "programs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    code = Column(String(20), index=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)

    department = relationship("Department", back_populates="programs")
    semesters = relationship("Semester", back_populates="program")


class AcademicYear(Base):
    __tablename__ = "academic_years"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  # e.g., "2026–27"
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_current = Column(Boolean, default=False, nullable=False)

    semesters = relationship("Semester", back_populates="academic_year")
    pbl_activities = relationship("PblActivity", back_populates="academic_year")


class Semester(Base):
    __tablename__ = "semesters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)  # e.g. "Semester 5"
    number = Column(Integer, nullable=False)  # 5
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=False)
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)

    academic_year = relationship("AcademicYear", back_populates="semesters")
    program = relationship("Program", back_populates="semesters")
    department = relationship("Department", back_populates="semesters")
    divisions = relationship("Division", back_populates="semester", cascade="all, delete-orphan")
    subjects = relationship("Subject", back_populates="semester")
    pbl_activities = relationship("PblActivity", back_populates="semester")


class Division(Base):
    __tablename__ = "divisions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(20), nullable=False)  # e.g. "A", "B"
    semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="CASCADE"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)

    semester = relationship("Semester", back_populates="divisions")
    department = relationship("Department")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)  # e.g., "Computer Networks"
    subject_code = Column(String(30), unique=True, index=True, nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    semester = relationship("Semester", back_populates="subjects")
    department = relationship("Department", back_populates="subjects")
    pbl_activities = relationship("PblActivity", back_populates="subject")
