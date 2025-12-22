// Auth API - ANH THỢ XÂY Admin Dashboard
import { tokenStorage } from '../store';
import { apiFetch } from './client';

// ========== AUTH API ==========
interface LoginResponse {
  user: { id: string; email: string; role: string; name: string };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionId: string;
}

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiFetch<LoginResponse>(
      '/api/auth/login',
      { method: 'POST', body: { email, password }, skipAuth: true }
    );
    // Store tokens
    tokenStorage.setAccessToken(response.accessToken);
    tokenStorage.setRefreshToken(response.refreshToken);
    tokenStorage.setSessionId(response.sessionId);
    return { ok: true, user: response.user };
  },

  logout: async () => {
    try {
      await apiFetch<{ message: string }>('/api/auth/logout', { method: 'POST' });
    } finally {
      tokenStorage.clearTokens();
    }
    return { ok: true };
  },

  me: () =>
    apiFetch<{ id: string; email: string; role: string; name: string; createdAt: string }>('/api/auth/me'),
};

// ========== ACCOUNT / AUTH MANAGEMENT ==========
export interface SessionInfo {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

interface ChangePasswordResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const accountApi = {
  // Change password - revokes all other sessions
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiFetch<ChangePasswordResponse>('/api/auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword },
    });
    // Update tokens after password change
    tokenStorage.setAccessToken(response.accessToken);
    tokenStorage.setRefreshToken(response.refreshToken);
    return response;
  },

  // Get all sessions for current user
  getSessions: () =>
    apiFetch<{ sessions: SessionInfo[] }>('/api/auth/sessions'),

  // Revoke a specific session
  revokeSession: (sessionId: string) =>
    apiFetch<{ message: string }>(`/api/auth/sessions/${sessionId}`, { method: 'DELETE' }),

  // Revoke all other sessions (keep current)
  revokeAllOtherSessions: () =>
    apiFetch<{ message: string; count: number }>('/api/auth/sessions', { method: 'DELETE' }),
};
