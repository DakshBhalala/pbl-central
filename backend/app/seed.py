from datetime import datetime, date, timedelta, timezone
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, init_db, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, Student, Faculty, UserRole
from app.models.academic import Department, AcademicYear, Semester, Division, Subject
from app.models.pbl import (
    ComponentType,
    PblActivity,
    PblFaculty,
    Component,
    PblStatus,
)
from app.models.group import Group, GroupMember, Project
from app.models.progress import (
    StudentComponentProgress,
    ProgressState,
    SubmissionState,
)
from app.models.notification import Notification


def seed_database(db: Session = None, reset: bool = False):
    should_close = False
    if reset:
        print("Resetting database: recreating tables across schema...")
        from app.models import base, user, academic, pbl, group, progress, notification  # noqa
        if db:
            db.close()
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        should_close = True
    else:
        init_db()
        if db is None:
            db = SessionLocal()
            should_close = True

    # Avoid duplicate seeding if admin user already exists and reset is False
    if not reset and db.query(User).filter(User.username == "admin").first():
        print("Database already contains seed data. Skipping.")
        if should_close:
            db.close()
        return

    print("Seeding database with realistic PBL Central demo data...")
    now = datetime.now(timezone.utc)

    # 1. Departments
    dept_ce = Department(name="Computer Engineering", code="CE", description="Department of Computer Engineering")
    dept_it = Department(name="Information Technology", code="IT", description="Department of Information Technology")
    dept_me = Department(name="Mechanical Engineering", code="ME", description="Department of Mechanical Engineering")
    dept_cl = Department(name="Civil Engineering", code="CL", description="Department of Civil Engineering")
    dept_ec = Department(name="Electronics & Communication", code="EC", description="Department of Electronics & Communication")
    db.add_all([dept_ce, dept_it, dept_me, dept_cl, dept_ec])
    db.flush()

    # 2. Academic Years
    ay_current = AcademicYear(name="2026–27", start_date=date(2026, 7, 1), end_date=date(2027, 6, 30), is_current=True)
    db.add(ay_current)
    db.flush()

    # 3. Semesters
    sem_3 = Semester(name="Semester 3", number=3, academic_year_id=ay_current.id, department_id=dept_ce.id)
    sem_5 = Semester(name="Semester 5", number=5, academic_year_id=ay_current.id, department_id=dept_ce.id)
    sem_7 = Semester(name="Semester 7", number=7, academic_year_id=ay_current.id, department_id=dept_ce.id)
    sem_5_it = Semester(name="Semester 5", number=5, academic_year_id=ay_current.id, department_id=dept_it.id)
    db.add_all([sem_3, sem_5, sem_7, sem_5_it])
    db.flush()

    # 5. Divisions
    div_a = Division(name="A", semester_id=sem_5.id, department_id=dept_ce.id)
    div_b = Division(name="B", semester_id=sem_5.id, department_id=dept_ce.id)
    div_3a = Division(name="A", semester_id=sem_3.id, department_id=dept_ce.id)
    div_it_a = Division(name="A", semester_id=sem_5_it.id, department_id=dept_it.id)
    db.add_all([div_a, div_b, div_3a, div_it_a])
    db.flush()

    # 6. Subjects (Realistic Academic Offerings)
    # Computer Engineering Semester 5
    sub_cn = Subject(name="Computer Networks", subject_code="CS501", semester_id=sem_5.id, department_id=dept_ce.id, description="Data communication, OSI model, IP routing, packet inspection")
    sub_db = Subject(name="Database Management Systems", subject_code="CS502", semester_id=sem_5.id, department_id=dept_ce.id, description="Relational model, SQL, normalization, transaction management")
    sub_os = Subject(name="Operating Systems", subject_code="CS503", semester_id=sem_5.id, department_id=dept_ce.id, description="Process scheduling, concurrency, memory management, file systems")
    sub_se = Subject(name="Software Engineering", subject_code="CS504", semester_id=sem_5.id, department_id=dept_ce.id, description="SDLC, Agile methodology, requirements engineering, UML modeling")
    sub_ai = Subject(name="Artificial Intelligence", subject_code="CS505", semester_id=sem_5.id, department_id=dept_ce.id, description="Search algorithms, knowledge representation, machine learning fundamentals")
    sub_wad = Subject(name="Web Application Development", subject_code="CS506", semester_id=sem_5.id, department_id=dept_ce.id, description="Full-stack client/server systems, RESTful microservices, state management, and web security")
    sub_cc = Subject(name="Cloud Computing & DevOps", subject_code="CS507", semester_id=sem_5.id, department_id=dept_ce.id, description="Virtualization, AWS/GCP cloud services, Docker containers, Kubernetes, CI/CD automation")
    sub_sec = Subject(name="Cyber Security & Cryptography", subject_code="CS508", semester_id=sem_5.id, department_id=dept_ce.id, description="Symmetric/asymmetric ciphers, network vulnerability assessment, web exploitation defense")

    # Computer Engineering Semester 3
    sub_dsa = Subject(name="Data Structures & Algorithms", subject_code="CS301", semester_id=sem_3.id, department_id=dept_ce.id, description="Linear and non-linear data structures, asymptotic complexity analysis, graph traversals")
    sub_java = Subject(name="Object Oriented Programming with Java", subject_code="CS302", semester_id=sem_3.id, department_id=dept_ce.id, description="OOP paradigms, Java collections framework, exception handling, multithreading")
    sub_dlca = Subject(name="Digital Logic & Computer Architecture", subject_code="CS303", semester_id=sem_3.id, department_id=dept_ce.id, description="Combinational logic, sequential circuits, processor datapath, cache hierarchies")

    # Computer Engineering Semester 7
    sub_ml = Subject(name="Machine Learning & Deep Neural Networks", subject_code="CS701", semester_id=sem_7.id, department_id=dept_ce.id, description="Supervised learning, deep backpropagation, CNNs, transformers, generative models")
    sub_dist = Subject(name="Distributed Computing Systems", subject_code="CS702", semester_id=sem_7.id, department_id=dept_ce.id, description="Consensus algorithms, Paxos/Raft protocols, RPC frameworks, partition tolerance")

    # Information Technology Semester 5
    sub_mob = Subject(name="Mobile Application Engineering", subject_code="IT501", semester_id=sem_5.id, department_id=dept_it.id, description="Cross-platform mobile apps, native device hardware APIs, offline data sync")
    sub_iot = Subject(name="Internet of Things (IoT) Systems", subject_code="IT502", semester_id=sem_5.id, department_id=dept_it.id, description="Microcontrollers, sensors, MQTT telemetry, smart campus edge devices")
    
    db.add_all([
        sub_cn, sub_db, sub_os, sub_se, sub_ai, sub_wad, sub_cc, sub_sec,
        sub_dsa, sub_java, sub_dlca,
        sub_ml, sub_dist,
        sub_mob, sub_iot
    ])
    db.flush()

    # 7. Component Types
    comp_types = [
        ComponentType(name="PPT", description="Slide deck presentation and oral defense", icon="Presentation"),
        ComponentType(name="Report", description="Formal technical documentation or thesis", icon="FileText"),
        ComponentType(name="Poster", description="Visual infographic or research poster", icon="Image"),
        ComponentType(name="Handwritten Assignment", description="Physical derivation or analytical notes", icon="PenTool"),
        ComponentType(name="Experiment", description="Laboratory protocol and recorded observations", icon="FlaskConical"),
        ComponentType(name="Certification Course", description="External verified credential (NPTEL, Coursera, etc.)", icon="Award"),
        ComponentType(name="Mini Project", description="Full working software or hardware prototype", icon="Cpu"),
        ComponentType(name="Presentation", description="Classroom demonstration and Q&A", icon="Video"),
        ComponentType(name="Seminar", description="Invited or student-led technical seminar", icon="Users"),
        ComponentType(name="Case Study", description="Critical investigation of a real-world scenario", icon="BookOpen"),
        ComponentType(name="Research Paper", description="Manuscript formatted to IEEE/ACM guidelines", icon="ScrollText"),
    ]
    db.add_all(comp_types)
    db.flush()
    ct_map = {ct.name: ct for ct in comp_types}

    # 8. User Accounts
    # Admin
    u_admin = User(username="admin", password_hash=get_password_hash("Admin@123"), role=UserRole.ADMIN)
    
    # Faculty Accounts (CE, IT, ME)
    u_fac1 = User(username="faculty01", password_hash=get_password_hash("Faculty@123"), role=UserRole.FACULTY)
    u_fac2 = User(username="faculty02", password_hash=get_password_hash("Faculty@123"), role=UserRole.FACULTY)
    u_fac3 = User(username="faculty03", password_hash=get_password_hash("Faculty@123"), role=UserRole.FACULTY)
    u_fac4 = User(username="faculty04", password_hash=get_password_hash("Faculty@123"), role=UserRole.FACULTY)
    u_fac5 = User(username="faculty05", password_hash=get_password_hash("Faculty@123"), role=UserRole.FACULTY)
    u_fac6 = User(username="faculty06", password_hash=get_password_hash("Faculty@123"), role=UserRole.FACULTY)
    u_fac7 = User(username="faculty07", password_hash=get_password_hash("Faculty@123"), role=UserRole.FACULTY)
    u_fac8 = User(username="faculty08", password_hash=get_password_hash("Faculty@123"), role=UserRole.FACULTY)

    # Student Accounts (CE Sem 5 Div A & B, CE Sem 3, IT Sem 5)
    u_stu1 = User(username="230101", password_hash=get_password_hash("Student@123"), role=UserRole.STUDENT)
    u_stu2 = User(username="230102", password_hash=get_password_hash("Student@123"), role=UserRole.STUDENT)
    u_stu3 = User(username="230103", password_hash=get_password_hash("Student@123"), role=UserRole.STUDENT)
    u_stu4 = User(username="230104", password_hash=get_password_hash("Student@123"), role=UserRole.STUDENT)
    u_stu5 = User(username="230105", password_hash=get_password_hash("Student@123"), role=UserRole.STUDENT)
    u_stu6 = User(username="230106", password_hash=get_password_hash("Student@123"), role=UserRole.STUDENT)
    u_stu7 = User(username="230107", password_hash=get_password_hash("Student@123"), role=UserRole.STUDENT)
    u_stu8 = User(username="230108", password_hash=get_password_hash("Student@123"), role=UserRole.STUDENT)
    u_stu9 = User(username="230109", password_hash=get_password_hash("Student@123"), role=UserRole.STUDENT)
    u_stu10 = User(username="230110", password_hash=get_password_hash("Student@123"), role=UserRole.STUDENT)
    u_stu11 = User(username="230111", password_hash=get_password_hash("Student@123"), role=UserRole.STUDENT)
    u_stu12 = User(username="230112", password_hash=get_password_hash("Student@123"), role=UserRole.STUDENT)
    u_stu13 = User(username="230113", password_hash=get_password_hash("Student@123"), role=UserRole.STUDENT)
    u_stu14 = User(username="230114", password_hash=get_password_hash("Student@123"), role=UserRole.STUDENT)
    u_stu15 = User(username="240101", password_hash=get_password_hash("Student@123"), role=UserRole.STUDENT)
    u_stu16 = User(username="240102", password_hash=get_password_hash("Student@123"), role=UserRole.STUDENT)
    u_stu17 = User(username="240103", password_hash=get_password_hash("Student@123"), role=UserRole.STUDENT)
    u_stu18 = User(username="230201", password_hash=get_password_hash("Student@123"), role=UserRole.STUDENT)
    u_stu19 = User(username="230202", password_hash=get_password_hash("Student@123"), role=UserRole.STUDENT)
    u_stu20 = User(username="230203", password_hash=get_password_hash("Student@123"), role=UserRole.STUDENT)

    db.add_all([
        u_admin,
        u_fac1, u_fac2, u_fac3, u_fac4, u_fac5, u_fac6, u_fac7, u_fac8,
        u_stu1, u_stu2, u_stu3, u_stu4, u_stu5, u_stu6, u_stu7, u_stu8,
        u_stu9, u_stu10, u_stu11, u_stu12, u_stu13, u_stu14,
        u_stu15, u_stu16, u_stu17,
        u_stu18, u_stu19, u_stu20
    ])
    db.flush()

    # Faculty Profiles
    f_sharma = Faculty(user_id=u_fac1.id, faculty_code="FAC-CE-01", name="Dr. Rajesh Sharma", department_id=dept_ce.id, email="rajesh.sharma@college.edu", phone="+91 98765 43210")
    f_verma = Faculty(user_id=u_fac2.id, faculty_code="FAC-CE-02", name="Prof. Ananya Verma", department_id=dept_ce.id, email="ananya.verma@college.edu", phone="+91 98765 43211")
    f_kulkarni = Faculty(user_id=u_fac3.id, faculty_code="FAC-CE-03", name="Prof. Sneha Kulkarni", department_id=dept_ce.id, email="sneha.kulkarni@college.edu", phone="+91 98765 43212")
    f_trivedi = Faculty(user_id=u_fac4.id, faculty_code="FAC-CE-04", name="Dr. Amit Trivedi", department_id=dept_ce.id, email="amit.trivedi@college.edu", phone="+91 98765 43213")
    f_gupta = Faculty(user_id=u_fac5.id, faculty_code="FAC-CE-05", name="Prof. Neha Gupta", department_id=dept_ce.id, email="neha.gupta@college.edu", phone="+91 98765 43214")
    f_pandya = Faculty(user_id=u_fac6.id, faculty_code="FAC-IT-01", name="Dr. Manoj Pandya", department_id=dept_it.id, email="manoj.pandya@college.edu", phone="+91 98765 43215")
    f_deshmukh = Faculty(user_id=u_fac7.id, faculty_code="FAC-IT-02", name="Prof. Ritu Deshmukh", department_id=dept_it.id, email="ritu.deshmukh@college.edu", phone="+91 98765 43216")
    f_rathod = Faculty(user_id=u_fac8.id, faculty_code="FAC-ME-01", name="Dr. Suresh Rathod", department_id=dept_me.id, email="suresh.rathod@college.edu", phone="+91 98765 43217")
    db.add_all([f_sharma, f_verma, f_kulkarni, f_trivedi, f_gupta, f_pandya, f_deshmukh, f_rathod])
    db.flush()

    # Student Profiles
    s_rahul = Student(user_id=u_stu1.id, enrollment_number="230101", name="Rahul Patel", department_id=dept_ce.id, semester_id=sem_5.id, division_id=div_a.id, email="rahul.patel@college.edu", phone_number="+91 91234 56780")
    s_aarav = Student(user_id=u_stu2.id, enrollment_number="230102", name="Aarav Shah", department_id=dept_ce.id, semester_id=sem_5.id, division_id=div_a.id, email="aarav.shah@college.edu", phone_number="+91 91234 56781")
    s_priya = Student(user_id=u_stu3.id, enrollment_number="230103", name="Priya Mehta", department_id=dept_ce.id, semester_id=sem_5.id, division_id=div_a.id, email="priya.mehta@college.edu", phone_number="+91 91234 56782")
    s_rohan = Student(user_id=u_stu5.id, enrollment_number="230105", name="Rohan Desai", department_id=dept_ce.id, semester_id=sem_5.id, division_id=div_a.id, email="rohan.desai@college.edu", phone_number="+91 91234 56784")
    s_ananya = Student(user_id=u_stu6.id, enrollment_number="230106", name="Ananya Iyer", department_id=dept_ce.id, semester_id=sem_5.id, division_id=div_a.id, email="ananya.iyer@college.edu", phone_number="+91 91234 56785")
    s_devansh = Student(user_id=u_stu7.id, enrollment_number="230107", name="Devansh Dave", department_id=dept_ce.id, semester_id=sem_5.id, division_id=div_a.id, email="devansh.dave@college.edu", phone_number="+91 91234 56786")
    s_diya = Student(user_id=u_stu8.id, enrollment_number="230108", name="Diya Trivedi", department_id=dept_ce.id, semester_id=sem_5.id, division_id=div_a.id, email="diya.trivedi@college.edu", phone_number="+91 91234 56787")

    s_vikram = Student(user_id=u_stu4.id, enrollment_number="230104", name="Vikram Joshi", department_id=dept_ce.id, semester_id=sem_5.id, division_id=div_b.id, email="vikram.joshi@college.edu", phone_number="+91 91234 56783")
    s_kavya = Student(user_id=u_stu9.id, enrollment_number="230109", name="Kavya Nair", department_id=dept_ce.id, semester_id=sem_5.id, division_id=div_b.id, email="kavya.nair@college.edu", phone_number="+91 91234 56788")
    s_harshil = Student(user_id=u_stu10.id, enrollment_number="230110", name="Harshil Vora", department_id=dept_ce.id, semester_id=sem_5.id, division_id=div_b.id, email="harshil.vora@college.edu", phone_number="+91 91234 56789")
    s_meera = Student(user_id=u_stu11.id, enrollment_number="230111", name="Meera Bhatia", department_id=dept_ce.id, semester_id=sem_5.id, division_id=div_b.id, email="meera.bhatia@college.edu", phone_number="+91 91234 56790")
    s_yash = Student(user_id=u_stu12.id, enrollment_number="230112", name="Yash Rathore", department_id=dept_ce.id, semester_id=sem_5.id, division_id=div_b.id, email="yash.rathore@college.edu", phone_number="+91 91234 56791")
    s_aryan = Student(user_id=u_stu13.id, enrollment_number="230113", name="Aryan Kothari", department_id=dept_ce.id, semester_id=sem_5.id, division_id=div_b.id, email="aryan.kothari@college.edu", phone_number="+91 91234 56792")
    s_pooja = Student(user_id=u_stu14.id, enrollment_number="230114", name="Pooja Solanki", department_id=dept_ce.id, semester_id=sem_5.id, division_id=div_b.id, email="pooja.solanki@college.edu", phone_number="+91 91234 56793")

    s_aditya = Student(user_id=u_stu15.id, enrollment_number="240101", name="Aditya Rao", department_id=dept_ce.id, semester_id=sem_3.id, division_id=div_3a.id, email="aditya.rao@college.edu", phone_number="+91 91234 56794")
    s_ishita = Student(user_id=u_stu16.id, enrollment_number="240102", name="Ishita Sen", department_id=dept_ce.id, semester_id=sem_3.id, division_id=div_3a.id, email="ishita.sen@college.edu", phone_number="+91 91234 56795")
    s_tanmay = Student(user_id=u_stu17.id, enrollment_number="240103", name="Tanmay Kulkarni", department_id=dept_ce.id, semester_id=sem_3.id, division_id=div_3a.id, email="tanmay.kulkarni@college.edu", phone_number="+91 91234 56796")

    s_karan = Student(user_id=u_stu18.id, enrollment_number="230201", name="Karan Singhania", department_id=dept_it.id, semester_id=sem_5_it.id, division_id=div_it_a.id, email="karan.singhania@college.edu", phone_number="+91 91234 56797")
    s_snehal = Student(user_id=u_stu19.id, enrollment_number="230202", name="Snehal Patil", department_id=dept_it.id, semester_id=sem_5_it.id, division_id=div_it_a.id, email="snehal.patil@college.edu", phone_number="+91 91234 56798")
    s_pranav = Student(user_id=u_stu20.id, enrollment_number="230203", name="Pranav Menon", department_id=dept_it.id, semester_id=sem_5_it.id, division_id=div_it_a.id, email="pranav.menon@college.edu", phone_number="+91 91234 56799")

    db.add_all([
        s_rahul, s_aarav, s_priya, s_rohan, s_ananya, s_devansh, s_diya,
        s_vikram, s_kavya, s_harshil, s_meera, s_yash, s_aryan, s_pooja,
        s_aditya, s_ishita, s_tanmay,
        s_karan, s_snehal, s_pranav
    ])
    db.flush()

    # 9. PBL Activities (Current Semester 5)
    # PBL 1: Computer Networks
    pbl_cn = PblActivity(
        title="Computer Networks Hands-on PBL",
        description="Comprehensive network architecture and packet routing implementation across LAN and WAN protocols.",
        subject_id=sub_cn.id,
        academic_year_id=ay_current.id,
        semester_id=sem_5.id,
        department_id=dept_ce.id,
        start_date=date(2026, 7, 15),
        end_date=date(2026, 11, 30),
        status=PblStatus.ACTIVE,
        created_by=u_fac1.id
    )
    # PBL 2: DBMS
    pbl_db = PblActivity(
        title="Database Systems Real-World Modeling",
        description="Enterprise schema design, B-tree indexing optimization, and ACID compliant database development.",
        subject_id=sub_db.id,
        academic_year_id=ay_current.id,
        semester_id=sem_5.id,
        department_id=dept_ce.id,
        start_date=date(2026, 7, 15),
        end_date=date(2026, 11, 30),
        status=PblStatus.ACTIVE,
        created_by=u_fac2.id
    )
    # PBL 3: Operating Systems
    pbl_os = PblActivity(
        title="OS Kernel & Concurrency PBL",
        description="Linux scheduling simulation, inter-process communication pipelines, and virtual memory paging analysis.",
        subject_id=sub_os.id,
        academic_year_id=ay_current.id,
        semester_id=sem_5.id,
        department_id=dept_ce.id,
        start_date=date(2026, 8, 1),
        end_date=date(2026, 11, 20),
        status=PblStatus.ACTIVE,
        created_by=u_fac1.id
    )
    # PBL 4: Software Engineering
    pbl_se = PblActivity(
        title="Agile Software Engineering Practicum",
        description="Scrum lifecycle simulation, user story refinement, automated unit testing, and architectural modeling.",
        subject_id=sub_se.id,
        academic_year_id=ay_current.id,
        semester_id=sem_5.id,
        department_id=dept_ce.id,
        start_date=date(2026, 8, 1),
        end_date=date(2026, 11, 25),
        status=PblStatus.ACTIVE,
        created_by=u_fac2.id
    )
    # PBL 5: AI
    pbl_ai = PblActivity(
        title="Applied Artificial Intelligence Studio",
        description="Heuristic pathfinding, adversarial game trees, and neural network classification modeling.",
        subject_id=sub_ai.id,
        academic_year_id=ay_current.id,
        semester_id=sem_5.id,
        department_id=dept_ce.id,
        start_date=date(2026, 8, 10),
        end_date=date(2026, 12, 5),
        status=PblStatus.ACTIVE,
        created_by=u_fac1.id
    )
    # PBL 6: Web App Development (DRAFT - Hidden mode demonstration)
    pbl_wad = PblActivity(
        title="Full Stack Web Applications & Real-time Sockets",
        description="Design and implement a cloud-deployed collaborative web platform with authentication, state caching, and responsive UI.",
        subject_id=sub_wad.id,
        academic_year_id=ay_current.id,
        semester_id=sem_5.id,
        department_id=dept_ce.id,
        start_date=date(2026, 8, 15),
        end_date=date(2026, 12, 10),
        status=PblStatus.DRAFT,  # Hidden from students until faculty publishes!
        created_by=u_fac1.id
    )

    db.add_all([pbl_cn, pbl_db, pbl_os, pbl_se, pbl_ai, pbl_wad])
    db.flush()

    # Faculty Assignments to PBLs
    db.add_all([
        PblFaculty(pbl_activity_id=pbl_cn.id, faculty_id=f_sharma.id, role_description="Lead Coordinator"),
        PblFaculty(pbl_activity_id=pbl_cn.id, faculty_id=f_verma.id, role_description="Lab Evaluator"),
        PblFaculty(pbl_activity_id=pbl_cn.id, faculty_id=f_gupta.id, role_description="Network Security Guide"),
        PblFaculty(pbl_activity_id=pbl_db.id, faculty_id=f_verma.id, role_description="Lead Coordinator"),
        PblFaculty(pbl_activity_id=pbl_db.id, faculty_id=f_gupta.id, role_description="Query Evaluator"),
        PblFaculty(pbl_activity_id=pbl_os.id, faculty_id=f_sharma.id, role_description="Lead Coordinator"),
        PblFaculty(pbl_activity_id=pbl_os.id, faculty_id=f_kulkarni.id, role_description="Concurrency Guide"),
        PblFaculty(pbl_activity_id=pbl_se.id, faculty_id=f_verma.id, role_description="Lead Coordinator"),
        PblFaculty(pbl_activity_id=pbl_se.id, faculty_id=f_trivedi.id, role_description="Agile Scrum Mentor"),
        PblFaculty(pbl_activity_id=pbl_ai.id, faculty_id=f_sharma.id, role_description="Lead Coordinator"),
        PblFaculty(pbl_activity_id=pbl_ai.id, faculty_id=f_kulkarni.id, role_description="AI Lead Mentor"),
        PblFaculty(pbl_activity_id=pbl_wad.id, faculty_id=f_sharma.id, role_description="Lead Coordinator"),
        PblFaculty(pbl_activity_id=pbl_wad.id, faculty_id=f_trivedi.id, role_description="Full Stack Guide"),
    ])
    db.flush()

    # 10. Components
    # Computer Networks components
    c_cn_exp = Component(
        pbl_activity_id=pbl_cn.id,
        component_type_id=ct_map["Experiment"].id,
        title="Wireshark Packet Capture & Protocol Inspection",
        description="Capture live HTTP, DNS, and TCP handshake packets. Analyze sequence and acknowledgment numbers.",
        deadline=now + timedelta(days=2),  # DUE SOON!
        submission_required=True,
        external_submission_url="https://forms.google.com/sample-cn-exp-submit",
        external_classroom_url="https://classroom.google.com/c/sample-cn-classroom",
        is_group=False,
        created_by=u_fac1.id
    )
    c_cn_ppt = Component(
        pbl_activity_id=pbl_cn.id,
        component_type_id=ct_map["PPT"].id,
        title="Network Topology & Packet Tracer Simulation",
        description="Design a 3-router subnet topology in Cisco Packet Tracer and present routing convergence time.",
        deadline=now + timedelta(days=6),  # UPCOMING
        submission_required=True,
        external_submission_url="https://forms.google.com/sample-cn-ppt-submit",
        external_classroom_url="https://classroom.google.com/c/sample-cn-classroom",
        is_group=False,
        created_by=u_fac1.id
    )
    c_cn_rep = Component(
        pbl_activity_id=pbl_cn.id,
        component_type_id=ct_map["Report"].id,
        title="Routing Protocols Comparative Analysis",
        description="Comprehensive group technical report comparing OSPF Dijkstra vs BGP distance-vector latency.",
        deadline=now + timedelta(days=16),
        submission_required=True,
        external_submission_url="https://forms.google.com/sample-cn-report-submit",
        is_group=True,
        created_by=u_fac1.id
    )

    # DBMS components
    c_db_rep = Component(
        pbl_activity_id=pbl_db.id,
        component_type_id=ct_map["Report"].id,
        title="ER Diagram and Relational Algebra Documentation",
        description="Document comprehensive Entity-Relationship diagrams with Cardinality and 3NF normalization proofs.",
        deadline=now - timedelta(days=1),  # OVERDUE for demonstration!
        submission_required=True,
        external_submission_url="https://forms.google.com/sample-db-er-submit",
        is_group=False,
        created_by=u_fac2.id
    )
    c_db_cert = Component(
        pbl_activity_id=pbl_db.id,
        component_type_id=ct_map["Certification Course"].id,
        title="Database Certification (MongoDB University or Oracle SQL)",
        description="Submit verified certificate credential from MongoDB University or equivalent accredited provider.",
        deadline=now + timedelta(days=20),
        submission_required=True,
        external_submission_url="https://forms.google.com/sample-db-cert-submit",
        is_group=False,
        created_by=u_fac2.id
    )
    c_db_proj = Component(
        pbl_activity_id=pbl_db.id,
        component_type_id=ct_map["Mini Project"].id,
        title="College Portal Database Backend with Stored Procedures",
        description="Group project implementing normalized PostgreSQL tables, complex trigger procedures, and indexing.",
        deadline=now + timedelta(days=28),
        submission_required=True,
        external_submission_url="https://forms.google.com/sample-db-proj-submit",
        is_group=True,
        created_by=u_fac2.id
    )

    # OS components
    c_os_hw = Component(
        pbl_activity_id=pbl_os.id,
        component_type_id=ct_map["Handwritten Assignment"].id,
        title="Deadlock Detection & CPU Scheduling Derivations",
        description="Handwritten derivations of Banker's safety algorithm and Round Robin turnaround time tables.",
        deadline=now + timedelta(days=8),
        submission_required=True,
        external_submission_url="https://forms.google.com/sample-os-hw-submit",
        is_group=False,
        created_by=u_fac1.id
    )
    c_os_sem = Component(
        pbl_activity_id=pbl_os.id,
        component_type_id=ct_map["Seminar"].id,
        title="UNIX VFS & Virtual Memory Paging Seminar",
        description="Present technical seminar on virtual file system layers and demand paging in modern OS kernels.",
        deadline=now + timedelta(days=18),
        submission_required=False,
        is_group=False,
        created_by=u_fac1.id
    )

    # SE components
    c_se_case = Component(
        pbl_activity_id=pbl_se.id,
        component_type_id=ct_map["Case Study"].id,
        title="Agile vs Waterfall Enterprise Migration Case Study",
        description="Analyze post-mortem reports of enterprise IT architecture modernization failures and successes.",
        deadline=now + timedelta(days=12),
        submission_required=True,
        external_submission_url="https://forms.google.com/sample-se-case-submit",
        is_group=False,
        created_by=u_fac2.id
    )
    c_se_proj = Component(
        pbl_activity_id=pbl_se.id,
        component_type_id=ct_map["Mini Project"].id,
        title="SRS Documentation & Interactive Figma Prototype",
        description="Draft IEEE 830 compliant Software Requirements Specification along with high-fidelity UI designs.",
        deadline=now + timedelta(days=22),
        submission_required=True,
        external_submission_url="https://forms.google.com/sample-se-proj-submit",
        is_group=True,
        created_by=u_fac2.id
    )

    # AI components
    c_ai_paper = Component(
        pbl_activity_id=pbl_ai.id,
        component_type_id=ct_map["Research Paper"].id,
        title="Heuristic Search Strategies for Pathfinding (A* & IDA*)",
        description="Empirical benchmark paper comparing Euclidean vs Manhattan heuristics across maze topologies.",
        deadline=now + timedelta(days=14),
        submission_required=True,
        external_submission_url="https://forms.google.com/sample-ai-paper-submit",
        is_group=False,
        created_by=u_fac1.id
    )
    c_ai_post = Component(
        pbl_activity_id=pbl_ai.id,
        component_type_id=ct_map["Poster"].id,
        title="Explainable AI & Ethical Decision Frameworks",
        description="Visual research poster covering algorithmic bias and SHAP explainability in automated decisions.",
        deadline=now + timedelta(days=32),
        submission_required=True,
        external_submission_url="https://forms.google.com/sample-ai-poster-submit",
        is_group=False,
        created_by=u_fac1.id
    )

    # WAD components (draft/hidden along with pbl_wad)
    c_wad_spec = Component(
        pbl_activity_id=pbl_wad.id,
        component_type_id=ct_map["Report"].id,
        title="System Architecture & OpenAPI Specification",
        description="Define entity schemas, RESTful endpoint routes, and authentication flow documentation.",
        deadline=now + timedelta(days=10),
        submission_required=True,
        external_submission_url="https://forms.google.com/sample-wad-spec",
        is_group=False,
        created_by=u_fac1.id
    )
    c_wad_app = Component(
        pbl_activity_id=pbl_wad.id,
        component_type_id=ct_map["Mini Project"].id,
        title="Interactive Frontend & WebSocket Engine Prototype",
        description="Deploy working multi-user web application with responsive UI and live event broadcasting.",
        deadline=now + timedelta(days=25),
        submission_required=True,
        external_submission_url="https://forms.google.com/sample-wad-app",
        is_group=True,
        created_by=u_fac1.id
    )

    all_components = [
        c_cn_exp, c_cn_ppt, c_cn_rep,
        c_db_rep, c_db_cert, c_db_proj,
        c_os_hw, c_os_sem,
        c_se_case, c_se_proj,
        c_ai_paper, c_ai_post,
        c_wad_spec, c_wad_app
    ]
    db.add_all(all_components)
    db.flush()

    # 11. Groups & Projects
    # Group Alpha in Computer Networks (Rahul Patel + Aarav Shah)
    grp_cn = Group(
        pbl_activity_id=pbl_cn.id,
        group_name="Group Alpha",
        group_code="GRP-CN-01",
        created_by=u_fac1.id
    )
    db.add(grp_cn)
    db.flush()
    db.add_all([
        GroupMember(group_id=grp_cn.id, student_id=s_rahul.id),
        GroupMember(group_id=grp_cn.id, student_id=s_aarav.id)
    ])
    db.flush()

    proj_cn = Project(
        group_id=grp_cn.id,
        pbl_activity_id=pbl_cn.id,
        title="High-Throughput Campus WAN Optimization",
        topic="Dynamic BGP Mesh Routing",
        description="Simulating dynamic route re-convergence during link failure across multiple campus gateway nodes.",
        guide_faculty_id=f_sharma.id,
        status="In Progress",
        external_url="https://github.com/sample-org/campus-wan-pbl"
    )
    db.add(proj_cn)

    # Group Beta in DBMS (Rahul Patel + Priya Mehta)
    grp_db = Group(
        pbl_activity_id=pbl_db.id,
        group_name="Group Matrix",
        group_code="GRP-DB-02",
        created_by=u_fac2.id
    )
    db.add(grp_db)
    db.flush()
    db.add_all([
        GroupMember(group_id=grp_db.id, student_id=s_rahul.id),
        GroupMember(group_id=grp_db.id, student_id=s_priya.id)
    ])
    db.flush()

    # Group Gamma in Computer Networks (Rohan Desai + Ananya Iyer + Devansh Dave)
    grp_cn2 = Group(
        pbl_activity_id=pbl_cn.id,
        group_name="Packet Sniffers",
        group_code="GRP-CN-02",
        created_by=u_fac1.id
    )
    db.add(grp_cn2)
    db.flush()
    db.add_all([
        GroupMember(group_id=grp_cn2.id, student_id=s_rohan.id),
        GroupMember(group_id=grp_cn2.id, student_id=s_ananya.id),
        GroupMember(group_id=grp_cn2.id, student_id=s_devansh.id)
    ])
    db.flush()

    proj_cn2 = Project(
        group_id=grp_cn2.id,
        pbl_activity_id=pbl_cn.id,
        title="Software-Defined Network Topology Controller",
        topic="SDN Flow Routing",
        description="Implementing centralized OpenFlow controller for intelligent packet steering across campus subnets.",
        guide_faculty_id=f_gupta.id,
        status="In Progress",
        external_url="https://github.com/sample-org/sdn-controller"
    )
    db.add(proj_cn2)

    # Group Delta in Computer Networks (Kavya Nair + Harshil Vora + Meera Bhatia)
    grp_cn3 = Group(
        pbl_activity_id=pbl_cn.id,
        group_name="ByteForge",
        group_code="GRP-CN-03",
        created_by=u_fac1.id
    )
    db.add(grp_cn3)
    db.flush()
    db.add_all([
        GroupMember(group_id=grp_cn3.id, student_id=s_kavya.id),
        GroupMember(group_id=grp_cn3.id, student_id=s_harshil.id),
        GroupMember(group_id=grp_cn3.id, student_id=s_meera.id)
    ])
    db.flush()

    proj_cn3 = Project(
        group_id=grp_cn3.id,
        pbl_activity_id=pbl_cn.id,
        title="Zero-Trust Mesh Network for IoT Campus Sensors",
        topic="Network Security & Zero Trust",
        description="Securing sensor nodes with mutual TLS authentication and micro-segmented network policies.",
        guide_faculty_id=f_sharma.id,
        status="In Progress",
        external_url="https://github.com/sample-org/zero-trust-mesh"
    )
    db.add(proj_cn3)

    # Group Epsilon in DBMS (Diya Trivedi + Yash Rathore + Aryan Kothari)
    grp_db2 = Group(
        pbl_activity_id=pbl_db.id,
        group_name="DataWeavers",
        group_code="GRP-DB-03",
        created_by=u_fac2.id
    )
    db.add(grp_db2)
    db.flush()
    db.add_all([
        GroupMember(group_id=grp_db2.id, student_id=s_diya.id),
        GroupMember(group_id=grp_db2.id, student_id=s_yash.id),
        GroupMember(group_id=grp_db2.id, student_id=s_aryan.id)
    ])
    db.flush()

    proj_db2 = Project(
        group_id=grp_db2.id,
        pbl_activity_id=pbl_db.id,
        title="Distributed Key-Value Store with Raft Consensus",
        topic="Distributed Database Systems",
        description="Fault-tolerant partitioned transaction storage engine with consensus replication.",
        guide_faculty_id=f_verma.id,
        status="In Progress",
        external_url="https://github.com/sample-org/raft-kv-store"
    )
    db.add(proj_db2)

    # 13. Student Progress & Faculty Evaluations
    # Rahul Patel (230101)
    p_db_cert = StudentComponentProgress(
        student_id=s_rahul.id,
        component_id=c_db_cert.id,
        progress_state=ProgressState.DONE,
        submission_state=SubmissionState.ACCEPTED,
        submitted_at=now - timedelta(days=5),
        faculty_feedback="Verified credential from MongoDB University. Excellent score in query aggregation.",
        reviewed_by_faculty_id=f_verma.id,
        reviewed_at=now - timedelta(days=4)
    )
    p_se_case = StudentComponentProgress(
        student_id=s_rahul.id,
        component_id=c_se_case.id,
        progress_state=ProgressState.DONE,
        submission_state=SubmissionState.ACCEPTED,
        submitted_at=now - timedelta(days=3),
        faculty_feedback="Thorough case study analysis with clear architectural patterns.",
        reviewed_by_faculty_id=f_sharma.id,
        reviewed_at=now - timedelta(days=2)
    )
    p_cn_exp = StudentComponentProgress(
        student_id=s_rahul.id,
        component_id=c_cn_exp.id,
        progress_state=ProgressState.IN_PROGRESS,
        submission_state=SubmissionState.NOT_SUBMITTED
    )
    p_db_rep = StudentComponentProgress(
        student_id=s_rahul.id,
        component_id=c_db_rep.id,
        progress_state=ProgressState.TODO,
        submission_state=SubmissionState.NOT_SUBMITTED
    )
    p_cn_ppt = StudentComponentProgress(
        student_id=s_rahul.id,
        component_id=c_cn_ppt.id,
        progress_state=ProgressState.IN_PROGRESS,
        submission_state=SubmissionState.SUBMITTED,
        submitted_at=now - timedelta(days=1)
    )

    # Aarav Shah (230102)
    p_aarav_ppt = StudentComponentProgress(
        student_id=s_aarav.id,
        component_id=c_cn_ppt.id,
        progress_state=ProgressState.DONE,
        submission_state=SubmissionState.SUBMITTED,
        submitted_at=now - timedelta(days=1)
    )
    p_aarav_db = StudentComponentProgress(
        student_id=s_aarav.id,
        component_id=c_db_cert.id,
        progress_state=ProgressState.DONE,
        submission_state=SubmissionState.ACCEPTED,
        submitted_at=now - timedelta(days=4),
        faculty_feedback="Stanford Online Database course certificate verified. Excellent work.",
        reviewed_by_faculty_id=f_verma.id,
        reviewed_at=now - timedelta(days=3)
    )

    # Priya Mehta (230103)
    p_priya_ppt = StudentComponentProgress(
        student_id=s_priya.id,
        component_id=c_cn_ppt.id,
        progress_state=ProgressState.DONE,
        submission_state=SubmissionState.SUBMITTED,
        submitted_at=now - timedelta(hours=14)
    )
    p_priya_case = StudentComponentProgress(
        student_id=s_priya.id,
        component_id=c_se_case.id,
        progress_state=ProgressState.IN_PROGRESS,
        submission_state=SubmissionState.REJECTED,
        submitted_at=now - timedelta(days=2),
        faculty_feedback="UML sequence diagrams are missing error handling flow. Please revise and resubmit.",
        reviewed_by_faculty_id=f_verma.id,
        reviewed_at=now - timedelta(days=1)
    )

    # Rohan Desai (230105)
    p_rohan_exp = StudentComponentProgress(
        student_id=s_rohan.id,
        component_id=c_cn_exp.id,
        progress_state=ProgressState.DONE,
        submission_state=SubmissionState.SUBMITTED,
        submitted_at=now - timedelta(hours=5)
    )

    # Ananya Iyer (230106)
    p_ananya_ppt = StudentComponentProgress(
        student_id=s_ananya.id,
        component_id=c_cn_ppt.id,
        progress_state=ProgressState.DONE,
        submission_state=SubmissionState.ACCEPTED,
        submitted_at=now - timedelta(days=2),
        faculty_feedback="Exceptional slide design and crisp OSI explanation.",
        reviewed_by_faculty_id=f_sharma.id,
        reviewed_at=now - timedelta(days=1)
    )
    p_ananya_case = StudentComponentProgress(
        student_id=s_ananya.id,
        component_id=c_se_case.id,
        progress_state=ProgressState.DONE,
        submission_state=SubmissionState.SUBMITTED,
        submitted_at=now - timedelta(hours=8)
    )

    # Kavya Nair (230109)
    p_kavya_exp = StudentComponentProgress(
        student_id=s_kavya.id,
        component_id=c_cn_exp.id,
        progress_state=ProgressState.IN_PROGRESS,
        submission_state=SubmissionState.REJECTED,
        submitted_at=now - timedelta(days=2),
        faculty_feedback="Packet capture file was truncated. Please upload full .pcapng trace.",
        reviewed_by_faculty_id=f_sharma.id,
        reviewed_at=now - timedelta(days=1)
    )
    p_kavya_db = StudentComponentProgress(
        student_id=s_kavya.id,
        component_id=c_db_rep.id,
        progress_state=ProgressState.DONE,
        submission_state=SubmissionState.SUBMITTED,
        submitted_at=now - timedelta(hours=3)
    )

    # Harshil Vora (230110)
    p_harshil_cert = StudentComponentProgress(
        student_id=s_harshil.id,
        component_id=c_db_cert.id,
        progress_state=ProgressState.DONE,
        submission_state=SubmissionState.SUBMITTED,
        submitted_at=now - timedelta(hours=10)
    )

    # Diya Trivedi (230108)
    p_diya_exp = StudentComponentProgress(
        student_id=s_diya.id,
        component_id=c_cn_exp.id,
        progress_state=ProgressState.DONE,
        submission_state=SubmissionState.SUBMITTED,
        submitted_at=now - timedelta(hours=6)
    )

    db.add_all([
        p_db_cert, p_se_case, p_cn_exp, p_db_rep, p_cn_ppt,
        p_aarav_ppt, p_aarav_db,
        p_priya_ppt, p_priya_case,
        p_rohan_exp,
        p_ananya_ppt, p_ananya_case,
        p_kavya_exp, p_kavya_db,
        p_harshil_cert,
        p_diya_exp
    ])
    db.flush()

    # 14. Notifications for Rahul Patel
    db.add_all([
        Notification(
            user_id=u_stu1.id,
            title="Faculty Feedback Received",
            message="Prof. Ananya Verma added feedback on your Database Certification: Verified credential!",
            link=f"/student/pbl/{pbl_db.id}",
            is_read=False
        ),
        Notification(
            user_id=u_stu1.id,
            title="Deadline Approaching: Wireshark Experiment",
            message="Wireshark Packet Capture & Protocol Inspection is due in 2 days. Complete your capture analysis.",
            link=f"/student/pbl/{pbl_cn.id}",
            is_read=False
        ),
        Notification(
            user_id=u_stu1.id,
            title="Topic Approved",
            message="Your proposed topic 'Adaptive Congestion Control in Campus WiFi 6' is approved for Computer Networks.",
            link=f"/student/pbl/{pbl_cn.id}",
            is_read=True
        ),
    ])

    db.commit()
    if should_close:
        db.close()
    print("Demo data seeded successfully!")


if __name__ == "__main__":
    import sys
    do_reset = "--reset" in sys.argv or "-r" in sys.argv
    seed_database(reset=do_reset)
