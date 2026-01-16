/**
 * Users Firestore Service
 * Handles user profiles and contractor profiles in Firestore
 * 
 * @module services/firestore/users.firestore
 * @requirements 3.1, 4.6
 */

import * as admin from 'firebase-admin';
import {
  BaseFirestoreService,
  SubcollectionFirestoreService,
  type QueryOptions,
  type PaginatedResult,
} from './base.firestore';
import type {
  FirestoreUser,
  FirestoreContractorProfile,
  UserRole,
  VerificationStatus,
} from '../../types/firestore.types';
import { getFirebaseAuth, setCustomClaims } from '../firebase-admin.service';
import { logger } from '../../utils/logger';

// ============================================
// ERROR CLASSES
// ============================================

export class UsersFirestoreError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.name = 'UsersFirestoreError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// ============================================
// INPUT TYPES
// ============================================

export interface CreateUserInput {
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  companyName?: string;
  businessLicense?: string;
  taxCode?: string;
  verificationStatus?: VerificationStatus;
}

export interface UpdateUserInput {
  name?: string;
  phone?: string;
  avatar?: string;
  role?: UserRole;
  companyName?: string;
  businessLicense?: string;
  taxCode?: string;
  verificationStatus?: VerificationStatus;
  verifiedAt?: Date;
  verificationNote?: string;
  rating?: number;
  totalProjects?: number;
}

export interface CreateContractorProfileInput {
  userId: string;
  description?: string;
  experience?: number;
  specialties?: string[];
  serviceAreas?: string[];
  portfolioImages?: string[];
  certificates?: Array<{
    name: string;
    imageUrl: string;
    issuedDate?: string;
  }>;
  idCardFront?: string;
  idCardBack?: string;
  businessLicenseImage?: string;
}

export interface UpdateContractorProfileInput {
  description?: string;
  experience?: number;
  specialties?: string[];
  serviceAreas?: string[];
  portfolioImages?: string[];
  certificates?: Array<{
    name: string;
    imageUrl: string;
    issuedDate?: string;
  }>;
  idCardFront?: string;
  idCardBack?: string;
  businessLicenseImage?: string;
  submittedAt?: Date;
}

export interface UserQueryOptions extends QueryOptions<FirestoreUser> {
  role?: UserRole;
  verificationStatus?: VerificationStatus;
  search?: string;
}

// ============================================
// USERS FIRESTORE SERVICE
// ============================================

/**
 * Users Firestore Service
 * Manages user documents in `users/{userId}` collection
 */
export class UsersFirestoreService extends BaseFirestoreService<FirestoreUser> {
  private contractorProfileService: SubcollectionFirestoreService<FirestoreContractorProfile>;

  constructor() {
    super('users');
    this.contractorProfileService = new SubcollectionFirestoreService<FirestoreContractorProfile>(
      'users',
      'profile'
    );
  }

  // ============================================
  // USER CRUD OPERATIONS
  // ============================================

  /**
   * Create a new user with Firebase Auth UID as document ID
   * Also sets custom claims on Firebase Auth user
   */
  async createUser(uid: string, data: CreateUserInput): Promise<FirestoreUser> {
    // Check if email already exists
    const existingUser = await this.getByEmail(data.email);
    if (existingUser) {
      throw new UsersFirestoreError(
        'EMAIL_EXISTS',
        `Email ${data.email} already exists`,
        409
      );
    }

    // Create user document with Firebase Auth UID
    const user = await this.createWithId(uid, {
      email: data.email,
      name: data.name,
      phone: data.phone,
      avatar: data.avatar,
      role: data.role,
      companyName: data.companyName,
      businessLicense: data.businessLicense,
      taxCode: data.taxCode,
      verificationStatus: data.verificationStatus || 'PENDING',
      rating: 0,
      totalProjects: 0,
    });

    // Set custom claims on Firebase Auth
    await this.syncCustomClaims(uid, user.role, user.verificationStatus);

    logger.info('Created user in Firestore', { uid, email: data.email, role: data.role });

    return user;
  }

  /**
   * Update user by ID
   */
  async updateUser(uid: string, data: UpdateUserInput): Promise<FirestoreUser> {
    const user = await this.update(uid, data);

    // Sync custom claims if role or verification status changed
    if (data.role !== undefined || data.verificationStatus !== undefined) {
      await this.syncCustomClaims(uid, user.role, user.verificationStatus);
    }

    logger.info('Updated user in Firestore', { uid });

    return user;
  }

  /**
   * Get user by email
   */
  async getByEmail(email: string): Promise<FirestoreUser | null> {
    const users = await this.query({
      where: [{ field: 'email', operator: '==', value: email }],
      limit: 1,
    });

    return users.length > 0 ? users[0] : null;
  }

  /**
   * List users by role with pagination
   */
  async listByRole(
    role: UserRole,
    options: Omit<QueryOptions<FirestoreUser>, 'where'> = {}
  ): Promise<FirestoreUser[]> {
    return this.query({
      ...options,
      where: [{ field: 'role', operator: '==', value: role }],
    });
  }

  /**
   * List users with filters and pagination
   */
  async listUsers(options: UserQueryOptions = {}): Promise<PaginatedResult<FirestoreUser>> {
    const { role, verificationStatus, search, ...queryOptions } = options;

    const whereClause: QueryOptions<FirestoreUser>['where'] = [];

    if (role) {
      whereClause.push({ field: 'role', operator: '==', value: role });
    }

    if (verificationStatus) {
      whereClause.push({ field: 'verificationStatus', operator: '==', value: verificationStatus });
    }

    // Note: Firestore doesn't support full-text search
    // For search, we'd need to use a separate search service or client-side filtering
    // Here we'll filter by exact email match if search is provided
    if (search) {
      whereClause.push({ field: 'email', operator: '==', value: search });
    }

    return this.queryPaginated({
      ...queryOptions,
      where: whereClause.length > 0 ? whereClause : undefined,
      orderBy: queryOptions.orderBy || [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Delete user and their subcollections
   */
  async deleteUser(uid: string): Promise<void> {
    // Delete contractor profile if exists
    await this.deleteContractorProfile(uid);

    // Delete user document
    await this.delete(uid);

    logger.info('Deleted user from Firestore', { uid });
  }

  // ============================================
  // CONTRACTOR PROFILE OPERATIONS
  // ============================================

  /**
   * Get contractor profile for a user
   */
  async getContractorProfile(userId: string): Promise<FirestoreContractorProfile | null> {
    return this.contractorProfileService.getById(userId, 'contractor');
  }

  /**
   * Create contractor profile
   */
  async createContractorProfile(
    userId: string,
    data: Omit<CreateContractorProfileInput, 'userId'>
  ): Promise<FirestoreContractorProfile> {
    // Check if profile already exists
    const existing = await this.getContractorProfile(userId);
    if (existing) {
      throw new UsersFirestoreError(
        'PROFILE_EXISTS',
        'Contractor profile already exists',
        409
      );
    }

    // Create profile document with fixed ID 'contractor'
    const db = await this.getDb();
    const now = new Date();
    const docRef = db.collection('users').doc(userId).collection('profile').doc('contractor');

    const profileData = {
      userId,
      ...data,
      createdAt: admin.firestore.Timestamp.fromDate(now),
      updatedAt: admin.firestore.Timestamp.fromDate(now),
    };

    await docRef.set(profileData);

    logger.info('Created contractor profile', { userId });

    return {
      id: 'contractor',
      userId,
      ...data,
      createdAt: now,
      updatedAt: now,
    } as FirestoreContractorProfile;
  }

  /**
   * Update contractor profile
   */
  async updateContractorProfile(
    userId: string,
    data: UpdateContractorProfileInput
  ): Promise<FirestoreContractorProfile> {
    const profile = await this.contractorProfileService.update(userId, 'contractor', data);

    logger.info('Updated contractor profile', { userId });

    return profile;
  }

  /**
   * Delete contractor profile
   */
  async deleteContractorProfile(userId: string): Promise<void> {
    try {
      await this.contractorProfileService.delete(userId, 'contractor');
      logger.info('Deleted contractor profile', { userId });
    } catch {
      // Profile might not exist, ignore error
    }
  }

  /**
   * Submit contractor profile for verification
   */
  async submitForVerification(userId: string): Promise<FirestoreUser> {
    const user = await this.getById(userId);
    if (!user) {
      throw new UsersFirestoreError('USER_NOT_FOUND', 'User not found', 404);
    }

    if (user.role !== 'CONTRACTOR') {
      throw new UsersFirestoreError('INVALID_ROLE', 'Only contractors can submit for verification', 400);
    }

    // Update profile with submission timestamp
    await this.updateContractorProfile(userId, {
      submittedAt: new Date(),
    });

    // Update user verification status
    return this.updateUser(userId, {
      verificationStatus: 'PENDING',
    });
  }

  /**
   * Verify contractor (Admin action)
   */
  async verifyContractor(
    userId: string,
    adminId: string,
    approved: boolean,
    note?: string
  ): Promise<FirestoreUser> {
    const user = await this.getById(userId);
    if (!user) {
      throw new UsersFirestoreError('USER_NOT_FOUND', 'User not found', 404);
    }

    if (user.role !== 'CONTRACTOR') {
      throw new UsersFirestoreError('INVALID_ROLE', 'User is not a contractor', 400);
    }

    const updateData: UpdateUserInput = {
      verificationStatus: approved ? 'VERIFIED' : 'REJECTED',
      verificationNote: note,
    };

    if (approved) {
      updateData.verifiedAt = new Date();
    }

    const updatedUser = await this.updateUser(userId, updateData);

    logger.info('Contractor verification updated', {
      userId,
      adminId,
      approved,
      status: updateData.verificationStatus,
    });

    return updatedUser;
  }

  // ============================================
  // CONTRACTOR QUERIES
  // ============================================

  /**
   * List verified contractors
   */
  async listVerifiedContractors(
    options: Omit<QueryOptions<FirestoreUser>, 'where'> = {}
  ): Promise<FirestoreUser[]> {
    return this.query({
      ...options,
      where: [
        { field: 'role', operator: '==', value: 'CONTRACTOR' },
        { field: 'verificationStatus', operator: '==', value: 'VERIFIED' },
      ],
    });
  }

  /**
   * List contractors pending verification
   */
  async listPendingContractors(
    options: Omit<QueryOptions<FirestoreUser>, 'where'> = {}
  ): Promise<FirestoreUser[]> {
    return this.query({
      ...options,
      where: [
        { field: 'role', operator: '==', value: 'CONTRACTOR' },
        { field: 'verificationStatus', operator: '==', value: 'PENDING' },
      ],
    });
  }

  /**
   * Get contractor with profile
   */
  async getContractorWithProfile(userId: string): Promise<{
    user: FirestoreUser;
    profile: FirestoreContractorProfile | null;
  } | null> {
    const user = await this.getById(userId);
    if (!user || user.role !== 'CONTRACTOR') {
      return null;
    }

    const profile = await this.getContractorProfile(userId);

    return { user, profile };
  }

  // ============================================
  // FIREBASE AUTH SYNC
  // ============================================

  /**
   * Sync custom claims to Firebase Auth
   */
  private async syncCustomClaims(
    uid: string,
    role: UserRole,
    verificationStatus: VerificationStatus
  ): Promise<void> {
    try {
      await setCustomClaims(uid, {
        role,
        verificationStatus,
      });
      logger.debug('Synced custom claims to Firebase Auth', { uid, role, verificationStatus });
    } catch (error) {
      logger.error('Failed to sync custom claims', { uid, error });
      // Don't throw - user document is already created
    }
  }

  /**
   * Get Firebase Auth user
   */
  async getAuthUser(uid: string): Promise<admin.auth.UserRecord | null> {
    try {
      const auth = await getFirebaseAuth();
      return await auth.getUser(uid);
    } catch {
      return null;
    }
  }

  /**
   * Update user stats (rating, totalProjects)
   */
  async updateStats(
    userId: string,
    stats: { rating?: number; totalProjects?: number }
  ): Promise<void> {
    await this.update(userId, stats);
    logger.debug('Updated user stats', { userId, stats });
  }

  /**
   * Increment total projects count
   */
  async incrementTotalProjects(userId: string): Promise<void> {
    const user = await this.getById(userId);
    if (user) {
      await this.update(userId, {
        totalProjects: (user.totalProjects || 0) + 1,
      });
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let usersFirestoreService: UsersFirestoreService | null = null;

export function getUsersFirestoreService(): UsersFirestoreService {
  if (!usersFirestoreService) {
    usersFirestoreService = new UsersFirestoreService();
  }
  return usersFirestoreService;
}

export default UsersFirestoreService;
