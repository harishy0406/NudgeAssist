/**
 * API client for NudgeAssist backend.
 */

import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  // Keep browser requests same-origin. Next.js proxies these requests to the
  // configured FastAPI server, avoiding CORS and mixed-content failures.
  baseURL: '/api/backend',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('nudge_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('nudge_token');
      localStorage.removeItem('nudge_user');
      void supabase.auth.signOut();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ═══════════════ Auth ═══════════════

export const authAPI = {
  getMe: () => api.get('/profile/me'),

  bootstrap: (data: {
    name: string;
    role: string;
    department?: string;
  }) => api.post('/profile/bootstrap', data),
};

// ═══════════════ Tickets ═══════════════

export const ticketsAPI = {
  create: (data: {
    title: string;
    description: string;
    category?: string;
    urgency?: string;
  }) => api.post('/tickets', data),

  list: (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    category?: string;
  }) => api.get('/tickets', { params }),

  get: (id: string) => api.get(`/tickets/${id}`),

  getEvents: (id: string) => api.get(`/tickets/${id}/events`),

  updateStatus: (id: string, data: {
    status: string;
    note?: string;
    resolution_note?: string;
  }) => api.patch(`/tickets/${id}/status`, data),

  assign: (id: string) => api.patch(`/tickets/${id}/assign`),

  getSimilar: (desc: string) =>
    api.get('/tickets/similar', { params: { desc } }),

  getDraftResponse: (id: string) =>
    api.get(`/tickets/${id}/draft-response`),
};

// ═══════════════ Notifications ═══════════════

export const notificationsAPI = {
  list: () => api.get('/notifications'),

  markRead: (id: string) => api.patch(`/notifications/${id}/read`),

  markAllRead: () => api.patch('/notifications/read-all'),
};

// ═══════════════ Analytics ═══════════════

export const analyticsAPI = {
  getSummary: () => api.get('/analytics/summary'),

  getWeeklySummary: () => api.get('/analytics/ai-weekly-summary'),
};

export default api;
