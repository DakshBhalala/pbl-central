import { apiClient } from './client';
import { NotificationItem } from '../types';

export interface NotificationResponse {
  unread_count: number;
  notifications: NotificationItem[];
}

export const notificationsApi = {
  getNotifications: async (): Promise<NotificationResponse> => {
    return apiClient<NotificationResponse>('/notifications');
  },
  markRead: async (id: number): Promise<{ message: string }> => {
    return apiClient<{ message: string }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },
  markAllRead: async (): Promise<{ message: string }> => {
    return apiClient<{ message: string }>('/notifications/mark-all-read', {
      method: 'POST',
    });
  },
};
