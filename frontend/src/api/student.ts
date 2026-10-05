import { apiClient } from './client';
import {
  StudentDashboardData,
  PblActivity,
  PblActivityDetail,
  Group,
  Topic,
  ProgressState,
  SubmissionState,
} from '../types';

export const studentApi = {
  getDashboard: async (): Promise<StudentDashboardData> => {
    return apiClient<StudentDashboardData>('/students/me/dashboard');
  },

  getPblActivities: async (): Promise<PblActivity[]> => {
    return apiClient<PblActivity[]>('/students/me/pbl');
  },

  getPblDetail: async (id: number): Promise<PblActivityDetail> => {
    return apiClient<PblActivityDetail>(`/students/me/pbl/${id}`);
  },

  updateProgress: async (
    componentId: number,
    progressState: ProgressState
  ): Promise<{ message: string; progress_state: string }> => {
    return apiClient<{ message: string; progress_state: string }>(
      `/students/me/components/${componentId}/progress`,
      {
        method: 'PATCH',
        body: JSON.stringify({ progress_state: progressState }),
      }
    );
  },

  updateSubmission: async (
    componentId: number,
    submissionState: SubmissionState
  ): Promise<{ message: string; submission_state: string }> => {
    return apiClient<{ message: string; submission_state: string }>(
      `/students/me/components/${componentId}/submission`,
      {
        method: 'PATCH',
        body: JSON.stringify({ submission_state: submissionState }),
      }
    );
  },

  getGroups: async (): Promise<Group[]> => {
    return apiClient<Group[]>('/students/me/groups');
  },

  proposeTopic: async (data: {
    pbl_activity_id: number;
    title: string;
    description?: string;
    group_id?: number;
  }): Promise<Topic> => {
    return apiClient<Topic>('/students/me/topics/propose', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAvailableTopics: async (pblId: number): Promise<Topic[]> => {
    return apiClient<Topic[]>(`/students/me/pbl/${pblId}/available-topics`);
  },

  selectTopic: async (pblId: number, topicId: number, groupId?: number): Promise<Topic> => {
    return apiClient<Topic>(`/students/me/pbl/${pblId}/topics/${topicId}/select`, {
      method: 'POST',
      body: JSON.stringify({ group_id: groupId }),
    });
  },

  createGroup: async (pblId: number, groupName: string): Promise<Group> => {
    return apiClient<Group>(`/students/me/pbl/${pblId}/groups`, {
      method: 'POST',
      body: JSON.stringify({ group_name: groupName }),
    });
  },

  joinGroup: async (groupCode: string): Promise<Group> => {
    return apiClient<Group>('/students/me/groups/join', {
      method: 'POST',
      body: JSON.stringify({ group_code: groupCode }),
    });
  },

  updateProfile: async (data: { email?: string; phone_number?: string }): Promise<any> => {
    return apiClient('/students/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

