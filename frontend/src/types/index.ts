export type UserRole = 'STUDENT' | 'FACULTY' | 'ADMIN';

export interface User {
  id: number;
  username: string;
  role: UserRole;
  is_active: boolean;
  name?: string;
  profile_id?: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  username: string;
  user_id: number;
  profile_id?: number;
  name?: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
}

export interface Program {
  id: number;
  name: string;
  code: string;
  department_id: number;
  department_name?: string;
}

export interface AcademicYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface Semester {
  id: number;
  name: string;
  number: number;
  academic_year_id: number;
  department_id: number;
  program_id?: number;
  academic_year_name?: string;
  department_name?: string;
}

export interface Division {
  id: number;
  name: string;
  semester_id: number;
  department_id: number;
  semester_name?: string;
}

export interface Subject {
  id: number;
  name: string;
  subject_code: string;
  semester_id: number;
  department_id: number;
  description?: string;
  is_active: boolean;
  semester_name?: string;
  department_name?: string;
}

export interface ComponentType {
  id: number;
  name: string;
  description?: string;
  icon: string;
  is_active: boolean;
}

export type DeadlineState = 'COMPLETED' | 'OVERDUE' | 'DUE_TODAY' | 'DUE_SOON' | 'UPCOMING';
export type ProgressState = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type SubmissionState = 'NOT_SUBMITTED' | 'SUBMITTED' | 'REJECTED';

export interface ComponentAssignment {
  id: number;
  component_id: number;
  scope_type: 'ALL' | 'DIVISION' | 'GROUP' | 'STUDENT';
  target_id?: number;
  target_label?: string;
  custom_description?: string;
}

export interface Component {
  id: number;
  pbl_activity_id: number;
  component_type_id: number;
  component_type_name?: string;
  component_type_icon?: string;
  title: string;
  description?: string;
  assignment_custom_description?: string;
  deadline: string;
  submission_required: boolean;
  external_submission_url?: string;
  external_classroom_url?: string;
  external_resource_url?: string;
  is_group: boolean;
  assignments: ComponentAssignment[];
  deadline_state?: DeadlineState;
  days_remaining?: number;
  student_progress_state?: ProgressState;
  student_submission_state?: SubmissionState;
  faculty_feedback?: string;
}

export interface FacultySimple {
  id: number;
  name: string;
  email?: string;
  role_description?: string;
}

export interface PblActivity {
  id: number;
  title: string;
  description?: string;
  subject_id: number;
  academic_year_id: number;
  semester_id: number;
  department_id: number;
  start_date: string;
  end_date: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  topic_mode: 'FACULTY_ASSIGNED' | 'STUDENT_LIST' | 'STUDENT_PROPOSED' | 'NO_TOPIC';
  allow_student_groups: boolean;
  require_group_approval: boolean;
  subject_name?: string;
  subject_code?: string;
  academic_year_name?: string;
  semester_name?: string;
  department_name?: string;
  faculty_members: FacultySimple[];
  faculty_names?: string[];
  component_count: number;
  components_count?: number;
  progress_percentage?: number;
  completed_count?: number;
  division_name?: string;
  created_at: string;
}

export interface PblActivityDetail extends PblActivity {
  components: Component[];
}

export interface GroupMember {
  id: number;
  student_id: number;
  student_name: string;
  enrollment_number: string;
  joined_at: string;
}

export interface Project {
  id: number;
  group_id?: number;
  pbl_activity_id: number;
  title: string;
  topic?: string;
  description?: string;
  guide_faculty_id?: number;
  guide_faculty_name?: string;
  status: string;
  external_url?: string;
}

export interface Group {
  id: number;
  pbl_activity_id: number;
  pbl_title?: string;
  component_id?: number;
  group_name: string;
  group_code: string;
  members: GroupMember[];
  project?: Project;
  created_at: string;
}

export interface TopicHistory {
  id: number;
  action: string;
  changed_by_name?: string;
  comment?: string;
  created_at: string;
}

export type TopicStatus = 'APPROVED' | 'REJECTED' | 'PENDING';

export interface Topic {
  id: number;
  pbl_activity_id: number;
  pbl_title?: string;
  title: string;
  description?: string;
  mode: 'FACULTY_ASSIGNED' | 'STUDENT_LIST' | 'STUDENT_PROPOSED' | 'NO_TOPIC';
  status: TopicStatus;
  proposed_by_student_id?: number;
  proposed_by_student_name?: string;
  assigned_to_group_id?: number;
  assigned_to_group_name?: string;
  assigned_to_student_id?: number;
  rejection_reason?: string;
  history: TopicHistory[];
  created_at: string;
}

export interface SubjectSummary {
  pbl_id: number;
  subject_id: number;
  subject_name: string;
  subject_code: string;
  completed_components: number;
  total_components: number;
  percentage: number;
  faculty_names: string[];
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface StudentDashboardData {
  student_name: string;
  enrollment_number: string;
  email?: string;
  phone_number?: string;
  department_name: string;
  semester_name: string;
  division_name: string;
  overall_progress_percentage: number;
  active_pbl_count: number;
  total_components_count: number;
  completed_count: number;
  pending_count: number;
  upcoming_count: number;
  upcoming_deadlines: Component[];
  overdue_items: Component[];
  subject_summaries: SubjectSummary[];
  recent_notifications: NotificationItem[];
}
