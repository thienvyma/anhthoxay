/**
 * Admin Auth API Tests
 * Tests authentication API calls for admin dashboard
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { authApi, accountApi } from './auth';
import { tokenStorage } from '../store';

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

// Mock tokenStorage
vi.mock('../store', () => ({
  tokenStorage: {
    getAccessToken: vi.fn(),
    setAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    setRefreshToken: vi.fn(),
    getSessionId: vi.fn(),
    setSessionId: vi.fn(),
    clearTokens: vi.fn(),
  },
}));

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for tokenStorage
    vi.mocked(tokenStorage.getAccessToken).mockReturnValue(null);
    vi.mocked(tokenStorage.getRefreshToken).mockReturnValue(null);
    vi.mocked(tokenStorage.getSessionId).mockReturnValue(null);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('authApi.login()', () => {
    const email = 'admin@example.com';
    const password = 'password123';

    const mockResponse = {
      success: true,
      data: {
        user: {
          id: 'user-123',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'ADMIN',
        },
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        expiresIn: 3600,
        sessionId: 'session-123',
      },
    };

    it('should login successfully with valid credentials', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await authApi.login(email, password);

      expect(result).toEqual({ ok: true, user: mockResponse.data.user });
      expect(tokenStorage.setAccessToken).toHaveBeenCalledWith('access-token-123');
      expect(tokenStorage.setRefreshToken).toHaveBeenCalledWith('refresh-token-456');
      expect(tokenStorage.setSessionId).toHaveBeenCalledWith('session-123');
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
      );
    });

    it('should throw error for unsuccessful login', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () =>
          Promise.resolve({
            success: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid email or password',
            },
          }),
      });

      await expect(authApi.login(email, password)).rejects.toThrow('Invalid email or password');
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await expect(authApi.login(email, password)).rejects.toThrow('Network error');
    });

    it('should handle server errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () =>
          Promise.resolve({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Server error' },
          }),
      });

      await expect(authApi.login(email, password)).rejects.toThrow('Server error');
    });
  });

  describe('authApi.logout()', () => {
    it('should logout successfully', async () => {
      vi.mocked(tokenStorage.getAccessToken).mockReturnValue('access-token');

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { message: 'Logged out' } }),
      });

      const result = await authApi.logout();

      expect(result).toEqual({ ok: true });
      expect(tokenStorage.clearTokens).toHaveBeenCalled();
    });

    it('should clear tokens even if logout API fails', async () => {
      vi.mocked(tokenStorage.getAccessToken).mockReturnValue('access-token');

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () =>
          Promise.resolve({
            success: false,
            error: { code: 'LOGOUT_FAILED', message: 'Logout failed' },
          }),
      });

      await expect(authApi.logout()).rejects.toThrow('Logout failed');
      expect(tokenStorage.clearTokens).toHaveBeenCalled();
    });

    it('should clear tokens even on network error', async () => {
      vi.mocked(tokenStorage.getAccessToken).mockReturnValue('access-token');

      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await expect(authApi.logout()).rejects.toThrow('Network error');
      expect(tokenStorage.clearTokens).toHaveBeenCalled();
    });
  });

  describe('authApi.me()', () => {
    const mockUserResponse = {
      success: true,
      data: {
        id: 'user-123',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
        createdAt: '2024-01-01T00:00:00Z',
      },
    };

    it('should fetch current user info successfully', async () => {
      vi.mocked(tokenStorage.getAccessToken).mockReturnValue('access-token');

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserResponse),
      });

      const result = await authApi.me();

      expect(result).toEqual(mockUserResponse.data);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/me'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer access-token',
          }),
        })
      );
    });

    it('should handle authentication errors', async () => {
      vi.mocked(tokenStorage.getAccessToken).mockReturnValue('invalid-token');
      vi.mocked(tokenStorage.getRefreshToken).mockReturnValue(null);

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () =>
          Promise.resolve({
            success: false,
            error: {
              code: 'AUTHENTICATION_REQUIRED',
              message: 'Authentication required',
            },
          }),
      });

      await expect(authApi.me()).rejects.toThrow('Authentication required');
    });

    it('should handle server errors', async () => {
      vi.mocked(tokenStorage.getAccessToken).mockReturnValue('access-token');

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () =>
          Promise.resolve({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Server error' },
          }),
      });

      await expect(authApi.me()).rejects.toThrow('Server error');
    });
  });
});

describe('accountApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tokenStorage.getAccessToken).mockReturnValue('access-token');
    vi.mocked(tokenStorage.getSessionId).mockReturnValue('session-123');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('accountApi.changePassword()', () => {
    it('should change password successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          message: 'Password changed',
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await accountApi.changePassword('oldPass', 'newPass');

      expect(result).toEqual(mockResponse.data);
      expect(tokenStorage.setAccessToken).toHaveBeenCalledWith('new-access-token');
      expect(tokenStorage.setRefreshToken).toHaveBeenCalledWith('new-refresh-token');
    });

    it('should throw error for wrong current password', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () =>
          Promise.resolve({
            success: false,
            error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' },
          }),
      });

      await expect(accountApi.changePassword('wrongPass', 'newPass')).rejects.toThrow(
        'Current password is incorrect'
      );
    });
  });

  describe('accountApi.getSessions()', () => {
    it('should fetch sessions successfully', async () => {
      const mockSessions = {
        success: true,
        data: {
          sessions: [
            {
              id: 'session-1',
              userAgent: 'Chrome',
              ipAddress: '127.0.0.1',
              createdAt: '2024-01-01T00:00:00Z',
              expiresAt: '2024-01-02T00:00:00Z',
              isCurrent: true,
            },
          ],
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSessions),
      });

      const result = await accountApi.getSessions();

      expect(result).toEqual(mockSessions.data);
    });
  });

  describe('accountApi.revokeSession()', () => {
    it('should revoke session successfully', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { message: 'Session revoked' } }),
      });

      const result = await accountApi.revokeSession('session-to-revoke');

      expect(result).toEqual({ message: 'Session revoked' });
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/sessions/session-to-revoke'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('accountApi.revokeAllOtherSessions()', () => {
    it('should revoke all other sessions successfully', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ success: true, data: { message: 'Sessions revoked', count: 3 } }),
      });

      const result = await accountApi.revokeAllOtherSessions();

      expect(result).toEqual({ message: 'Sessions revoked', count: 3 });
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/sessions'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});

describe('Token Refresh Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should refresh token on 401 and retry request', async () => {
    vi.mocked(tokenStorage.getAccessToken)
      .mockReturnValueOnce('expired-token')
      .mockReturnValueOnce('new-access-token');
    vi.mocked(tokenStorage.getRefreshToken).mockReturnValue('refresh-token');

    // First call returns 401
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: () => Promise.resolve({ error: 'Token expired' }),
    });

    // Refresh token call succeeds
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
            sessionId: 'new-session',
          },
        }),
    });

    // Retry call succeeds
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: { id: 'user-123', email: 'test@test.com', role: 'ADMIN', name: 'Test' },
        }),
    });

    const result = await authApi.me();

    expect(result).toEqual({ id: 'user-123', email: 'test@test.com', role: 'ADMIN', name: 'Test' });
    expect(tokenStorage.setAccessToken).toHaveBeenCalledWith('new-access-token');
    expect(tokenStorage.setRefreshToken).toHaveBeenCalledWith('new-refresh-token');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('should clear tokens if refresh fails', async () => {
    vi.mocked(tokenStorage.getAccessToken).mockReturnValue('expired-token');
    vi.mocked(tokenStorage.getRefreshToken).mockReturnValue('invalid-refresh-token');

    // First call returns 401
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: () => Promise.resolve({ error: 'Token expired' }),
    });

    // Refresh token call fails
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: () => Promise.resolve({ error: 'Invalid refresh token' }),
    });

    await expect(authApi.me()).rejects.toThrow();
    expect(tokenStorage.clearTokens).toHaveBeenCalled();
  });
});

describe('Concurrent Requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tokenStorage.getAccessToken).mockReturnValue(null);
    vi.mocked(tokenStorage.getRefreshToken).mockReturnValue(null);
    vi.mocked(tokenStorage.getSessionId).mockReturnValue(null);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should handle multiple concurrent login requests', async () => {
    const response1 = {
      success: true,
      data: {
        user: { id: '1', email: 'user1@test.com', role: 'ADMIN', name: 'User 1' },
        accessToken: 'token1',
        refreshToken: 'refresh1',
        expiresIn: 3600,
        sessionId: 'session1',
      },
    };
    const response2 = {
      success: true,
      data: {
        user: { id: '2', email: 'user2@test.com', role: 'ADMIN', name: 'User 2' },
        accessToken: 'token2',
        refreshToken: 'refresh2',
        expiresIn: 3600,
        sessionId: 'session2',
      },
    };

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(response1),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(response2),
      });

    const [result1, result2] = await Promise.all([
      authApi.login('user1@test.com', 'pass1'),
      authApi.login('user2@test.com', 'pass2'),
    ]);

    expect(result1.user.id).toBe('1');
    expect(result2.user.id).toBe('2');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should handle concurrent requests with one failing', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              user: { id: '1', email: 'valid@test.com', role: 'ADMIN', name: 'Valid' },
              accessToken: 'token',
              refreshToken: 'refresh',
              expiresIn: 3600,
              sessionId: 'session',
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () =>
          Promise.resolve({
            success: false,
            error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' },
          }),
      });

    const results = await Promise.allSettled([
      authApi.login('valid@test.com', 'pass'),
      authApi.login('invalid@test.com', 'wrong'),
    ]);

    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('rejected');

    if (results[1].status === 'rejected') {
      expect(results[1].reason.message).toContain('Invalid credentials');
    }
  });
});


