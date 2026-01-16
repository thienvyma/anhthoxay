/**
 * Firebase Admin SDK Service
 * Handles server-side Firebase operations including Auth management
 */

import * as admin from 'firebase-admin';
import type { UserRole, VerificationStatus, FirebaseCustomClaims } from '@app/shared';

// ============================================
// INITIALIZATION
// ============================================

let firebaseApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 * Uses Application Default Credentials in production (Cloud Run)
 * Uses service account JSON in development
 */
export async function initializeFirebaseAdmin(): Promise<admin.app.App> {
  if (firebaseApp) {
    return firebaseApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || 'noithatnhanh-f8f72';

  // Check if already initialized
  if (admin.apps.length > 0) {
    firebaseApp = admin.apps[0] ?? null;
    if (firebaseApp) return firebaseApp;
  }

  // In production (Cloud Run), use Application Default Credentials
  // In development, use service account JSON if provided
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (serviceAccountPath) {
    // Development with service account file
    // Dynamic import for service account
    const fs = await import('fs');
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId,
    });
  } else {
    // Production or development without service account
    // Uses Application Default Credentials
    firebaseApp = admin.initializeApp({
      projectId,
    });
  }

  return firebaseApp;
}

/**
 * Get Firebase Admin App instance
 */
export async function getFirebaseAdmin(): Promise<admin.app.App> {
  return initializeFirebaseAdmin();
}

/**
 * Get Firebase Auth instance
 */
export async function getFirebaseAuth(): Promise<admin.auth.Auth> {
  const app = await initializeFirebaseAdmin();
  return app.auth();
}

/**
 * Get Firestore instance
 */
export async function getFirestore(): Promise<admin.firestore.Firestore> {
  const app = await initializeFirebaseAdmin();
  return app.firestore();
}

/**
 * Get Firebase Storage instance
 */
export async function getFirebaseStorage(): Promise<admin.storage.Storage> {
  const app = await initializeFirebaseAdmin();
  return app.storage();
}

// ============================================
// AUTH FUNCTIONS
// ============================================

/**
 * Verify Firebase ID token
 * @param idToken - The ID token from client
 * @returns Decoded token with user info and custom claims
 */
export async function verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  const auth = await getFirebaseAuth();
  return auth.verifyIdToken(idToken);
}

/**
 * Get user by UID
 */
export async function getUserByUid(uid: string): Promise<admin.auth.UserRecord> {
  const auth = await getFirebaseAuth();
  return auth.getUser(uid);
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<admin.auth.UserRecord | null> {
  const auth = await getFirebaseAuth();
  try {
    return await auth.getUserByEmail(email);
  } catch (error) {
    if ((error as { code?: string }).code === 'auth/user-not-found') {
      return null;
    }
    throw error;
  }
}

/**
 * Create a new user in Firebase Auth
 */
export async function createUser(data: {
  email: string;
  password: string;
  displayName?: string;
  phoneNumber?: string;
}): Promise<admin.auth.UserRecord> {
  const auth = await getFirebaseAuth();
  return auth.createUser({
    email: data.email,
    password: data.password,
    displayName: data.displayName,
    phoneNumber: data.phoneNumber,
    emailVerified: false,
  });
}

/**
 * Update user in Firebase Auth
 */
export async function updateUser(
  uid: string,
  data: {
    email?: string;
    password?: string;
    displayName?: string;
    phoneNumber?: string;
    disabled?: boolean;
  }
): Promise<admin.auth.UserRecord> {
  const auth = await getFirebaseAuth();
  return auth.updateUser(uid, data);
}

/**
 * Delete user from Firebase Auth
 */
export async function deleteUser(uid: string): Promise<void> {
  const auth = await getFirebaseAuth();
  return auth.deleteUser(uid);
}

/**
 * Set custom claims for a user (role, verification status)
 */
export async function setCustomClaims(
  uid: string,
  claims: FirebaseCustomClaims
): Promise<void> {
  const auth = await getFirebaseAuth();
  await auth.setCustomUserClaims(uid, claims);
}

/**
 * Get custom claims for a user
 */
export async function getCustomClaims(uid: string): Promise<FirebaseCustomClaims | null> {
  const auth = await getFirebaseAuth();
  const user = await auth.getUser(uid);
  return (user.customClaims as FirebaseCustomClaims) || null;
}

/**
 * Set user role
 */
export async function setUserRole(uid: string, role: UserRole): Promise<void> {
  const currentClaims = await getCustomClaims(uid);
  await setCustomClaims(uid, {
    ...currentClaims,
    role,
  });
}

/**
 * Set contractor verification status
 */
export async function setVerificationStatus(
  uid: string,
  status: VerificationStatus
): Promise<void> {
  const currentClaims = await getCustomClaims(uid);
  await setCustomClaims(uid, {
    role: currentClaims?.role || 'USER',
    verificationStatus: status,
  });
}

/**
 * Revoke all refresh tokens for a user
 * Forces re-authentication on all devices
 */
export async function revokeRefreshTokens(uid: string): Promise<void> {
  const auth = await getFirebaseAuth();
  await auth.revokeRefreshTokens(uid);
}

/**
 * Generate a custom token for a user
 * Useful for server-side authentication flows
 */
export async function createCustomToken(
  uid: string,
  additionalClaims?: Record<string, unknown>
): Promise<string> {
  const auth = await getFirebaseAuth();
  return auth.createCustomToken(uid, additionalClaims);
}

/**
 * List users with pagination
 */
export async function listUsers(
  maxResults = 100,
  pageToken?: string
): Promise<admin.auth.ListUsersResult> {
  const auth = await getFirebaseAuth();
  return auth.listUsers(maxResults, pageToken);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a decoded token has a specific role or higher
 */
export function hasRole(
  decodedToken: admin.auth.DecodedIdToken,
  requiredRole: UserRole
): boolean {
  const userRole = (decodedToken.role as UserRole) || 'USER';
  const roleHierarchy: Record<UserRole, number> = {
    ADMIN: 6,
    MANAGER: 5,
    CONTRACTOR: 4,
    HOMEOWNER: 3,
    WORKER: 2,
    USER: 1,
  };
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Check if contractor is verified
 */
export function isContractorVerified(decodedToken: admin.auth.DecodedIdToken): boolean {
  return decodedToken.verificationStatus === 'VERIFIED';
}

// ============================================
// ERROR HANDLING
// ============================================

export class FirebaseAuthError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode = 401) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'FirebaseAuthError';
  }
}

/**
 * Map Firebase Auth error codes to user-friendly messages
 */
export function mapFirebaseError(error: { code?: string; message?: string }): FirebaseAuthError {
  const errorMap: Record<string, { message: string; statusCode: number }> = {
    'auth/user-not-found': { message: 'User not found', statusCode: 404 },
    'auth/wrong-password': { message: 'Invalid credentials', statusCode: 401 },
    'auth/email-already-exists': { message: 'Email already registered', statusCode: 400 },
    'auth/invalid-email': { message: 'Invalid email format', statusCode: 400 },
    'auth/weak-password': { message: 'Password is too weak', statusCode: 400 },
    'auth/id-token-expired': { message: 'Token has expired', statusCode: 401 },
    'auth/id-token-revoked': { message: 'Token has been revoked', statusCode: 401 },
    'auth/invalid-id-token': { message: 'Invalid token', statusCode: 401 },
    'auth/user-disabled': { message: 'User account is disabled', statusCode: 403 },
  };

  const code = error.code || 'auth/unknown';
  const mapped = errorMap[code] || { message: error.message || 'Authentication error', statusCode: 401 };

  return new FirebaseAuthError(code, mapped.message, mapped.statusCode);
}
