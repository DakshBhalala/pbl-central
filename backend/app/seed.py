from datetime import datetime, date, timedelta, timezone
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, init_db
from app.core.security import get_password_hash
from app.models.user import User, Student, Faculty, UserRole
from app.models.academic import Department, Program, AcademicYear, Semester, Division, Subject
from app.models.pbl import (
    ComponentType,
    PblActivity,
    PblFaculty,
    Component,
    ComponentAssignment,
    PblStatus,
    TopicMode,
    AssignmentScope,
)
from app.models.group import Group, GroupMember, Project
from app.models.topic import Topic, TopicHistory, TopicStatus
from app.models.progress import (
    StudentComponentProgress,
    FacultyReview,
    ProgressState,
    SubmissionState,
)
from app.models.notification import Notification


def seed_database(db: Session = None):
    init_db()
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    # Avoid duplicate seeding if admin user already exists
    if db.query(User).filter(User.username == "admin").first():
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

    # 2. Programs
    prog_btech = Program(name="Bachelor of Technology in Computer Engineering", code="BTECH-CE", department_id=dept_ce.id)
    db.add(prog_btech)
    db.flush()

    # 3. Academic Years
    ay_current = AcademicYear(name="2026–27", start_date=date(2026, 7, 1), end_date=date(2027, 6, 30), is_current=True)
    ay_past = AcademicYear(name="2025–26", start_date=date(2025, 7, 1), end_date=date(2026, 6, 30), is_current=False)
    db.add_all([ay_current, ay_past])
    db.flush()

    # 4. Semesters
    sem_3 = Semester(name="Semester 3", number=3, academic_year_id=ay_current.id, department_id=dept_ce.id, program_id=prog_btech.id)
    sem_5 = Semester(name="Semester 5", number=5, academic_year_id=ay_current.id, department_id=dept_ce.id, program_id=prog_btech.id)
    sem_7 = Semester(name="Semester 7", number=7, academic_year_id=ay_current.id, department_id=dept_ce.id, program_id=prog_btech.id)
    sem_5_past = Semester(name="Semester 5 (2025)", number=5, academic_year_id=ay_past.id, department_id=dept_ce.id, program_id=prog_btech.id)
    db.add_all([sem_3, sem_5, sem_7, sem_5_past])
    db.flush()

    # 5. Divisions
    div_a = Division(name="A", semester_id=sem_5.id, department_id=dept_ce.id)
    div_b = Division(name="B", semester_id=sem_5.id, department_id=dept_ce.id)
    db.add_all([div_a, div_b])
    db.flush()

    # 6. Subjects (Computer Engineering Semester 5)
    sub_cn = Subject(name="Computer Networks", subject_code="CS501", semester_id=sem_5.id, department_id=dept_ce.id, description="Data communication, OSI model, IP routing, packet inspection")
    sub_db = Subject(name="Database Management Systems", subject_code="CS502", semester_id=sem_5.id, department_id=dept_ce.id, description="Relational model, SQL, normalization, transaction management")
    sub_os = Subject(name="Operating Systems", subject_code="CS503", semester_id=sem_5.id, department_id=dept_ce.id, description="Process scheduling, concurrency, memory management, file systems")
    sub_se = Subject(name="Software Engineering", subject_code="CS504", semester_id=sem_5.id, department_id=dept_ce.id, description="SDLC, Agile methodology, requirements engineering, UML modeling")
    sub_ai = Subject(name="Artificial Intelligence", subject_code="CS505", semester_id=sem_5.id, department_id=dept_ce.id, description="Search algorithms, knowledge representation, machine learning fundamentals")
    
    # Historical subject
    sub_cn_past = Subject(name="Computer Networks (Old)", subject_code="CS501-OLD", semester_id=sem_5_past.id, department_id=dept_ce.id, description="Historical CN curriculum")
    db.add_all([sub_cn, sub_db, sub_os, sub_se, sub_ai, sub_cn_past])
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
    f_sharma = Faculty(user_id=u_fac1.id, faculty_code="FAC-CE-01", name="Dr. Rajesh Sharma", email="rajesh.sharma@college.edu", phone="+91 98765 43210")
    f_verma = Faculty(user_id=u_fac2.id, faculty_code="FAC-CE-02", name="Prof. Ananya Verma", email="ananya.verma@college.edu", phone="+91 98765 43211")
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
    # Historical PBL for Archive testing
    pbl_cn_past = PblActivity(
        title="Computer Networks PBL (2025)",
        description="Historical archive of 2025 computer networks cohort.",
        subject_id=sub_cn_past.id,
        academic_year_id=ay_past.id,
        semester_id=sem_5_past.id,
        department_id=dept_ce.id,
        start_date=date(2025, 7, 15),
        end_date=date(2025, 11, 30),
        status=PblStatus.ARCHIVED,
        created_by=u_fac1.id
    )

    db.add_all([pbl_cn, pbl_db, pbl_os, pbl_se, pbl_ai, pbl_cn_past])
    db.flush()

    # Faculty Assignments to PBLs
    db.add_all([
        PblFaculty(pbl_activity_id=pbl_cn.id, faculty_id=f_sharma.id, role_description="Lead Coordinator"),
        PblFaculty(pbl_activity_id=pbl_cn.id, faculty_id=f_verma.id, role_description="Lab Evaluator"),
        PblFaculty(pbl_activity_id=pbl_db.id, faculty_id=f_verma.id, role_description="Lead Coordinator"),
        PblFaculty(pbl_activity_id=pbl_os.id, faculty_id=f_sharma.id, role_description="Lead Coordinator"),
        PblFaculty(pbl_activity_id=pbl_se.id, faculty_id=f_verma.id, role_description="Lead Coordinator"),
        PblFaculty(pbl_activity_id=pbl_ai.id, faculty_id=f_sharma.id, role_description="Lead Coordinator"),
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

    all_components = [
        c_cn_exp, c_cn_ppt, c_cn_rep,
        c_db_rep, c_db_cert, c_db_proj,
        c_os_hw, c_os_sem,
        c_se_case, c_se_proj,
        c_ai_paper, c_ai_post
    ]
    db.add_all(all_components)
    db.flush()

    # Scope assignments: default to ALL for general components, Division A for specific ones
    for comp in all_components:
        db.add(ComponentAssignment(component_id=comp.id, scope_type=AssignmentScope.ALL))
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
    db.flush()
    db.add(TopicHistory(
        topic_id=t_proposed.id,
        action="PROPOSED_AND_AUTO_APPROVED",
        changed_by_user_id=u_stu1.id,
        comment="Auto-approved upon submission by student Rahul Patel"
    ))

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

    # 13. Student Progress & Reviews for Rahul Patel (230101)
    # Certification completed
    p_db_cert = StudentComponentProgress(
        student_id=s_rahul.id,
        component_id=c_db_cert.id,
        progress_state=ProgressState.DONE,
        submission_state=SubmissionState.SUBMITTED,
        submitted_at=now - timedelta(days=5)
    )
    # Case study completed
    p_se_case = StudentComponentProgress(
        student_id=s_rahul.id,
        component_id=c_se_case.id,
        progress_state=ProgressState.DONE,
        submission_state=SubmissionState.SUBMITTED,
        submitted_at=now - timedelta(days=3)
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
    # PPT in progress
    p_cn_ppt = StudentComponentProgress(
        student_id=s_rahul.id,
        component_id=c_cn_ppt.id,
        progress_state=ProgressState.IN_PROGRESS,
        submission_state=SubmissionState.SUBMITTED,
        submitted_at=now - timedelta(days=1)
    )

    db.add_all([p_db_cert, p_se_case, p_cn_exp, p_db_rep, p_cn_ppt])
    db.flush()

    # Faculty Review on completed certification (marks securely stored, hidden from student)
    rev_cert = FacultyReview(
        student_id=s_rahul.id,
        component_id=c_db_cert.id,
        faculty_id=f_verma.id,
        internal_marks=24.5,  # Out of 25. Hidden from student!
        feedback="Verified credential from MongoDB University. Excellent score in query aggregation.",
        is_rejected=False
    )
    db.add(rev_cert)

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
    seed_database()
