/**
 * Property Tests for Users Firestore Service
 * Tests Properties 7, 8, 9 from design document
 * 
 * @module services/firestore/users.firestore.property.test
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { UsersFirestoreService, UsersFirestoreError } from './users.firestore';
import type { UserRole, VerificationStatus } from '../../types/firestore.types';

// ============================================
// TEST CONFIGURATION
// ============================================

const NUM_RUNS = 100;

// Check if Firebase emulator is available
const FIRESTORE_EMULATOR = process.env['FIRESTORE_EMULATOR_HOST'];
const skipIfNoEmulator = !FIRESTORE_EMULATOR ? describe.skip : describe;

// ============================================
// ARBITRARIES (Test Data Generators)
// ============================================

/**
 * Generate valid email addresses
 */
const emailArb = fc.tuple(
  fc.stringMatching(/^[a-z][a-z0-9]{2,10}$/),
  fc.stringMatching(/^[a-z]{2,6}$/)
).map(([local, domain]) => `${local}@${domain}.com`);

/**
 * Generate valid user names
 */
const nameArb = fc.stringMatching(/^[A-Za-z][A-Za-z\s]{2,30}$/)
  .filter(s => s.trim().length >= 3);

/**
 * Generate valid phone numbers
 */
const phoneArb = fc.stringMatching(/^0[0-9]{9}$/);

/**
 * Generate valid user roles
 */
const roleArb = fc.constantFrom<UserRole>(
  'ADMIN', 'MANAGER', 'CONTRACTOR', 'HOMEOWNER', 'WORKER', 'USER'
);

/**
 * Generate valid verification statuses
 */
const verificationStatusArb = fc.constantFrom<VerificationStatus>(
  'PENDING', 'VERIFIED', 'REJECTED'
);

/**
 * Generate valid user input data
 */
const userInputArb = fc.record({
  email: emailArb,
  name: nameArb,
  phone: fc.option(phoneArb, { nil: undefined }),
  role: roleArb,
  verificationStatus: fc.option(verificationStatusArb, { nil: undefined }),
});

/**
 * Generate valid contractor profile input
 */
const contractorProfileInputArb = fc.record({
  description: fc.option(fc.string({ minLength: 10, maxLength: 500 }), { nil: undefined }),
  experience: fc.option(fc.integer({ min: 0, max: 50 }), { nil: undefined }),
  specialties: fc.option(fc.array(fc.string({ minLength: 2, maxLength: 50 }), { minLength: 0, maxLength: 5 }), { nil: undefined }),
  serviceAreas: fc.option(fc.array(fc.string({ minLength: 2, maxLength: 50 }), { minLength: 0, maxLength: 5 }), { nil: undefined }),
});

// ============================================
// TEST SUITE
// ============================================

skipIfNoEmulator('UsersFirestoreService Property Tests', () => {
  let service: UsersFirestoreService;
  const createdUserIds: string[] = [];

  beforeAll(() => {
    service = new UsersFirestoreService();
  });

  afterAll(async () => {
    // Cleanup created users
    for (const uid of createdUserIds) {
      try {
        await service.deleteUser(uid);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  beforeEach(() => {
    // Reset for each test
  });

  // ============================================
  // Property 7: User Create-Read Round Trip
  // ============================================

  describe('Property 7: User Create-Read Round Trip', () => {
    it('should preserve user data through create-read cycle', async () => {
      await fc.assert(
        fc.asyncProperty(
          userInputArb,
          async (input) => {
            // Generate unique UID and email for this test
            const uid = `test-user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const uniqueEmail = `${uid}@test.com`;
            const testInput = { ...input, email: uniqueEmail };

            try {
              // Create user
              await service.createUser(uid, testInput);
              createdUserIds.push(uid);

              // Read user
              const read = await service.getById(uid);

              // Verify data integrity
              expect(read).not.toBeNull();
              if (!read) return false;
              
              expect(read.id).toBe(uid);
              expect(read.email).toBe(testInput.email);
              expect(read.name).toBe(testInput.name);
              expect(read.role).toBe(testInput.role);
              
              if (testInput.phone) {
                expect(read.phone).toBe(testInput.phone);
              }

              // Verify auto-generated fields
              expect(read.createdAt).toBeInstanceOf(Date);
              expect(read.updatedAt).toBeInstanceOf(Date);
              expect(read.rating).toBe(0);
              expect(read.totalProjects).toBe(0);

              return true;
            } catch (error) {
              // Email uniqueness constraint might fail in parallel tests
              if (error instanceof UsersFirestoreError && error.code === 'EMAIL_EXISTS') {
                return true; // Skip this case
              }
              throw error;
            }
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });
  });

  // ============================================
  // Property 8: User Update Preserves Unmodified Fields
  // ============================================

  describe('Property 8: Update Preserves Unmodified Fields', () => {
    it('should only modify specified fields during update', async () => {
      await fc.assert(
        fc.asyncProperty(
          userInputArb,
          nameArb,
          async (input, newName) => {
            const uid = `test-user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const uniqueEmail = `${uid}@test.com`;
            const testInput = { ...input, email: uniqueEmail };

            try {
              // Create user
              await service.createUser(uid, testInput);
              createdUserIds.push(uid);

              // Get original data
              const original = await service.getById(uid);
              expect(original).not.toBeNull();
              if (!original) return false;

              // Update only name
              const updated = await service.updateUser(uid, { name: newName });

              // Verify updated field changed
              expect(updated.name).toBe(newName);

              // Verify unmodified fields preserved
              expect(updated.email).toBe(original.email);
              expect(updated.role).toBe(original.role);
              expect(updated.phone).toBe(original.phone);
              expect(updated.rating).toBe(original.rating);
              expect(updated.totalProjects).toBe(original.totalProjects);

              // Verify createdAt preserved, updatedAt changed
              expect(updated.createdAt.getTime()).toBe(original.createdAt.getTime());
              expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(original.updatedAt.getTime());

              return true;
            } catch (error) {
              if (error instanceof UsersFirestoreError && error.code === 'EMAIL_EXISTS') {
                return true;
              }
              throw error;
            }
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });
  });

  // ============================================
  // Property 9: Role-Based Query Filtering
  // ============================================

  describe('Property 9: Role-Based Query Filtering', () => {
    it('should return only users with specified role', async () => {
      await fc.assert(
        fc.asyncProperty(
          roleArb,
          async (targetRole) => {
            // Create a few users with different roles
            const testUsers: string[] = [];
            const roles: UserRole[] = ['ADMIN', 'MANAGER', 'CONTRACTOR', 'HOMEOWNER'];

            for (const role of roles) {
              const uid = `test-role-${role}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
              const email = `${uid}@test.com`;

              try {
                await service.createUser(uid, {
                  email,
                  name: `Test ${role}`,
                  role,
                });
                testUsers.push(uid);
                createdUserIds.push(uid);
              } catch {
                // Skip if email exists
              }
            }

            // Query by role
            const results = await service.listByRole(targetRole, { limit: 100 });

            // Verify all results have the target role
            for (const user of results) {
              expect(user.role).toBe(targetRole);
            }

            return true;
          }
        ),
        { numRuns: Math.min(NUM_RUNS, 20) } // Fewer runs due to multiple creates
      );
    });
  });

  // ============================================
  // Property: Contractor Profile Round Trip
  // ============================================

  describe('Property: Contractor Profile Round Trip', () => {
    it('should preserve contractor profile data through create-read cycle', async () => {
      await fc.assert(
        fc.asyncProperty(
          contractorProfileInputArb,
          async (profileInput) => {
            const uid = `test-contractor-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const email = `${uid}@test.com`;

            try {
              // Create contractor user
              await service.createUser(uid, {
                email,
                name: 'Test Contractor',
                role: 'CONTRACTOR',
              });
              createdUserIds.push(uid);

              // Create contractor profile
              await service.createContractorProfile(uid, profileInput);

              // Read contractor profile
              const read = await service.getContractorProfile(uid);

              // Verify data integrity
              expect(read).not.toBeNull();
              if (!read) return false;
              
              expect(read.userId).toBe(uid);
              
              if (profileInput.description) {
                expect(read.description).toBe(profileInput.description);
              }
              if (profileInput.experience !== undefined) {
                expect(read.experience).toBe(profileInput.experience);
              }
              if (profileInput.specialties) {
                expect(read.specialties).toEqual(profileInput.specialties);
              }
              if (profileInput.serviceAreas) {
                expect(read.serviceAreas).toEqual(profileInput.serviceAreas);
              }

              return true;
            } catch (error) {
              if (error instanceof UsersFirestoreError && 
                  (error.code === 'EMAIL_EXISTS' || error.code === 'PROFILE_EXISTS')) {
                return true;
              }
              throw error;
            }
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });
  });

  // ============================================
  // Property: Email Uniqueness
  // ============================================

  describe('Property: Email Uniqueness', () => {
    it('should reject duplicate emails', async () => {
      const uid1 = `test-dup-${Date.now()}-1`;
      const uid2 = `test-dup-${Date.now()}-2`;
      const email = `duplicate-${Date.now()}@test.com`;

      // Create first user
      await service.createUser(uid1, {
        email,
        name: 'First User',
        role: 'USER',
      });
      createdUserIds.push(uid1);

      // Attempt to create second user with same email
      await expect(
        service.createUser(uid2, {
          email,
          name: 'Second User',
          role: 'USER',
        })
      ).rejects.toThrow(UsersFirestoreError);

      try {
        await service.createUser(uid2, {
          email,
          name: 'Second User',
          role: 'USER',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(UsersFirestoreError);
        expect((error as UsersFirestoreError).code).toBe('EMAIL_EXISTS');
      }
    });
  });

  // ============================================
  // Property: Verification Status Transitions
  // ============================================

  describe('Property: Verification Status Transitions', () => {
    it('should correctly update verification status', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(),
          async (approved) => {
            const uid = `test-verify-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const email = `${uid}@test.com`;

            try {
              // Create contractor
              await service.createUser(uid, {
                email,
                name: 'Test Contractor',
                role: 'CONTRACTOR',
                verificationStatus: 'PENDING',
              });
              createdUserIds.push(uid);

              // Create profile
              await service.createContractorProfile(uid, {
                description: 'Test description for verification',
              });

              // Verify contractor
              const adminId = 'admin-test';
              const note = approved ? 'Approved' : 'Rejected - missing documents';
              const updated = await service.verifyContractor(uid, adminId, approved, note);

              // Check status
              expect(updated.verificationStatus).toBe(approved ? 'VERIFIED' : 'REJECTED');
              expect(updated.verificationNote).toBe(note);

              if (approved) {
                expect(updated.verifiedAt).toBeInstanceOf(Date);
              }

              return true;
            } catch (error) {
              if (error instanceof UsersFirestoreError && error.code === 'EMAIL_EXISTS') {
                return true;
              }
              throw error;
            }
          }
        ),
        { numRuns: Math.min(NUM_RUNS, 20) }
      );
    });
  });

  // ============================================
  // Property: Delete Removes User and Profile
  // ============================================

  describe('Property: Delete Removes User and Profile', () => {
    it('should remove user and contractor profile on delete', async () => {
      const uid = `test-delete-${Date.now()}`;
      const email = `${uid}@test.com`;

      // Create contractor with profile
      await service.createUser(uid, {
        email,
        name: 'To Delete',
        role: 'CONTRACTOR',
      });

      await service.createContractorProfile(uid, {
        description: 'Will be deleted',
      });

      // Verify exists
      expect(await service.getById(uid)).not.toBeNull();
      expect(await service.getContractorProfile(uid)).not.toBeNull();

      // Delete
      await service.deleteUser(uid);

      // Verify removed
      expect(await service.getById(uid)).toBeNull();
      expect(await service.getContractorProfile(uid)).toBeNull();
    });
  });

  // ============================================
  // Property: Stats Update
  // ============================================

  describe('Property: Stats Update', () => {
    it('should correctly update user stats', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.float({ min: 0, max: 5, noNaN: true }),
          fc.integer({ min: 0, max: 1000 }),
          async (rating, totalProjects) => {
            const uid = `test-stats-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const email = `${uid}@test.com`;

            try {
              // Create user
              await service.createUser(uid, {
                email,
                name: 'Stats Test',
                role: 'CONTRACTOR',
              });
              createdUserIds.push(uid);

              // Update stats
              await service.updateStats(uid, { rating, totalProjects });

              // Verify
              const user = await service.getById(uid);
              expect(user).not.toBeNull();
              if (!user) return false;
              
              expect(user.rating).toBeCloseTo(rating, 5);
              expect(user.totalProjects).toBe(totalProjects);

              return true;
            } catch (error) {
              if (error instanceof UsersFirestoreError && error.code === 'EMAIL_EXISTS') {
                return true;
              }
              throw error;
            }
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });
  });
});

// ============================================
// UNIT TESTS (Run without emulator)
// ============================================

describe('UsersFirestoreService Unit Tests', () => {
  describe('UsersFirestoreError', () => {
    it('should create error with correct properties', () => {
      const error = new UsersFirestoreError('TEST_CODE', 'Test message', 400);
      
      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('UsersFirestoreError');
    });

    it('should default to 400 status code', () => {
      const error = new UsersFirestoreError('TEST', 'Test');
      expect(error.statusCode).toBe(400);
    });
  });
});
