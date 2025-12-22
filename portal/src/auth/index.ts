export { AuthProvider, useAuth } from './AuthContext';
export type { User, UserRole, VerificationStatus, RegisterInput } from './AuthContext';
export { ProtectedRoute } from './ProtectedRoute';

// Re-export useAuth hook for convenience
export { useAuth as useAuthHook } from './useAuth';
