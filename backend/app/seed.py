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
    TopicMode,
)
from app.models.group import Group, GroupMember, Project
from app.models.topic import Topic, TopicStatus
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
        from app.models import base, user, academic, pbl, group, topic, progress, notification  # noqa
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
    db.add_all([sem_3, sem_5, sem_7])
    db.flush()

    # 5. Divisions
    div_a = Division(name="A", semester_id=sem_5.id, department_id=dept_ce.id)
    div_b = Division(name="B", semester_id=sem_5.id, department_id=dept_ce.id)
    db.add_all([div_a, div_b])
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
    # Faculty
    u_fac1 = User(username="faculty01", password_hash=get_password_hash("Faculty@123"), role=UserRole.FACULTY)
    u_fac2 = User(username="faculty02", password_hash=get_password_hash("Faculty@123"), role=UserRole.FACULTY)
    # Students
    u_stu1 = User(username="230101", password_hash=get_password_hash("Student@123"), role=UserRole.STUDENT)
    u_stu2 = User(username="230102", password_hash=get_password_hash("Student@123"), role=UserRole.STUDENT)
    u_stu3 = User(username="230103", password_hash=get_password_hash("Student@123"), role=UserRole.STUDENT)
    u_stu4 = User(username="230104", password_hash=get_password_hash("Student@123"), role=UserRole.STUDENT)

    db.add_all([u_admin, u_fac1, u_fac2, u_stu1, u_stu2, u_stu3, u_stu4])
    db.flush()

    # Faculty Profiles
    f_sharma = Faculty(user_id=u_fac1.id, faculty_code="FAC-CE-01", name="Dr. Rajesh Sharma", department_id=dept_ce.id, email="rajesh.sharma@college.edu", phone="+91 98765 43210")
    f_verma = Faculty(user_id=u_fac2.id, faculty_code="FAC-CE-02", name="Prof. Ananya Verma", department_id=dept_ce.id, email="ananya.verma@college.edu", phone="+91 98765 43211")
    db.add_all([f_sharma, f_verma])
    db.flush()

    # Student Profiles
    s_rahul = Student(user_id=u_stu1.id, enrollment_number="230101", name="Rahul Patel", department_id=dept_ce.id, semester_id=sem_5.id, division_id=div_a.id, email="rahul.patel@college.edu", phone_number="+91 91234 56780")
    s_aarav = Student(user_id=u_stu2.id, enrollment_number="230102", name="Aarav Shah", department_id=dept_ce.id, semester_id=sem_5.id, division_id=div_a.id, email="aarav.shah@college.edu", phone_number="+91 91234 56781")
    s_priya = Student(user_id=u_stu3.id, enrollment_number="230103", name="Priya Mehta", department_id=dept_ce.id, semester_id=sem_5.id, division_id=div_a.id, email="priya.mehta@college.edu", phone_number="+91 91234 56782")
    s_vikram = Student(user_id=u_stu4.id, enrollment_number="230104", name="Vikram Joshi", department_id=dept_ce.id, semester_id=sem_5.id, division_id=div_b.id, email="vikram.joshi@college.edu", phone_number="+91 91234 56783")
    db.add_all([s_rahul, s_aarav, s_priya, s_vikram])
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
        topic_mode=TopicMode.STUDENT_PROPOSED,
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
        topic_mode=TopicMode.STUDENT_LIST,
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
        topic_mode=TopicMode.FACULTY_ASSIGNED,
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
        topic_mode=TopicMode.STUDENT_PROPOSED,
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
        topic_mode=TopicMode.NO_TOPIC,
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
        topic_mode=TopicMode.STUDENT_PROPOSED,
        created_by=u_fac1.id
    )

    db.add_all([pbl_cn, pbl_db, pbl_os, pbl_se, pbl_ai, pbl_wad])
    db.flush()

    # Faculty Assignments to PBLs
    db.add_all([
        PblFaculty(pbl_activity_id=pbl_cn.id, faculty_id=f_sharma.id, role_description="Lead Coordinator"),
        PblFaculty(pbl_activity_id=pbl_cn.id, faculty_id=f_verma.id, role_description="Lab Evaluator"),
        PblFaculty(pbl_activity_id=pbl_db.id, faculty_id=f_verma.id, role_description="Lead Coordinator"),
        PblFaculty(pbl_activity_id=pbl_os.id, faculty_id=f_sharma.id, role_description="Lead Coordinator"),
        PblFaculty(pbl_activity_id=pbl_se.id, faculty_id=f_verma.id, role_description="Lead Coordinator"),
        PblFaculty(pbl_activity_id=pbl_ai.id, faculty_id=f_sharma.id, role_description="Lead Coordinator"),
        PblFaculty(pbl_activity_id=pbl_wad.id, faculty_id=f_sharma.id, role_description="Lead Coordinator"),
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

    # 12. Topics
    # Student Proposed topic (approved per platform rules)
    t_proposed = Topic(
        pbl_activity_id=pbl_cn.id,
        title="Adaptive Congestion Control in Campus WiFi 6 Subnets",
        description="Proposing deep reinforcement learning for dynamic contention window tuning in dense auditoriums.",
        mode=TopicMode.STUDENT_PROPOSED,
        status=TopicStatus.APPROVED,
        proposed_by_student_id=s_rahul.id,
        assigned_to_group_id=grp_cn.id
    )
    db.add(t_proposed)

    # Topic Pool for DBMS
    t_pool1 = Topic(
        pbl_activity_id=pbl_db.id,
        title="Real-Time Hospital Bed Allocation & Patient Triage DB",
        description="Multi-tenant relational database with row-level locking for ICU emergency ward reservations.",
        mode=TopicMode.STUDENT_LIST,
        status=TopicStatus.APPROVED,
        assigned_to_group_id=grp_db.id
    )
    t_pool2 = Topic(
        pbl_activity_id=pbl_db.id,
        title="High-Frequency Stock Trade Ledger with Audit Trails",
        description="Append-only transaction log design using partitioned PostgreSQL tables.",
        mode=TopicMode.STUDENT_LIST,
        status=TopicStatus.APPROVED
    )
    db.add_all([t_pool1, t_pool2])

    # 13. Student Progress & Faculty Evaluations for Rahul Patel (230101)
    # Certification completed & ACCEPTED with faculty feedback
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
    # Case study completed & ACCEPTED with faculty feedback
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
    # Wireshark in progress
    p_cn_exp = StudentComponentProgress(
        student_id=s_rahul.id,
        component_id=c_cn_exp.id,
        progress_state=ProgressState.IN_PROGRESS,
        submission_state=SubmissionState.NOT_SUBMITTED
    )
    # ER Diagram overdue & not submitted
    p_db_rep = StudentComponentProgress(
        student_id=s_rahul.id,
        component_id=c_db_rep.id,
        progress_state=ProgressState.TODO,
        submission_state=SubmissionState.NOT_SUBMITTED
    )
    # PPT in progress & submitted for faculty review
    p_cn_ppt = StudentComponentProgress(
        student_id=s_rahul.id,
        component_id=c_cn_ppt.id,
        progress_state=ProgressState.IN_PROGRESS,
        submission_state=SubmissionState.SUBMITTED,
        submitted_at=now - timedelta(days=1)
    )

    db.add_all([p_db_cert, p_se_case, p_cn_exp, p_db_rep, p_cn_ppt])
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
