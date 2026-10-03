import sqlite3
import json
import sys

# Ensure UTF-8 output encoding on Windows console
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

def inspect():
    conn = sqlite3.connect('pbl_central.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    tables = [row[0] for row in cursor.fetchall() if not row[0].startswith('sqlite_')]

    print("=" * 70)
    print("       PBL CENTRAL - CURRENT DATABASE STORAGE OVERVIEW")
    print("=" * 70)
    print(f"\n[+] Total Tables Found: {len(tables)}\n")

    table_data = []
    for t in tables:
        cursor.execute(f"SELECT count(*) FROM {t}")
        cnt = cursor.fetchone()[0]
        cursor.execute(f"PRAGMA table_info({t});")
        cols = [c[1] for c in cursor.fetchall()]
        table_data.append((t, cnt, len(cols), ", ".join(cols[:5]) + ("..." if len(cols) > 5 else "")))

    print(f"{'Table Name':<30} | {'Rows':<8} | {'Columns':<8} | {'Sample Columns'}")
    print("-" * 75)
    for t, cnt, col_cnt, col_str in table_data:
        print(f"{t:<30} | {cnt:<8} | {col_cnt:<8} | {col_str}")

    print("\n" + "=" * 70)
    print("                  DEEP DIVE BY DOMAIN")
    print("=" * 70)

    # 1. Users
    print("\n--- 1. USERS & ROLES ---")
    cursor.execute("SELECT role, count(*) FROM users GROUP BY role;")
    for r in cursor.fetchall():
        print(f"  • Role {r[0]}: {r[1]} users")
    cursor.execute("SELECT id, username, role, is_active FROM users LIMIT 10;")
    users = cursor.fetchall()
    print("  All Users:")
    for u in users:
        print(f"    - ID: {u['id']:<2} | Username: {u['username']:<15} | Role: {u['role']:<8} | Active: {bool(u['is_active'])}")

    # 2. Academic Hierarchy
    print("\n--- 2. ACADEMIC STRUCTURE ---")
    cursor.execute("SELECT id, code, name FROM departments;")
    for d in cursor.fetchall():
        print(f"  • Department [{d['code']}]: {d['name']}")
    cursor.execute("SELECT id, name, number FROM semesters;")
    for s in cursor.fetchall():
        print(f"  • Semester: {s['name']} (Sem {s['number']})")
    cursor.execute("SELECT id, subject_code, name FROM subjects LIMIT 10;")
    print("  Subjects:")
    for sub in cursor.fetchall():
        print(f"    - [{sub['subject_code']}] {sub['name']}")

    # 3. PBL Activities
    print("\n--- 3. PBL ACTIVITIES (PROJECTS) ---")
    cursor.execute("""
        SELECT p.id, p.title, p.status, p.topic_mode, s.subject_code, s.name as subject_name, p.start_date, p.end_date
        FROM pbl_activities p
        LEFT JOIN subjects s ON p.subject_id = s.id;
    """)
    activities = cursor.fetchall()
    for act in activities:
        print(f"  • ID {act['id']}: '{act['title']}' | Status: {act['status']} | Mode: {act['topic_mode']} | Subject: {act['subject_code']} - {act['subject_name']} ({act['start_date']} to {act['end_date']})")

    # 4. Components / Milestones
    print("\n--- 4. MILESTONES (COMPONENTS) ---")
    cursor.execute("""
        SELECT c.id, c.title, c.deadline, ct.name as type_name, c.is_group, p.title as activity_title,
               c.external_submission_url, c.external_classroom_url
        FROM components c
        LEFT JOIN component_types ct ON c.component_type_id = ct.id
        LEFT JOIN pbl_activities p ON c.pbl_activity_id = p.id
        ORDER BY c.deadline ASC LIMIT 8;
    """)
    comps = cursor.fetchall()
    for c in comps:
        has_form = "✓ Google Form" if c['external_submission_url'] else "No Form"
        print(f"  • ID {c['id']:<2}: '{c['title']}' ({c['type_name']}) | Due: {c['deadline']} | Scope: {'Group' if c['is_group'] else 'Individual'} | Form: {has_form}")

    # 5. Groups & Teams
    print("\n--- 5. STUDENT GROUPS & TEAMS ---")
    cursor.execute("SELECT count(*) FROM groups;")
    grp_cnt = cursor.fetchone()[0]
    cursor.execute("SELECT count(*) FROM group_members;")
    gm_cnt = cursor.fetchone()[0]
    print(f"  • Total Groups: {grp_cnt} | Total Group Members: {gm_cnt}")
    cursor.execute("""
        SELECT g.id, g.group_name, g.group_code, count(gm.id) as member_count
        FROM groups g
        LEFT JOIN group_members gm ON g.id = gm.group_id
        GROUP BY g.id;
    """)
    for g in cursor.fetchall():
        print(f"    - {g['group_name']} ({g['group_code']}): {g['member_count']} members")

    # 6. Student Progress & Submissions
    print("\n--- 6. STUDENT PROGRESS & EVALUATION ---")
    cursor.execute("SELECT progress_state, count(*) FROM student_component_progress GROUP BY progress_state;")
    print("  Progress States in student_component_progress:")
    for row in cursor.fetchall():
        print(f"    - {row[0]}: {row[1]}")
    cursor.execute("SELECT submission_state, count(*) FROM student_component_progress GROUP BY submission_state;")
    print("  Submission States:")
    for row in cursor.fetchall():
        print(f"    - {row[0]}: {row[1]}")
    cursor.execute("""
        SELECT p.student_id, st.name as student_name, c.title as comp_title, p.submission_state, p.progress_state, fr.internal_marks, fr.feedback
        FROM student_component_progress p
        JOIN students st ON p.student_id = st.id
        JOIN components c ON p.component_id = c.id
        LEFT JOIN faculty_reviews fr ON fr.student_id = p.student_id AND fr.component_id = p.component_id
        LIMIT 6;
    """)
    progress_rows = cursor.fetchall()
    if progress_rows:
        print("  Sample Student Deliverable States:")
        for pr in progress_rows:
            marks_str = f"Marks: {pr['internal_marks']}/25" if pr['internal_marks'] is not None else "Unmarked"
            print(f"    - Student: {pr['student_name']} | Deliverable: '{pr['comp_title']}' | Progress: {pr['progress_state']} | Submission: {pr['submission_state']} | {marks_str}")

    # 7. Notifications
    print("\n--- 7. NOTIFICATIONS ---")
    cursor.execute("SELECT count(*), sum(case when is_read = 0 then 1 else 0 end) FROM notifications;")
    notif_stats = cursor.fetchone()
    print(f"  • Total Notifications: {notif_stats[0]} | Unread: {notif_stats[1] or 0}")
    cursor.execute("SELECT n.id, u.username, n.title, n.message, n.created_at FROM notifications n JOIN users u ON n.user_id = u.id ORDER BY n.id DESC LIMIT 3;")
    print("  Recent Notifications:")
    for n in cursor.fetchall():
        print(f"    - To {n['username']}: [{n['title']}] {n['message']}")

    print("\n" + "=" * 70)
    print("                     END OF OVERVIEW")
    print("=" * 70)

if __name__ == '__main__':
    inspect()
