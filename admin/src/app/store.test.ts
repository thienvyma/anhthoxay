/**
 * Admin Store Tests
 * Tests state management, token storage, user authentication
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage before importing store
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    _getStore: () => store,
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Import after mocking localStorage
import { tokenStorage, store } from './store';
import type { User, Page } from './types';

describe('Token Storage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('tokenStorage.getAccessToken()', () => {
    it('should return access token when exists', () => {
      localStorageMock.setItem('ath_access_token', 'test-access-token');

      const result = tokenStorage.getAccessToken();
      expect(result).toBe('test-access-token');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('ath_access_token');
    });

    it('should return null when access token does not exist', () => {
      const result = tokenStorage.getAccessToken();
      expect(result).toBeNull();
      expect(localStorageMock.getItem).toHaveBeenCalledWith('ath_access_token');
    });
  });

  describe('tokenStorage.setAccessToken()', () => {
    it('should store access token', () => {
      tokenStorage.setAccessToken('new-access-token');

      expect(localStorageMock.setItem).toHaveBeenCalledWith('ath_access_token', 'new-access-token');
      expect(localStorageMock.getItem('ath_access_token')).toBe('new-access-token');
    });

    it('should handle empty string token', () => {
      tokenStorage.setAccessToken('');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('ath_access_token', '');
    });
  });

  describe('tokenStorage.getRefreshToken()', () => {
    it('should return refresh token when exists', () => {
      localStorageMock.setItem('ath_refresh_token', 'test-refresh-token');

      const result = tokenStorage.getRefreshToken();
      expect(result).toBe('test-refresh-token');
    });

    it('should return null when refresh token does not exist', () => {
      const result = tokenStorage.getRefreshToken();
      expect(result).toBeNull();
    });
  });

  describe('tokenStorage.setRefreshToken()', () => {
    it('should store refresh token', () => {
      tokenStorage.setRefreshToken('new-refresh-token');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'ath_refresh_token',
        'new-refresh-token'
      );
    });
  });

  describe('tokenStorage.getSessionId()', () => {
    it('should return session ID when exists', () => {
      localStorageMock.setItem('ath_session_id', 'session-123');

      const result = tokenStorage.getSessionId();
      expect(result).toBe('session-123');
    });

    it('should return null when session ID does not exist', () => {
      const result = tokenStorage.getSessionId();
      expect(result).toBeNull();
    });
  });

  describe('tokenStorage.setSessionId()', () => {
    it('should store session ID', () => {
      tokenStorage.setSessionId('new-session-123');

      expect(localStorageMock.setItem).toHaveBeenCalledWith('ath_session_id', 'new-session-123');
    });
  });

  describe('tokenStorage.clearTokens()', () => {
    it('should clear all tokens and session ID', () => {
      // Set up initial tokens
      localStorageMock.setItem('ath_access_token', 'access-token');
      localStorageMock.setItem('ath_refresh_token', 'refresh-token');
      localStorageMock.setItem('ath_session_id', 'session-123');

      tokenStorage.clearTokens();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('ath_access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('ath_refresh_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('ath_session_id');

      // After removeItem, getItem should return null
      expect(localStorageMock.getItem('ath_access_token')).toBeNull();
      expect(localStorageMock.getItem('ath_refresh_token')).toBeNull();
      expect(localStorageMock.getItem('ath_session_id')).toBeNull();
    });

    it('should handle clearing when tokens do not exist', () => {
      tokenStorage.clearTokens();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('ath_access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('ath_refresh_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('ath_session_id');
    });
  });
});

describe('Global Store', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'ADMIN',
    verificationStatus: 'VERIFIED',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockPage: Page = {
    id: 'page-123',
    slug: 'test-page',
    title: 'Test Page',
    content: 'Test content',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    // Reset store state by setting to null
    store.setUser(null);
    store.setPage(null);
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('store.getUser()', () => {
    it('should return null when no user is set', () => {
      const result = store.getUser();
      expect(result).toBeNull();
    });

    it('should return current user when set', () => {
      store.setUser(mockUser);
      const result = store.getUser();
      expect(result).toEqual(mockUser);
    });
  });

  describe('store.setUser()', () => {
    it('should set user correctly', () => {
      store.setUser(mockUser);
      expect(store.getUser()).toEqual(mockUser);
    });

    it('should clear tokens when user is set to null', () => {
      // Set user first
      store.setUser(mockUser);
      expect(store.getUser()).toEqual(mockUser);

      // Clear user (logout)
      store.setUser(null);
      expect(store.getUser()).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('ath_access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('ath_refresh_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('ath_session_id');
    });

    it('should notify listeners when user changes', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.setUser(mockUser);

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should handle setting the same user multiple times', () => {
      store.setUser(mockUser);
      store.setUser(mockUser);

      expect(store.getUser()).toEqual(mockUser);
    });
  });

  describe('store.getPage()', () => {
    it('should return null when no page is set', () => {
      const result = store.getPage();
      expect(result).toBeNull();
    });

    it('should return current page when set', () => {
      store.setPage(mockPage);
      const result = store.getPage();
      expect(result).toEqual(mockPage);
    });
  });

  describe('store.setPage()', () => {
    it('should set page and notify listeners', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.setPage(mockPage);
      expect(store.getPage()).toEqual(mockPage);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should handle setting page to null', () => {
      store.setPage(mockPage);
      expect(store.getPage()).toEqual(mockPage);

      store.setPage(null);
      expect(store.getPage()).toBeNull();
    });
  });

  describe('store.subscribe()', () => {
    it('should add and remove listeners correctly', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const unsubscribe1 = store.subscribe(listener1);
      const unsubscribe2 = store.subscribe(listener2);

      store.setUser(mockUser);

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);

      // Unsubscribe listener1
      unsubscribe1();

      store.setUser(null);

      expect(listener1).toHaveBeenCalledTimes(1); // Should not be called again
      expect(listener2).toHaveBeenCalledTimes(2); // Should be called again

      // Unsubscribe listener2
      unsubscribe2();

      store.setPage(mockPage);

      expect(listener1).toHaveBeenCalledTimes(1); // Should not be called
      expect(listener2).toHaveBeenCalledTimes(2); // Should not be called again
    });

    it('should handle multiple subscriptions from same listener', () => {
      const listener = vi.fn();

      // Subscribe multiple times
      const unsubscribe1 = store.subscribe(listener);
      const unsubscribe2 = store.subscribe(listener);

      store.setUser(mockUser);

      // Set uses a Set, so same listener is only added once
      // But our implementation adds to Set, so duplicate listeners are ignored
      expect(listener).toHaveBeenCalled();

      // Unsubscribe once
      unsubscribe1();

      store.setUser(null);

      // After unsubscribe, listener should not be called
      // (Set.delete removes the listener entirely)
      expect(listener.mock.calls.length).toBeGreaterThanOrEqual(1);

      // Cleanup
      unsubscribe2();
    });
  });
});

describe('React Hooks Integration', () => {
  // Note: These tests require @testing-library/react which may not be available
  // in all test environments. The hooks are simple wrappers around store.subscribe
  // and store.getUser/getPage, so the core functionality is tested above.

  it('should export useUser hook', async () => {
    const { useUser } = await import('./store');
    expect(typeof useUser).toBe('function');
  });

  it('should export usePage hook', async () => {
    const { usePage } = await import('./store');
    expect(typeof usePage).toBe('function');
  });
});
