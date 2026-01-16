/**
 * Firebase Client SDK initialization for Admin
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { firebaseConfig } from '@app/shared';

// ============================================
// INITIALIZATION
// ============================================

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;

/**
 * Initialize Firebase client SDK
 */
export function initializeFirebase(): FirebaseApp {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (getApps().length > 0) {
    firebaseApp = getApps()[0];
    return firebaseApp;
  }

  firebaseApp = initializeApp(firebaseConfig);
  return firebaseApp;
}

/**
 * Get Firebase Auth instance
 */
export function getFirebaseAuth(): Auth {
  if (firebaseAuth) {
    return firebaseAuth;
  }

  const app = initializeFirebase();
  firebaseAuth = getAuth(app);
  return firebaseAuth;
}

// ============================================
// AUTH FUNCTIONS
// ============================================

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<UserCredential> {
  const auth = getFirebaseAuth();
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign out current user
 */
export async function logOut(): Promise<void> {
  const auth = getFirebaseAuth();
  return signOut(auth);
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  const auth = getFirebaseAuth();
  return auth.currentUser;
}

/**
 * Get current user's ID token
 */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const user = getCurrentUser();
  if (!user) {
    return null;
  }
  return user.getIdToken(forceRefresh);
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
}

/**
 * Get ID token result with custom claims
 */
export async function getIdTokenResult() {
  const user = getCurrentUser();
  if (!user) {
    return null;
  }
  return user.getIdTokenResult();
}

/**
 * Get user's custom claims
 */
export async function getCustomClaims(): Promise<{
  role?: string;
  verificationStatus?: string;
} | null> {
  const tokenResult = await getIdTokenResult();
  if (!tokenResult) {
    return null;
  }
  return {
    role: tokenResult.claims.role as string | undefined,
    verificationStatus: tokenResult.claims.verificationStatus as string | undefined,
  };
}

/**
 * Map Firebase Auth error codes to user-friendly messages
 */
export function getAuthErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'Email đã được sử dụng',
    'auth/invalid-email': 'Email không hợp lệ',
    'auth/operation-not-allowed': 'Thao tác không được phép',
    'auth/weak-password': 'Mật khẩu quá yếu',
    'auth/user-disabled': 'Tài khoản đã bị vô hiệu hóa',
    'auth/user-not-found': 'Không tìm thấy tài khoản',
    'auth/wrong-password': 'Mật khẩu không đúng',
    'auth/invalid-credential': 'Thông tin đăng nhập không hợp lệ',
    'auth/too-many-requests': 'Quá nhiều yêu cầu. Vui lòng thử lại sau',
  };

  return errorMessages[errorCode] || 'Đã xảy ra lỗi. Vui lòng thử lại';
}
