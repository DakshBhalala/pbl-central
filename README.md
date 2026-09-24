# PBL Central — College-wide Problem-Based Learning Management Platform

A centralized, production-structured **College-wide Problem-Based Learning / Project-Based Learning (PBL) Management Platform**. 

PBL Central eliminates the chaos of academic project coordination scattered across disjointed Google Forms, Google Classrooms, Excel spreadsheets, messaging groups, and faculty notices by providing an intuitive, consolidated operational layer for students, faculty, and administrators.

---

## 💡 Core Product Philosophy

> **PBL Central is the centralized management, visibility, and tracking layer.**
> 
> It is **NOT** designed to replace Google Forms, Google Classroom, or cloud drives. Instead, it aggregates deadlines, submission statuses, group configurations, topics, and resource portals in one place:
> - Component submission links open faculty-configured **external Google Forms**.
> - Class portals open **Google Classroom**.
> - Documentation guides link to shared **Google Drive** repositories.
> - **Internal marks assigned by faculty are strictly guarded on the backend and NEVER exposed to student-facing clients.**

---

## 🚀 Key Features by Role

### 👨‍🎓 1. Student Workspace (`/student/*`)
- **Executive Dashboard**: Real-time overall semester progress calculation, active PBL count, upcoming deadlines, overdue tasks, and subject-wise completion breakdowns.
- **My PBL Activities**: View enrolled PBL activities organized subject-wise (e.g., Computer Networks, DBMS, Operating Systems, Software Engineering, AI).
- **Activity & Component Details**: Detailed view of group allocation, teammates, guide faculty, topic status, external submission links, and individual progress trackers (`To Do` → `In Progress` → `Done`).
- **Interactive Academic Calendar**: Monthly, weekly, and agenda views with semantic color indicators for Upcoming, Due Soon (≤3 days), Due Today, Overdue, and Completed deadlines.
- **Lightweight Gantt Timeline**: Responsive visual roadmap tracking start and completion dates across all subject components with a "Today" indicator.
- **Topic Proposal Engine**: Propose custom project topics that auto-approve by default according to college policy until faculty reviews them.
- **Notifications Hub**: In-app activity stream for deadline alerts, feedback notes, and group updates.
- **Student Profile**: Academic credentials view and password change management.

### 👩‍🏫 2. Faculty Workspace (`/faculty/*`)
- **Faculty Command Center**: Real-time metrics on active PBL courses, pending reviews, overdue items, topic proposals, and subject completion charts.
- **PBL Activity Builder**: Multi-step wizard to create or edit PBL programs across departments, semesters, and subjects.
- **Component & Assignment Engine**: Flexible assignment scoping (`ALL`, `DIVISION`, `GROUP`, or `STUDENT`) and individual vs. group configuration.
- **PBL Structure Duplicator**: 1-click duplication of entire component structures into new academic years/semesters without contaminating old student rosters or marks.
- **Group & Team Manager**: Configure auto or manual student grouping, assign guide faculty, and monitor group rosters.
- **Topic Management Pool**: Create curated topic pools, assign topics to groups, and review or reject student-proposed topics with specific reasons and historical audit logs.
- **Grading & Review Portal**: Mark submissions as rejected, enter **Internal Faculty Marks** (strictly hidden from students), and write constructive feedback.
- **Student CSV Importer**: Bulk import students with validation, duplicate detection, and automated account generation.
- **Analytics & Reporting**: View cross-subject submission rates and student completion distributions.

### 🛡️ 3. Admin Workspace (`/admin/*`)
- **Institutional Overview**: College-wide dashboards displaying departments, student counts, faculty staff, active subjects, and PBL completion statistics.
- **Academic Hierarchy Management**: Configure Departments, Degree Programs, Academic Years, Semesters, and Class Divisions.
- **Course & Subject Registry**: Manage active course offerings and map them to semesters.
- **User Account Management**: Create and manage Student, Faculty, and Admin credentials.
- **Component Type Registry**: Create custom component types (PPT, Report, Poster, Handwritten Assignment, Mini Project, Certification, etc.) with custom icons.
- **Historical Archive**: Access and query past semester PBL archives.
- **System Settings**: Configure institution name, deadline warning thresholds, and security parameters.

---

## 🎨 Visual Design & Aesthetics

- **Classic Apple / iOS Utility Design**: Restrained, elegant typography using the Inter font family, subtle borders, compact cards, segmented controls, and deliberate spacing.
- **Zero AI-bloat**: Strictly no neon gradients, no heavy blurry glassmorphism, and no childish SaaS cards.
- **Native Light & Dark Mode**: Semantic CSS custom properties persist user preferences and synchronize with system color schemes.
- **Responsive Layout**: Designed for high density on desktop workstations and adaptive bottom sheets / horizontal timelines on mobile devices.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, React Router v6, TanStack Query v5, React Hook Form, Zod, Lucide React, Recharts, date-fns |
| **Styling** | Custom CSS Design Tokens (`tokens.css`, `global.css`, `components.css`). **No Tailwind CSS.** |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy 2.0 ORM, Pydantic v2, Alembic, JWT Auth, Bcrypt |
| **Database** | SQLite (zero-config local default) / PostgreSQL 16 (production & Docker) |
| **Infrastructure** | Docker, Docker Compose, Nginx |

---

## ⚡ Quick Start Guide

### Option A: 1-Command Docker Run (Full Stack + PostgreSQL)

```bash
docker compose up --build
```
- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000/api/v1`
- **API Documentation**: `http://localhost:8000/docs`

---

### Option B: Local Development (Instant Zero-Dependency Setup)

#### 1. Backend Setup (FastAPI + SQLite)
```bash
cd backend

# Create & activate virtual environment (Windows PowerShell)
python -m venv .venv
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Seed realistic demo database
python -m app.seed

# Start FastAPI dev server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Frontend Setup (Vite + React)
```bash
cd frontend

# Install packages
npm install

# Start Vite dev server (proxies /api to http://127.0.0.1:8000)
npm run dev
```

Navigate to **`http://localhost:5173/`** in your browser.

---

## 🔑 Demo Credentials

| Role | Username / Identifier | Password | Name / Description |
|---|---|---|---|
| **Student** | `230101` | `Student@123` | Rahul Patel (Sem 5, Div A, Computer Engg.) |
| **Faculty** | `faculty01` | `Faculty@123` | Dr. Rajesh Sharma (Guide Faculty) |
| **Admin** | `admin` | `Admin@123` | Campus Administrator |

---

## 🧪 Testing & Verification

The test suite covers:
1. **RBAC & Route Protection**: Students cannot access faculty/admin endpoints; Faculty cannot delete core academic entities.
2. **Assignment Scope Resolution**: Verifies `ALL`, `DIVISION`, `GROUP`, and individual `STUDENT` assignments resolve correctly.
3. **Marks Security**: Confirms `internal_marks` are sanitized from all student-facing endpoints and progress payloads.
4. **Deadline State Calculations**: Validates `COMPLETED`, `OVERDUE`, `DUE_TODAY`, `DUE_SOON`, and `UPCOMING`.
5. **Topic State Rules**: Ensures student-proposed topics begin as `APPROVED` and can be rejected by faculty with audit history.
6. **PBL Duplication Integrity**: Ensures duplicating a PBL copies only configuration and components, leaving student progress clean.

Run tests:
```bash
cd backend
.venv\Scripts\pytest tests/ -v
```
*Result: 15 passed out of 15 tests.*

---

## 📂 Project Architecture

```text
pbl-central/
├── docker-compose.yml           # PostgreSQL, Backend, and Frontend containers
├── .env.example                 # Root configuration blueprint
├── README.md                    # Project manual & documentation
│
├── backend/
│   ├── Dockerfile               # Python 3.12 production image
│   ├── requirements.txt         # FastAPI, SQLAlchemy, Bcrypt, etc.
│   ├── pbl_central.db           # Pre-seeded SQLite development database
│   ├── app/
│   │   ├── api/                 # REST endpoints (auth, students, faculty, admin, academic)
│   │   ├── core/                # Config, database engine, JWT security, zero-cost email logger
│   │   ├── models/              # SQLAlchemy 2.0 ORM models
│   │   ├── schemas/             # Pydantic v2 validation contracts
│   │   ├── services/            # Assignment, deadline, CSV, notification, duplication services
│   │   ├── seed.py              # Realistic college demo data seeder
│   │   └── main.py              # FastAPI application entrypoint & CORS
│   └── tests/                   # Automated pytest suite
│
└── frontend/
    ├── Dockerfile               # Multi-stage build with Nginx
    ├── nginx.conf               # SPA routing & API reverse proxy
    ├── index.html               # Classic Apple typography entrypoint
    ├── package.json
    ├── vite.config.ts           # Dev proxy configuration
    └── src/
        ├── api/                 # Strongly-typed API client services
        ├── components/
        │   ├── common/          # AppShell, Sidebar, Header, Modals, Badges, SearchBar
        │   ├── calendar/        # Monthly/Weekly/Agenda view engine
        │   ├── timeline/        # Responsive Gantt-style schedule
        │   ├── pbl/             # Cards, PBL Builder, Duplication, Student Import
        │   └── faculty/         # Submission review & grading dialogs
        ├── context/             # AuthContext & ThemeContext
        ├── pages/
        │   ├── auth/            # LoginPage with quick demo auto-fill
        │   ├── student/         # Dashboard, PBL List, Detail, Calendar, Timeline, Groups
        │   ├── faculty/         # Dashboard, PBL, Components, Groups, Topics, Reviews
        │   └── admin/           # Dashboard, Departments, Academic, Subjects, Users
        ├── routes/              # ProtectedRoute guards & AppRouter
        ├── styles/              # tokens.css, global.css, components.css
        └── types/               # TypeScript interface contracts
```

---

## 🌐 Production Deployment Notes

PBL Central is architected to run at **zero cost** on modern cloud free tiers:
- **Frontend**: Deploy static `/dist` build to **Vercel**, **Netlify**, or **Cloudflare Pages**.
- **Backend**: Deploy container to **Render**, **Railway**, or **Fly.io** free tiers.
- **Database**: Use managed PostgreSQL from **Neon**, **Supabase**, or **Aiven**.
- **Notifications**: Currently operates with safe developer console logging; production SMTP credentials can be configured via environment variables (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`) without changing any code.

---

## 📜 License

Created as a centralized academic project management system. Distributed under the MIT License.
