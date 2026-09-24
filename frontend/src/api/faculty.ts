import { apiClient } from './client';
import {
  PblActivity,
  PblActivityDetail,
  Component,
  Group,
  Topic,
} from '../types';

export interface FacultyDashboardStats {
  faculty_name: string;
  active_pbl_count: number;
  total_components: number;
  pending_reviews: number;
  pending_topics: number;
  overdue_items: number;
  recent_submissions: Array<{
    student_id: number;
    student_name: string;
    enrollment_number: string;
    component_id: number;
    component_title: string;
    submitted_at: string;
  }>;
}

export interface SubmissionRow {
  component_id: number;
  component_title: string;
  student_id: number;
  student_name: string;
  enrollment_number: string;
  division_name: string;
  submission_state: string;
  progress_state: string;
  submitted_at?: string;
  internal_marks?: number;
  feedback?: string;
  is_rejected: boolean;
}

export const facultyApi = {
  getDashboard: async (): Promise<FacultyDashboardStats> => {
    return apiClient<FacultyDashboardStats>('/faculty/me/dashboard');
  },

  getPblActivities: async (): Promise<PblActivity[]> => {
    return apiClient<PblActivity[]>('/faculty/pbl');
  },

  getPblDetail: async (id: number): Promise<PblActivityDetail> => {
    return apiClient<PblActivityDetail>(`/faculty/pbl/${id}`);
  },

  createPbl: async (data: any): Promise<PblActivityDetail> => {
    return apiClient<PblActivityDetail>('/faculty/pbl', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  duplicatePbl: async (
    pblId: number,
    data: {
      target_academic_year_id: number;
      target_semester_id: number;
      target_subject_id?: number;
      new_title?: string;
    }
  ): Promise<PblActivityDetail> => {
    return apiClient<PblActivityDetail>(`/faculty/pbl/${pblId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  addComponent: async (pblId: number, data: any): Promise<Component> => {
    return apiClient<Component>(`/faculty/pbl/${pblId}/components`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateComponent: async (compId: number, data: any): Promise<Component> => {
    return apiClient<Component>(`/faculty/components/${compId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteComponent: async (compId: number): Promise<{ message: string }> => {
    return apiClient<{ message: string }>(`/faculty/components/${compId}`, {
      method: 'DELETE',
    });
  },

  getSubmissions: async (pblId: number): Promise<SubmissionRow[]> => {
    return apiClient<SubmissionRow[]>(`/faculty/pbl/${pblId}/submissions`);
  },

  reviewSubmission: async (data: {
    student_id: number;
    component_id: number;
    internal_marks?: number;
    feedback?: string;
    is_rejected: boolean;
  }): Promise<any> => {
    return apiClient('/faculty/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getGroups: async (pblId: number): Promise<Group[]> => {
    return apiClient<Group[]>(`/faculty/pbl/${pblId}/groups`);
  },

  createGroup: async (pblId: number, data: any): Promise<Group> => {
    return apiClient<Group>(`/faculty/pbl/${pblId}/groups`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getTopics: async (pblId: number): Promise<Topic[]> => {
    return apiClient<Topic[]>(`/faculty/pbl/${pblId}/topics`);
  },

  rejectTopic: async (topicId: number, reason: string): Promise<Topic> => {
    return apiClient<Topic>(`/faculty/topics/${topicId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },

  approveTopic: async (topicId: number): Promise<Topic> => {
    return apiClient<Topic>(`/faculty/topics/${topicId}/approve`, {
      method: 'PATCH',
    });
  },

  createTopic: async (
    pblId: number,
    data: { title: string; description?: string; mode?: string; assigned_to_group_id?: number }
  ): Promise<Topic> => {
    return apiClient<Topic>(`/faculty/pbl/${pblId}/topics`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  assignTopic: async (
    topicId: number,
    data: { group_id?: number; student_id?: number }
  ): Promise<Topic> => {
    return apiClient<Topic>(`/faculty/topics/${topicId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  updateAssignment: async (
    componentId: number,
    assignmentId: number,
    customDescription: string
  ): Promise<any> => {
    return apiClient(`/faculty/components/${componentId}/assignments/${assignmentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ custom_description: customDescription }),
    });
  },

  previewStudentImport: async (departmentId: number, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient(`/faculty/students/import-preview?department_id=${departmentId}`, {
      method: 'POST',
      body: formData,
    });
  },

  executeStudentImport: async (validRows: any[]): Promise<any> => {
    return apiClient('/faculty/students/import-execute', {
      method: 'POST',
      body: JSON.stringify({ valid_rows: validRows }),
    });
  },

  getAnalytics: async (): Promise<any> => {
    return apiClient('/faculty/analytics');
  },

  getStudents: async (departmentId?: number, semesterId?: number): Promise<any[]> => {
    let url = '/faculty/students';
    const params = new URLSearchParams();
    if (departmentId) params.append('department_id', departmentId.toString());
    if (semesterId) params.append('semester_id', semesterId.toString());
    if (params.toString()) url += `?${params.toString()}`;
    return apiClient<any[]>(url);
  },

  createStudent: async (data: any): Promise<any> => {
    return apiClient<any>('/faculty/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
