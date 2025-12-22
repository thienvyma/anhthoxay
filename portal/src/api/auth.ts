/**
 * Portal Auth API
 *
 * Authentication APIs: login, logout, refreshToken, signup
 *
 * **Feature: code-refactoring**
 * **Requirements: 2.2, 2.3**
 */

import { fetchWithAuth } from './client';
import type { User, RegisterInput } from '../auth/AuthContext';

// ============================================
// AUTH TYPES
// ============================================

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface SignupResponse {
  user: User;
  accessToken?: string;
  refreshToken?: string;
  message?: string;
}

// ============================================
// AUTH API
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
// ============================================

export const authApi = {
  /**
   * Login with email and password
   * Requirements: 2.1, 2.2
   */
  login: (email: string, password: string): Promise<AuthResponse> =>
    fetchWithAuth('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  /**
   * Register a new user (homeowner or contractor)
   * Requirements: 2.3, 2.4
   */
  signup: (data: RegisterInput): Promise<SignupResponse> =>
    fetchWithAuth('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Logout current session
   * Requirements: 2.5
   */
  logout: (): Promise<void> =>
    fetchWithAuth('/api/auth/logout', { method: 'POST' }),

  /**
   * Refresh access token
   * Requirements: 2.5
   */
  refresh: (refreshToken: string): Promise<AuthResponse> =>
    fetchWithAuth('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  /**
   * Get current user info
   */
  me: (): Promise<User> => fetchWithAuth('/api/auth/me'),

  /**
   * Change password
   */
  changePassword: (currentPassword: string, newPassword: string): Promise<void> =>
    fetchWithAuth('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};
