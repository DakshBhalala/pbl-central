import { apiClient } from './client';
import {
  Department,
  AcademicYear,
  Semester,
  Division,
  Subject,
  ComponentType,
  PblActivity,
} from '../types';

export interface AdminDashboardStats {
  departments_count: number;
  students_count: number;
  faculty_count: number;
  subjects_count: number;
  active_pbl_count: number;
  overall_completion_rate: number;
  students_by_department: Array<{ name: string; students: number }>;
  pbls_by_semester: Array<{ name: string; count: number }>;
}

export const adminApi = {
  getDashboard: async (): Promise<AdminDashboardStats> => {
    return apiClient<AdminDashboardStats>('/admin/dashboard');
  },

  // Departments
  getDepartments: async (): Promise<Department[]> => {
    return apiClient<Department[]>('/admin/departments');
  },
  createDepartment: async (data: Partial<Department>): Promise<Department> => {
    return apiClient<Department>('/admin/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Academic Years
  getAcademicYears: async (): Promise<AcademicYear[]> => {
    return apiClient<AcademicYear[]>('/admin/academic-years');
  },
  createAcademicYear: async (data: Partial<AcademicYear>): Promise<AcademicYear> => {
    return apiClient<AcademicYear>('/admin/academic-years', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Semesters
  getSemesters: async (departmentId?: number): Promise<Semester[]> => {
    const url = departmentId ? `/admin/semesters?department_id=${departmentId}` : '/admin/semesters';
    return apiClient<Semester[]>(url);
  },
  createSemester: async (data: Partial<Semester>): Promise<Semester> => {
    return apiClient<Semester>('/admin/semesters', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Divisions
  getDivisions: async (semesterId?: number): Promise<Division[]> => {
    const url = semesterId ? `/admin/divisions?semester_id=${semesterId}` : '/admin/divisions';
    return apiClient<Division[]>(url);
  },
  createDivision: async (data: Partial<Division>): Promise<Division> => {
    return apiClient<Division>('/admin/divisions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Subjects
  getSubjects: async (departmentId?: number, semesterId?: number): Promise<Subject[]> => {
    let url = '/admin/subjects';
    const params = new URLSearchParams();
    if (departmentId) params.append('department_id', departmentId.toString());
    if (semesterId) params.append('semester_id', semesterId.toString());
    if (params.toString()) url += `?${params.toString()}`;
    return apiClient<Subject[]>(url);
  },
  createSubject: async (data: Partial<Subject>): Promise<Subject> => {
    return apiClient<Subject>('/admin/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Component Types
  getComponentTypes: async (): Promise<ComponentType[]> => {
    return apiClient<ComponentType[]>('/admin/component-types');
  },
  createComponentType: async (data: Partial<ComponentType>): Promise<ComponentType> => {
    return apiClient<ComponentType>('/admin/component-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Users (Faculty & Students)
  getFaculty: async (): Promise<any[]> => {
    return apiClient<any[]>('/admin/faculty');
  },
  createFaculty: async (data: any): Promise<any> => {
    return apiClient<any>('/admin/faculty', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getStudents: async (departmentId?: number, semesterId?: number): Promise<any[]> => {
    let url = '/admin/students';
    const params = new URLSearchParams();
    if (departmentId) params.append('department_id', departmentId.toString());
    if (semesterId) params.append('semester_id', semesterId.toString());
    if (params.toString()) url += `?${params.toString()}`;
    return apiClient<any[]>(url);
  },
  createStudent: async (data: any): Promise<any> => {
    return apiClient<any>('/admin/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Historical data
  getHistory: async (academicYearId?: number, semesterId?: number, departmentId?: number): Promise<PblActivity[]> => {
    let url = '/admin/history';
    const params = new URLSearchParams();
    if (academicYearId) params.append('academic_year_id', academicYearId.toString());
    if (semesterId) params.append('semester_id', semesterId.toString());
    if (departmentId) params.append('department_id', departmentId.toString());
    if (params.toString()) url += `?${params.toString()}`;
    return apiClient<PblActivity[]>(url);
  },
};
