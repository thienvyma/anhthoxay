/**
 * Mock Prisma Client Utilities
 *
 * Provides utilities for mocking Prisma client in tests.
 *
 * **Feature: api-test-coverage**
 * **Requirements: 6.1, 6.2**
 */

import { PrismaClient } from '@prisma/client';
import { vi, Mock } from 'vitest';

/**
 * Type for a mocked Prisma model with common methods
 */
interface MockPrismaModel {
  findUnique: Mock;
  findFirst: Mock;
  findMany: Mock;
  create: Mock;
  update: Mock;
  delete: Mock;
  count: Mock;
  upsert: Mock;
  updateMany?: Mock;
  deleteMany?: Mock;
}

/**
 * Type for mocked Prisma client
 */
export interface MockPrismaClient {
  user: MockPrismaModel;
  project: MockPrismaModel;
  bid: MockPrismaModel;
  escrow: MockPrismaModel;
  feeTransaction: MockPrismaModel;
  notification: MockPrismaModel & { updateMany: Mock };
  notificationPreference: MockPrismaModel;
  review: MockPrismaModel;
  contractorRanking: MockPrismaModel;
  contractorProfile: MockPrismaModel;
  session: MockPrismaModel & { deleteMany: Mock };
  tokenBlacklist: { findUnique: Mock; findFirst: Mock; create: Mock; deleteMany: Mock };
  auditLog: { create: Mock; findMany: Mock };
  region: MockPrismaModel;
  serviceCategory: { findUnique: Mock; findFirst: Mock; findMany: Mock };
  biddingSettings: { findUnique: Mock; findFirst: Mock; upsert: Mock };
  $transaction: Mock;
  $connect: Mock;
  $disconnect: Mock;
}

/**
 * Creates a mock model with common Prisma methods
 */
function createMockModel(): MockPrismaModel {
  return {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    upsert: vi.fn(),
  };
}

/**
 * Creates a mock Prisma client with all methods mocked
 *
 * @example
 * ```ts
 * const mockPrisma = createMockPrisma();
 * mockPrisma.user.findUnique.mockResolvedValue({ id: '1', name: 'Test' });
 * ```
 */
export function createMockPrisma(): MockPrismaClient {
  return {
    user: createMockModel(),
    project: createMockModel(),
    bid: createMockModel(),
    escrow: createMockModel(),
    feeTransaction: createMockModel(),
    notification: { ...createMockModel(), updateMany: vi.fn() },
    notificationPreference: createMockModel(),
    review: createMockModel(),
    contractorRanking: createMockModel(),
    contractorProfile: createMockModel(),
    session: { ...createMockModel(), deleteMany: vi.fn() },
    tokenBlacklist: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    region: createMockModel(),
    serviceCategory: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    biddingSettings: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn((callback) => {
      if (typeof callback === 'function') {
        return callback(createMockPrisma() as unknown as PrismaClient);
      }
      return Promise.resolve([]);
    }),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  };
}

/**
 * Resets all mocks in a mock Prisma client
 *
 * @param mockPrisma - The mock Prisma client to reset
 */
export function resetMockPrisma(mockPrisma: MockPrismaClient): void {
  const resetModel = (model: Record<string, unknown>) => {
    Object.values(model).forEach((fn) => {
      if (typeof fn === 'function' && 'mockReset' in fn) {
        (fn as Mock).mockReset();
      }
    });
  };

  Object.values(mockPrisma).forEach((value) => {
    if (typeof value === 'object' && value !== null) {
      resetModel(value as Record<string, unknown>);
    } else if (typeof value === 'function' && 'mockReset' in value) {
      (value as Mock).mockReset();
    }
  });
}
