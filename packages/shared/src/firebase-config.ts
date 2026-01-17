/**
 * Firebase Configuration
 * Shared across all apps (landing, admin, portal)
 */

// This file now only contains types. Runtime firebase config must come from `packages/shared/src/config.ts`
export type FirebaseConfig = {
  apiKey: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
};

/**
 * User roles in the system
 * Stored as custom claims in Firebase Auth
 */
export type UserRole = 'ADMIN' | 'MANAGER' | 'CONTRACTOR' | 'HOMEOWNER' | 'WORKER' | 'USER';

/**
 * Verification status for contractors
 */
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

/**
 * Custom claims structure for Firebase Auth
 */
export interface FirebaseCustomClaims {
  role: UserRole;
  verificationStatus?: VerificationStatus;
}

/**
 * Role hierarchy for permission checks
 * Higher number = more permissions
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  ADMIN: 6,
  MANAGER: 5,
  CONTRACTOR: 4,
  HOMEOWNER: 3,
  WORKER: 2,
  USER: 1,
};

/**
 * Check if a role has permission for a required role
 */
export function hasRolePermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
