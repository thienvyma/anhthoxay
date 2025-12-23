import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, tokenStorage, setAuthFailureCallback } from '../api';

export type UserRole = 'HOMEOWNER' | 'CONTRACTOR' | 'ADMIN' | 'MANAGER';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  verificationStatus?: VerificationStatus;
  phone?: string;
  avatar?: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  accountType: 'homeowner' | 'contractor';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<{ autoApproved: boolean }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Set up auth failure callback for automatic redirect on token expiry
  useEffect(() => {
    setAuthFailureCallback(() => {
      setUser(null);
      navigate('/auth/login');
    });
  }, [navigate]);

  const refreshToken = useCallback(async () => {
    const currentRefreshToken = tokenStorage.getRefreshToken();
    if (!currentRefreshToken) {
      throw new Error('No refresh token');
    }

    const response = await authApi.refresh(currentRefreshToken);
    tokenStorage.setTokens(response.accessToken, response.refreshToken);
    
    // Fetch user data with new token
    const userData = await authApi.me();
    setUser(userData);
  }, []);

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = tokenStorage.getAccessToken();
      
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await authApi.me();
        setUser(userData);
      } catch (error) {
        console.error('Auth check failed:', error);
        // Token invalid, try refresh
        try {
          await refreshToken();
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Refresh failed, clear tokens
          tokenStorage.clearTokens();
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [refreshToken]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    tokenStorage.setTokens(response.accessToken, response.refreshToken);
    setUser(response.user);
    
    // Debug log
    console.log('[AuthContext] Login response user:', response.user);
    console.log('[AuthContext] User role:', response.user.role);
    
    // Redirect based on role
    if (response.user.role === 'ADMIN' || response.user.role === 'MANAGER') {
      // Redirect admin/manager to admin app
      const adminUrl = window.location.origin.replace(':4203', ':4201').replace('portal', 'admin');
      console.log('[AuthContext] Redirecting ADMIN/MANAGER to:', adminUrl);
      window.location.href = adminUrl;
      return;
    } else if (response.user.role === 'HOMEOWNER') {
      console.log('[AuthContext] Redirecting HOMEOWNER to /homeowner');
      navigate('/homeowner');
    } else if (response.user.role === 'CONTRACTOR') {
      console.log('[AuthContext] Redirecting CONTRACTOR to /contractor');
      navigate('/contractor');
    } else {
      console.log('[AuthContext] Unknown role, redirecting to /');
      navigate('/');
    }
  }, [navigate]);

  const register = useCallback(async (data: RegisterInput) => {
    const response = await authApi.signup(data);
    
    // For homeowner, auto-login
    if (data.accountType === 'homeowner' && response.accessToken && response.refreshToken) {
      tokenStorage.setTokens(response.accessToken, response.refreshToken);
      setUser(response.user);
      navigate('/homeowner');
      return { autoApproved: true };
    }
    
    // For contractor, show pending message
    return { autoApproved: false };
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      tokenStorage.clearTokens();
      setUser(null);
      navigate('/auth/login');
    }
  }, [navigate]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
