# UI Control Audit & Quality Assurance

**System:** PBL Central — Academic Workspace  
**Scope:** Global Dropdown Component System & View Mode Structural Differentiation  
**Status:** COMPLETE & VERIFIED (0 TypeScript errors, 23/23 tests passing, 0 native `<select>` controls remaining)

---

## 1. View Mode Audit

Every view-mode toggle in the application was audited to verify that switching modes genuinely transforms the information presentation rather than merely highlighting a different icon:

| Location | View Modes Supported | Structural & Visual Differences | Persistence Key | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Student PBL Activities** (`/student/pbl`) | **LIST** (Dense Table) vs **GRID** (Object Cards) | **LIST Mode:** Information-dense data table prioritized for scanning, comparison, deadlines, and direct row navigation. Supports Compact/Comfortable density toggle.<br>**GRID Mode:** Object-oriented cards showcasing subject identity, activity title, progress fraction (`x/y milestones completed`), visual progress bar, faculty avatars, date ranges, and status badges. | `localStorage: pbl-central:pbl-view-mode` | **PASS** (Genuinely distinct layouts) |
| **Faculty PBL Activities** (`/faculty/pbl`) | **LIST** (Data Table) vs **GRID** (Curriculum Cards) | **LIST Mode:** High-density institutional comparison table.<br>**GRID Mode:** Curriculum-oriented cards with faculty tags, component counters, semester metadata, and quick action buttons. | `localStorage: pbl-central:faculty-pbl-view-mode` | **PASS** (Genuinely distinct layouts) |
| **Student Calendar** (`/student/calendar`) | **Month** vs **Week** vs **Agenda** | **Month:** Full 7-column calendar grid with date cells.<br>**Week:** Schedule grid segmented into active weekly columns.<br>**Agenda:** Chronological sequential milestone timeline list grouped by date. | Component state | **PASS** (Already structurally distinct) |
| **Density Toggle** (`TableToolbar`) | **Compact** (32px row) vs **Comfortable** (44px row) | Controls table padding, line-height, and vertical information density across all data tables. Kept cleanly active in List mode. | Component state | **PASS** (Operates as designed) |

---

## 2. Dropdown Audit

A comprehensive search of the frontend codebase was performed (`grep -n "<select"`, `grep -n "<option"`, `grep -n "role=\"combobox\""`). A total of 14 files containing native HTML `<select>` and `<option>` elements were identified and systematically replaced with the custom accessible `AppSelect` component.

### Systematic File Migration Matrix

| # | File Path | Control Description | Options / Dataset | Searchable | Status |
| :--- | :--- | :--- | :--- | :---: | :---: |
| 1 | `frontend/src/components/common/AppSelect.tsx` | **Universal Custom Select Primitive** | Full keyboard navigation, smart up/down flip, WAI-ARIA combobox/listbox, active checkmark, customizable sizing (`sm`, `md`), clear button, search filter. | Yes (auto-active >7 items) | **CREATED** |
| 2 | `frontend/src/pages/student/StudentPBLDetail.tsx` | Component Inspector drawer: Progress Status | `TODO` ("To Do"), `IN_PROGRESS` ("In Progress"), `DONE` ("Done") | No | **MIGRATED** |
| 3 | `frontend/src/components/pbl/ComponentCard.tsx` | Component Card: Progress Status | `TODO`, `IN_PROGRESS`, `DONE` | No | **MIGRATED** |
| 4 | `frontend/src/pages/faculty/FacultyReviewsPage.tsx` | Reviews Table Toolbar: PBL Activity Filter | Faculty's assigned PBL activities (dynamically fetched) | Yes | **MIGRATED** |
| 5 | `frontend/src/pages/faculty/FacultyPBLPage.tsx` | Activity Table Toolbar: Status Filter | All Statuses, `ACTIVE`, `DRAFT`, `COMPLETED`, `ARCHIVED` | No | **MIGRATED** |
| 6 | `frontend/src/pages/faculty/FacultyComponentsPage.tsx` | Component Table Toolbar: Type Filter | All Component Types (dynamically fetched from API) | Yes | **MIGRATED** |
| 7 | `frontend/src/pages/faculty/FacultyTopicsPage.tsx` | Topics Header: PBL Filter<br>Modal: Topic Availability Mode | Dynamic PBL activities<br>`FACULTY_ASSIGNED`, `STUDENT_LIST`, `STUDENT_PROPOSED`, `NO_TOPIC` | Yes<br>No | **MIGRATED** |
| 8 | `frontend/src/pages/faculty/FacultyGroupsPage.tsx` | Groups Header: PBL Activity Selector | Dynamic PBL activities | Yes | **MIGRATED** |
| 9 | `frontend/src/pages/faculty/FacultyStudentsPage.tsx` | Cohort Toolbar: Department Filter & Semester Filter<br>Add Student Modal: Division Selector | Dynamic departments, semesters, and divisions | Yes<br>No | **MIGRATED** |
| 10 | `frontend/src/pages/faculty/FacultyPBLDetailPage.tsx` | Add Component Modal: Component Type Selector & Scope Selector | Dynamic component types<br>`ALL`, `DIVISION`, `GROUP`, `STUDENT` | Yes<br>No | **MIGRATED** |
| 11 | `frontend/src/pages/admin/AdminPBLPage.tsx` | Oversight Toolbar: Status Filter | All Statuses, `ACTIVE`, `COMPLETED`, `ARCHIVED` | No | **MIGRATED** |
| 12 | `frontend/src/pages/admin/AdminSubjectsPage.tsx` | Add/Edit Subject Modal: Department & Semester Selectors | Dynamic departments and semesters | Yes | **MIGRATED** |
| 13 | `frontend/src/pages/admin/AdminHistoryPage.tsx` | Audit Log Toolbar: Academic Year & Department Filters | Dynamic academic years and departments | Yes | **MIGRATED** |
| 14 | `frontend/src/components/faculty/DuplicatePBLModal.tsx` | Clone Modal: Target Academic Year & Target Semester Selectors | Dynamic academic years and semesters | Yes | **MIGRATED** |
| 15 | `frontend/src/components/pbl/PBLBuilderModal.tsx` | PBL Builder Wizard: Department, Academic Year, Semester, Subject, Topic Mode, Component Type, Assignment Scope | Multi-stage form selects for curriculum authoring | Yes (Subject/Dept) | **MIGRATED** |

---

## 3. Issues Found

1. **View Modes Indistinguishable**:
   - The Student PBL page provided List and Grid icons, but both rendered nearly identical container layouts with no real change in information architecture.
2. **Browser-Native `<select>` Popups**:
   - Native `<select>` opened raw operating system popup menus with default blue focus rings, inconsistent font rendering, and zero integration with the design system.
3. **No Preference Persistence**:
   - Switching view mode reset upon page reload or navigation, requiring the user to re-select their view.
4. **Z-Index and Overflow Clipping Risks**:
   - Native selects inside drawers (`StudentPBLDetail`) or modals (`Add Student`, `DuplicatePBLModal`, `PBLBuilderModal`) suffered from boundary conflicts or modal scroll container clipping.

---

## 4. Issues Fixed

1. **Genuine LIST vs. GRID Structural Separation**:
   - **LIST Mode**: Information-dense comparison table with columns: `Subject & Activity`, `Faculty Guide`, `Components`, `Schedule`, `Status`, `Action`. Features clean row hovering, sticky table headers, and compact/comfortable density toggle.
   - **GRID Mode**: True card layout (`.pbl-cards-grid`) featuring subject code badges, activity title, milestone fraction (`x/y milestones completed`), animated `ProgressBar`, faculty guide avatar with names, schedule range, status badge, and an arrow button (`Open →`).
2. **Global Custom `AppSelect` Component**:
   - Built a unified primitive with:
     - Form-matched closed trigger styling (height, borders, typography, chevron animation).
     - Floating elevated menu with subtle box shadow (`box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.06)`).
     - Active item visual indicator with a clean checkmark (`✓`).
     - Intelligent viewport boundary detection: automatically opens upward when bottom viewport clearance is under 240px.
     - Built-in search filtering for long datasets (departments, faculty, subjects, PBL activities).
3. **Local Storage Persistence**:
   - Added scoped storage `localStorage.getItem('pbl-central:pbl-view-mode')` ensuring the user's preferred view mode remains stable across reloads and navigation.
4. **100% Native Control Eradication**:
   - Zero `<select>` and zero `<option>` tags remain in `frontend/src/`. All form and filter dropdowns across Student, Faculty, and Admin use `AppSelect`.

---

## 5. Accessibility (a11y) Verification

- **WAI-ARIA Pattern**: Trigger button configured with `aria-haspopup="listbox"`, `aria-expanded={isOpen}`, `aria-invalid`, and `aria-label`.
- **Keyboard Navigation**:
  - `Enter` / `Space`: Opens the dropdown or selects the focused item.
  - `ArrowDown` / `ArrowUp`: Navigates through listbox options sequentially.
  - `Home` / `End`: Jumps to the first / last option.
  - `Escape`: Closes the dropdown and returns focus to the trigger.
- **Click Outside & Dismiss**: Document `mousedown` listener ensures menus close immediately when clicking outside without interfering with background page interactions.

---

## 6. Responsive Testing

Verified across all critical viewport widths:
- **1440px / 1280px (Desktop)**: Full table in LIST mode; 3-column responsive card grid in GRID mode.
- **1024px / 768px (Tablet)**: Horizontal scrollable table container in LIST mode; 2-column card grid in GRID mode.
- **430px / 390px / 375px (Mobile)**:
  - **GRID Mode**: Single-column structured cards displaying progress bars, metadata, and large touch-friendly actions.
  - **LIST Mode**: Horizontal scrollable compact data view with intact data density.
  - Verified and screenshotted at 390x844.

---

## 7. Browser Verification & Evidence

Automated Chrome DevTools MCP browser testing confirmed:
- `frontend/screenshots/final/final_student_pbl_list_1440.png`: Desktop LIST mode with dense data table.
- `frontend/screenshots/final/final_student_pbl_grid_1440.png`: Desktop GRID mode with cards and progress bars.
- `frontend/screenshots/final/final_student_pbl_mobile_grid_390.png`: Mobile GRID mode at 390x844.
- `frontend/screenshots/final/final_student_pbl_mobile_list_390.png`: Mobile LIST mode at 390x844.
- `frontend/screenshots/final/final_faculty_reviews_dropdown_open_1440.png`: Faculty reviews page with custom `AppSelect` floating panel open, showing option list and active checkmark.
- `frontend/screenshots/final/final_faculty_students_dropdown_open_1440.png`: Faculty cohort page with Department `AppSelect` open.
- `frontend/screenshots/final/final_student_drawer_dropdown_open_1440.png`: Student Component Inspector drawer with open Progress Status dropdown.
- `frontend/screenshots/final/final_admin_pbl_dropdown_open_1440.png`: Admin PBL Oversight page with open Status filter dropdown.

---

## 8. Final Result

- **TypeScript Compilation**: 0 errors (`npm run build` completed cleanly, transformed 2,780 modules in 7.29s).
- **Backend Test Suite**: 23/23 tests passing (`pytest tests/ -v` passed in 7.43s).
- **Native Select Elimination**: 0 native `<select>` tags in entire `frontend/src/`.
- **System Cohesion**: Uniform design tokens, smooth animations, zero OS browser artifacts across Student, Faculty, and Admin consoles.
