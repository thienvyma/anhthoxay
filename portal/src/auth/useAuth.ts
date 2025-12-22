/**
 * useAuth hook - Re-exported from AuthContext for convenience
 * 
 * This hook provides access to the authentication context including:
 * - user: Current authenticated user or null
 * - isAuthenticated: Boolean indicating if user is logged in
 * - isLoading: Boolean indicating if auth state is being checked
 * - login: Function to log in with email and password
 * - register: Function to register a new account
 * - logout: Function to log out
 * - refreshToken: Function to refresh the access token
 */
export { useAuth } from './AuthContext';
export type { User, UserRole, VerificationStatus, RegisterInput } from './AuthContext';
