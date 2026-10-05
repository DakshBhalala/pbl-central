import { apiClient } from './client';
import { AuthResponse, User } from '../types';

export const authApi = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const data = await apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('pbl_token', data.access_token);
    localStorage.setItem('pbl_user', JSON.stringify(data));
    return data;
  },

  getMe: async (): Promise<User> => {
    return apiClient<User>('/auth/me');
  },

  changePassword: async (current_password: string, new_password: string): Promise<{ message: string }> => {
    return apiClient<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password }),
    });
  },

  logout: () => {
    localStorage.removeItem('pbl_token');
    localStorage.removeItem('pbl_user');
    window.location.href = '/login';
  },

  getCurrentUser: (): AuthResponse | null => {
    const raw = localStorage.getItem('pbl_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
};
