import { apiClient } from './client';
import {
  Department,
  AcademicYear,
  Semester,
  Division,
  Subject,
  ComponentType,
  FacultySimple,
} from '../types';

export const academicApi = {
  getDepartments: async (): Promise<Department[]> => {
    return apiClient<Department[]>('/academic/departments');
  },
  getAcademicYears: async (): Promise<AcademicYear[]> => {
    return apiClient<AcademicYear[]>('/academic/academic-years');
  },
  getSemesters: async (departmentId?: number): Promise<Semester[]> => {
    const url = departmentId ? `/academic/semesters?department_id=${departmentId}` : '/academic/semesters';
    return apiClient<Semester[]>(url);
  },
  getDivisions: async (semesterId?: number): Promise<Division[]> => {
    const url = semesterId ? `/academic/divisions?semester_id=${semesterId}` : '/academic/divisions';
    return apiClient<Division[]>(url);
  },
  getSubjects: async (departmentId?: number, semesterId?: number): Promise<Subject[]> => {
    let url = '/academic/subjects';
    const params = new URLSearchParams();
    if (departmentId) params.append('department_id', departmentId.toString());
    if (semesterId) params.append('semester_id', semesterId.toString());
    if (params.toString()) url += `?${params.toString()}`;
    return apiClient<Subject[]>(url);
  },
  getComponentTypes: async (): Promise<ComponentType[]> => {
    return apiClient<ComponentType[]>('/academic/component-types');
  },
  getFacultyList: async (): Promise<FacultySimple[]> => {
    return apiClient<FacultySimple[]>('/academic/faculty-list');
  },
};
