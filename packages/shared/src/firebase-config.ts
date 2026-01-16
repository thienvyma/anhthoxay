/**
 * Firebase Configuration
 * Shared across all apps (landing, admin, portal)
 */

export const firebaseConfig = {
  apiKey: 'AIzaSyDZVPWgbjtO02GrswwqbdpOCVPe4C5JCr8',
  authDomain: 'noithatnhanh-f8f72.firebaseapp.com',
  projectId: 'noithatnhanh-f8f72',
  storageBucket: 'noithatnhanh-f8f72.firebasestorage.app',
  messagingSenderId: '970920393092',
  appId: '1:970920393092:web:7ec6fb61fa43fdbc3445d1',
  measurementId: 'G-FJHKQNBRZX',
} as const;

export type FirebaseConfig = typeof firebaseConfig;

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
