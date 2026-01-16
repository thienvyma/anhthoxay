/**
 * Auth API - NỘI THẤT NHANH Admin Dashboard
 * Uses Firebase Auth for authentication
 *
 * **Feature: firebase-phase3-firestore**
 * **Requirements: 4.5**
 */
import { apiFetch } from './client';
import { signIn, logOut, getCustomClaims } from '../auth/firebase';

// ========== AUTH API ==========
interface UserInfo {
  id: string;
  email: string;
  role: string;
  name: string;
}

export const authApi = {
  /**
   * Login using Firebase Auth
   * Returns user info from custom claims
   */
  login: async (email: string, password: string) => {
    // Sign in with Firebase
    const credential = await signIn(email, password);
    
    // Get custom claims (role, etc.)
    const claims = await getCustomClaims();
    
    const user: UserInfo = {
      id: credential.user.uid,
      email: credential.user.email || email,
      role: claims?.role || 'USER',
      name: credential.user.displayName || email.split('@')[0],
    };
    
    return { ok: true, user };
  },

  /**
   * Logout using Firebase Auth
   */
  logout: async () => {
    await logOut();
    return { ok: true };
  },

  /**
   * Get current user info from API
   */
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

export const accountApi = {
  /**
   * Change password
   * Note: With Firebase Auth, password change is handled client-side
   * This endpoint can be used for additional server-side validation
   */
  changePassword: async (currentPassword: string, newPassword: string) => {
    // For Firebase Auth, password change should be done via Firebase SDK
    // This is a placeholder for any server-side validation needed
    const response = await apiFetch<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword },
    });
    return response;
  },

  /**
   * Get all sessions for current user
   * Note: Firebase Auth doesn't have session management like JWT
   * This returns an empty list for compatibility
   */
  getSessions: () =>
    apiFetch<{ sessions: SessionInfo[] }>('/api/auth/sessions'),

  /**
   * Revoke a specific session
   * Note: With Firebase Auth, use Firebase Admin SDK to revoke tokens
   */
  revokeSession: (sessionId: string) =>
    apiFetch<{ message: string }>(`/api/auth/sessions/${sessionId}`, { method: 'DELETE' }),

  /**
   * Revoke all other sessions
   * Note: With Firebase Auth, this revokes all refresh tokens
   */
  revokeAllOtherSessions: () =>
    apiFetch<{ message: string; count: number }>('/api/auth/sessions', { method: 'DELETE' }),
};
