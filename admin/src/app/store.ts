// Simple state management for Admin Dashboard
import { useState, useEffect } from 'react';
import type { User, Page } from './types';

// ============================================
// TOKEN STORAGE (localStorage)
// ============================================
const TOKEN_KEY = 'ath_access_token';
const REFRESH_TOKEN_KEY = 'ath_refresh_token';
const SESSION_ID_KEY = 'ath_session_id';

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(TOKEN_KEY),
  setAccessToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  
  getSessionId: () => localStorage.getItem(SESSION_ID_KEY),
  setSessionId: (id: string) => localStorage.setItem(SESSION_ID_KEY, id),
  
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(SESSION_ID_KEY);
  },
};

// ============================================
// GLOBAL STATE
// ============================================
let currentUser: User | null = null;
let currentPage: Page | null = null;
const listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach((listener) => listener());
}

export const store = {
  // User
  getUser: () => currentUser,
  setUser: (user: User | null) => {
    currentUser = user;
    if (!user) {
      tokenStorage.clearTokens();
    }
    notify();
  },

  // Page
  getPage: () => currentPage,
  setPage: (page: Page | null) => {
    currentPage = page;
    notify();
  },

  // Subscribe
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};

// React hooks
export function useUser() {
  const [user, setUser] = useState<User | null>(store.getUser());

  useEffect(() => {
    return store.subscribe(() => {
      setUser(store.getUser());
    });
  }, []);

  return user;
}

export function usePage() {
  const [page, setPage] = useState<Page | null>(store.getPage());

  useEffect(() => {
    return store.subscribe(() => {
      setPage(store.getPage());
    });
  }, []);

  return page;
}

