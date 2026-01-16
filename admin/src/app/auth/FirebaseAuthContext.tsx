/**
 * Firebase Auth Context for Admin
 * Only allows ADMIN and MANAGER roles
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from 'firebase/auth';
import {
  initializeFirebase,
  onAuthChange,
  signIn,
  logOut,
  getIdToken,
  getCustomClaims,
  getAuthErrorMessage,
} from './firebase';
import type { UserRole } from '@app/shared';

// ============================================
// TYPES
// ============================================

export interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
}

export interface AdminAuthContextType {
  user: AdminUser | null;
  firebaseUser: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: (forceRefresh?: boolean) => Promise<string | null>;
  clearError: () => void;
}

// Allowed roles for admin panel
const ALLOWED_ROLES: UserRole[] = ['ADMIN', 'MANAGER'];

// ============================================
// CONTEXT
// ============================================

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

// ============================================
// PROVIDER
// ============================================

interface AdminAuthProviderProps {
  children: React.ReactNode;
}

export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Firebase on mount
  useEffect(() => {
    initializeFirebase();
  }, []);

  // Build admin user from Firebase user
  const buildAdminUser = useCallback(async (fbUser: User): Promise<AdminUser | null> => {
    const claims = await getCustomClaims();
    const role = (claims?.role as UserRole) || 'USER';

    // Check if user has admin/manager role
    if (!ALLOWED_ROLES.includes(role)) {
      return null; // Not authorized for admin panel
    }

    return {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName,
      role,
    };
  }, []);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange(async (fbUser) => {
      if (fbUser) {
        try {
          const adminUser = await buildAdminUser(fbUser);
          if (adminUser) {
            setFirebaseUser(fbUser);
            setUser(adminUser);
          } else {
            // User doesn't have admin/manager role
            await logOut();
            setError('Bạn không có quyền truy cập trang quản trị');
            setFirebaseUser(null);
            setUser(null);
          }
        } catch (err) {
          console.error('Error building admin user:', err);
          setFirebaseUser(null);
          setUser(null);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [buildAdminUser]);

  // Login
  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const credential = await signIn(email, password);

      // Check role immediately after login
      const tokenResult = await credential.user.getIdTokenResult();
      const role = tokenResult.claims.role as UserRole | undefined;

      if (!role || !ALLOWED_ROLES.includes(role)) {
        await logOut();
        setError('Bạn không có quyền truy cập trang quản trị');
        throw new Error('Unauthorized');
      }
    } catch (err) {
      const errorCode = (err as { code?: string }).code || '';
      if (errorCode) {
        setError(getAuthErrorMessage(errorCode));
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    setError(null);
    try {
      await logOut();
    } catch (err) {
      const errorCode = (err as { code?: string }).code || '';
      setError(getAuthErrorMessage(errorCode));
      throw err;
    }
  }, []);

  // Get ID token for API calls
  const getToken = useCallback(async (forceRefresh = false): Promise<string | null> => {
    return getIdToken(forceRefresh);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AdminAuthContextType = {
    user,
    firebaseUser,
    loading,
    error,
    login,
    logout,
    getToken,
    clearError,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

// ============================================
// HOOK
// ============================================

export function useAdminAuth(): AdminAuthContextType {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

/**
 * Check if user is admin
 */
export function useIsAdmin(): boolean {
  const { user } = useAdminAuth();
  return user?.role === 'ADMIN';
}
