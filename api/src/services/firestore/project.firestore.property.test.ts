/**
 * Property-Based Tests for Project Firestore Service
 * Using fast-check for property testing
 *
 * **Feature: firebase-phase3-firestore**
 * **Validates: Requirements 5.1, 5.2**
 *
 * These tests verify the correctness properties of the Project-Bid relationship
 * using mocked Firestore operations.
 */

import * as fc from 'fast-check';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as admin from 'firebase-admin';
import {
  ProjectFirestoreService,
  type CreateProjectInput,
} from './project.firestore';
import type { FirestoreBid, BidStatus } from '../../types/firestore.types';

// ============================================
// GENERATORS
// ============================================

/**
 * Generator for valid project input data
 */
const projectInputArb = fc.record({
  ownerId: fc.uuid(),
  title: fc.string({ minLength: 5, maxLength: 100 }),
  description: fc.string({ minLength: 10, maxLength: 500 }),
  categoryId: fc.uuid(),
  regionId: fc.uuid(),
  address: fc.string({ minLength: 10, maxLength: 200 }),
  area: fc.option(fc.integer({ min: 10, max: 10000 })),
  budgetMin: fc.option(fc.integer({ min: 1000000, max: 100000000 })),
  budgetMax: fc.option(fc.integer({ min: 1000000, max: 500000000 })),
  timeline: fc.option(fc.string({ minLength: 5, maxLength: 50 })),
  images: fc.option(fc.array(fc.webUrl(), { maxLength: 5 })),
  requirements: fc.option(fc.string({ minLength: 0, maxLength: 500 })),
  maxBids: fc.option(fc.integer({ min: 1, max: 20 })),
});

/**
 * Generator for valid bid data (without projectId, id, timestamps)
 */
const bidDataArb = fc.record({
  code: fc.string({ minLength: 10, maxLength: 20 }),
  contractorId: fc.uuid(),
  price: fc.integer({ min: 1000000, max: 500000000 }),
  timeline: fc.string({ minLength: 5, maxLength: 100 }),
  proposal: fc.string({ minLength: 20, maxLength: 1000 }),
  attachments: fc.option(fc.array(fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }),
    url: fc.webUrl(),
    type: fc.constantFrom('pdf', 'doc', 'image'),
    size: fc.integer({ min: 1000, max: 10000000 }),
  }), { maxLength: 5 })),
  responseTimeHours: fc.option(fc.float({ min: Math.fround(0.1), max: Math.fround(168) })),
  status: fc.constant('PENDING' as BidStatus),
});

// ============================================
// MOCK SETUP
// ============================================

// Mock the firebase-admin module
vi.mock('firebase-admin', () => {
  class Timestamp {
    _seconds: number;
    _nanoseconds: number;
    
    constructor(seconds: number, nanoseconds: number) {
      this._seconds = seconds;
      this._nanoseconds = nanoseconds;
    }
    
    toDate(): Date {
      return new Date(this._seconds * 1000 + this._nanoseconds / 1000000);
    }
    
    static fromDate(date: Date): Timestamp {
      const seconds = Math.floor(date.getTime() / 1000);
      const nanoseconds = (date.getTime() % 1000) * 1000000;
      return new Timestamp(seconds, nanoseconds);
    }
  }
  
  return {
    default: {
      firestore: {
        Timestamp,
      },
    },
    firestore: {
      Timestamp,
    },
  };
});

// Mock the firebase-admin.service
vi.mock('../firebase-admin.service', () => ({
  getFirestore: vi.fn(),
}));

// In-memory stores for testing
let projectStore: Map<string, Record<string, unknown>>;
let bidStores: Map<string, Map<string, Record<string, unknown>>>; // projectId -> bidId -> bid

/**
 * Convert Date objects to Timestamp for storage simulation
 */
function convertDatesToTimestamps(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Date) {
      result[key] = admin.firestore.Timestamp.fromDate(value);
    } else if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function') {
      result[key] = value;
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => {
        if (item instanceof Date) return admin.firestore.Timestamp.fromDate(item);
        if (typeof item === 'object' && item !== null) return convertDatesToTimestamps(item as Record<string, unknown>);
        return item;
      });
    } else if (typeof value === 'object' && value !== null) {
      result[key] = convertDatesToTimestamps(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function createMockSubcollection(projectId: string) {
  return {
    doc: vi.fn((id?: string) => {
      const docId = id || `bid_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      return {
        id: docId,
        get: vi.fn(async () => {
          const bidStore = bidStores.get(projectId);
          const data = bidStore?.get(docId);
          return {
            exists: !!data,
            id: docId,
            data: () => data,
          };
        }),
        set: vi.fn(async (data: Record<string, unknown>) => {
          if (!bidStores.has(projectId)) {
            bidStores.set(projectId, new Map());
          }
          bidStores.get(projectId)?.set(docId, convertDatesToTimestamps(data));
        }),
        update: vi.fn(async (data: Record<string, unknown>) => {
          const bidStore = bidStores.get(projectId);
          const existing = bidStore?.get(docId);
          if (existing && bidStore) {
            bidStore.set(docId, { ...existing, ...convertDatesToTimestamps(data) });
          }
        }),
        delete: vi.fn(async () => {
          bidStores.get(projectId)?.delete(docId);
        }),
      };
    }),
    add: vi.fn(async (data: Record<string, unknown>) => {
      const docId = `bid_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      if (!bidStores.has(projectId)) {
        bidStores.set(projectId, new Map());
      }
      const store = bidStores.get(projectId);
      if (store) {
        store.set(docId, convertDatesToTimestamps(data));
      }
      return { id: docId };
    }),
    where: vi.fn(function(this: ReturnType<typeof createMockSubcollection>) { return this; }),
    orderBy: vi.fn(function(this: ReturnType<typeof createMockSubcollection>) { return this; }),
    limit: vi.fn(function(this: ReturnType<typeof createMockSubcollection>) { return this; }),
    get: vi.fn(async () => {
      const bidStore = bidStores.get(projectId) || new Map();
      return {
        docs: Array.from(bidStore.entries()).map(([id, data]) => ({
          id,
          data: () => data,
          exists: true,
        })),
        empty: bidStore.size === 0,
      };
    }),
  };
}

function createMockCollection() {
  return {
    doc: vi.fn((id?: string) => {
      const docId = id || `proj_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      return {
        id: docId,
        get: vi.fn(async () => {
          const data = projectStore.get(docId);
          return {
            exists: !!data,
            id: docId,
            data: () => data,
          };
        }),
        set: vi.fn(async (data: Record<string, unknown>) => {
          projectStore.set(docId, convertDatesToTimestamps(data));
        }),
        update: vi.fn(async (data: Record<string, unknown>) => {
          const existing = projectStore.get(docId);
          if (existing) {
            projectStore.set(docId, { ...existing, ...convertDatesToTimestamps(data) });
          }
        }),
        delete: vi.fn(async () => {
          projectStore.delete(docId);
          bidStores.delete(docId);
        }),
        collection: vi.fn((name: string) => {
          if (name === 'bids') {
            return createMockSubcollection(docId);
          }
          return createMockSubcollection(docId);
        }),
      };
    }),
    add: vi.fn(async (data: Record<string, unknown>) => {
      const docId = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      projectStore.set(docId, convertDatesToTimestamps(data));
      return { id: docId };
    }),
    where: vi.fn(function(this: ReturnType<typeof createMockCollection>) { return this; }),
    orderBy: vi.fn(function(this: ReturnType<typeof createMockCollection>) { return this; }),
    limit: vi.fn(function(this: ReturnType<typeof createMockCollection>) { return this; }),
    startAfter: vi.fn(function(this: ReturnType<typeof createMockCollection>) { return this; }),
    get: vi.fn(async () => ({
      docs: Array.from(projectStore.entries()).map(([id, data]) => ({
        id,
        data: () => data,
        exists: true,
      })),
      empty: projectStore.size === 0,
    })),
    count: vi.fn(() => ({
      get: vi.fn(async () => ({
        data: () => ({ count: projectStore.size }),
      })),
    })),
  };
}

function createMockFirestore() {
  const mockCollection = createMockCollection();
  return {
    collection: vi.fn((name: string) => {
      if (name === 'projects') {
        return mockCollection;
      }
      return mockCollection;
    }),
    batch: vi.fn(() => ({
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    })),
    runTransaction: vi.fn(async (fn: (t: unknown) => Promise<unknown>) => {
      return fn({
        get: vi.fn(),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      });
    }),
  };
}

// ============================================
// PROPERTY TESTS
// ============================================

describe('Project-Bid Relationship Property Tests', () => {
  let projectService: ProjectFirestoreService;
  let mockFirestore: ReturnType<typeof createMockFirestore>;

  beforeEach(async () => {
    vi.clearAllMocks();
    projectStore = new Map();
    bidStores = new Map();
    mockFirestore = createMockFirestore();
    
    // Setup mock
    const { getFirestore } = await import('../firebase-admin.service');
    vi.mocked(getFirestore).mockResolvedValue(mockFirestore as unknown as admin.firestore.Firestore);
    
    projectService = new ProjectFirestoreService();
  });

  /**
   * **Feature: firebase-phase3-firestore, Property 10: Project-Bid Relationship**
   * **Validates: Requirements 5.1, 5.2**
   * 
   * For any project with bids, all bids should be stored in the project's
   * subcollection and retrievable.
   */
  it('Property 10: Project-Bid Relationship - Bids are stored in project subcollection', async () => {
    await fc.assert(
      fc.asyncProperty(
        projectInputArb,
        fc.array(bidDataArb, { minLength: 1, maxLength: 5 }),
        async (projectInput, bidsData) => {
          // Create project
          const project = await projectService.createProject(projectInput as CreateProjectInput);
          
          // Verify project was created
          expect(project.id).toBeDefined();
          expect(project.code).toBeDefined();
          expect(project.title).toBe(projectInput.title);
          expect(project.ownerId).toBe(projectInput.ownerId);
          expect(project.status).toBe('DRAFT');
          
          // Simulate project being OPEN for bids
          projectStore.set(project.id, {
            ...projectStore.get(project.id),
            status: 'OPEN',
            bidDeadline: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
            maxBids: projectInput.maxBids || 10,
          });
          
          // Add bids to project
          const bidService = projectService.getBidService();
          const createdBids: FirestoreBid[] = [];
          
          for (const bidData of bidsData) {
            const bid = await bidService.addBid(project.id, {
              ...bidData,
              attachments: bidData.attachments || undefined,
              responseTimeHours: bidData.responseTimeHours || undefined,
            });
            createdBids.push(bid);
          }
          
          // Verify all bids were created
          expect(createdBids.length).toBe(bidsData.length);
          
          // Retrieve bids from project
          const retrievedBids = await bidService.getBids(project.id);
          
          // Verify all bids are retrievable
          expect(retrievedBids.length).toBe(bidsData.length);
          
          // Verify each bid has correct projectId
          for (const bid of retrievedBids) {
            expect(bid.projectId).toBe(project.id);
            expect(bid.id).toBeDefined();
            expect(bid.code).toBeDefined();
          }
          
          // Verify bid count matches
          const bidCount = await bidService.countBids(project.id);
          expect(bidCount).toBe(bidsData.length);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Individual bids are retrievable by ID
   */
  it('Property 10b: Individual bids are retrievable by ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        projectInputArb,
        bidDataArb,
        async (projectInput, bidData) => {
          // Create project
          const project = await projectService.createProject(projectInput as CreateProjectInput);
          
          // Simulate project being OPEN
          projectStore.set(project.id, {
            ...projectStore.get(project.id),
            status: 'OPEN',
            bidDeadline: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
            maxBids: 10,
          });
          
          // Add bid
          const bidService = projectService.getBidService();
          const createdBid = await bidService.addBid(project.id, {
            ...bidData,
            attachments: bidData.attachments || undefined,
            responseTimeHours: bidData.responseTimeHours || undefined,
          });
          
          // Retrieve bid by ID
          const retrievedBid = await bidService.getBidById(project.id, createdBid.id);
          
          // Verify bid is retrievable
          expect(retrievedBid).not.toBeNull();
          expect(retrievedBid?.id).toBe(createdBid.id);
          expect(retrievedBid?.projectId).toBe(project.id);
          expect(retrievedBid?.contractorId).toBe(bidData.contractorId);
          expect(retrievedBid?.price).toBe(bidData.price);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Bid status updates are persisted
   */
  it('Property 10c: Bid status updates are persisted', async () => {
    const statusTransitions: Array<{ from: BidStatus; to: BidStatus }> = [
      { from: 'PENDING', to: 'APPROVED' },
      { from: 'PENDING', to: 'REJECTED' },
    ];

    await fc.assert(
      fc.asyncProperty(
        projectInputArb,
        bidDataArb,
        fc.constantFrom(...statusTransitions),
        async (projectInput, bidData, transition) => {
          // Create project
          const project = await projectService.createProject(projectInput as CreateProjectInput);
          
          // Simulate project being OPEN
          projectStore.set(project.id, {
            ...projectStore.get(project.id),
            status: 'OPEN',
            bidDeadline: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
            maxBids: 10,
          });
          
          // Add bid with initial status
          const bidService = projectService.getBidService();
          const createdBid = await bidService.addBid(project.id, {
            ...bidData,
            status: transition.from,
            attachments: bidData.attachments || undefined,
            responseTimeHours: bidData.responseTimeHours || undefined,
          });
          
          // Update bid status
          const updatedBid = await bidService.updateBidStatus(
            project.id,
            createdBid.id,
            transition.to,
            { reviewedBy: 'admin-123', reviewNote: 'Test review' }
          );
          
          // Verify status was updated
          expect(updatedBid.status).toBe(transition.to);
          expect(updatedBid.reviewedBy).toBe('admin-123');
          expect(updatedBid.reviewNote).toBe('Test review');
          expect(updatedBid.reviewedAt).toBeDefined();
          
          // Verify persisted
          const retrievedBid = await bidService.getBidById(project.id, createdBid.id);
          expect(retrievedBid?.status).toBe(transition.to);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Project code is unique and follows format
   */
  it('Property: Project codes follow expected format', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(projectInputArb, { minLength: 2, maxLength: 5 }),
        async (projectInputs) => {
          const codes = new Set<string>();
          
          for (const input of projectInputs) {
            const project = await projectService.createProject(input as CreateProjectInput);
            
            // Verify code format: PRJ + YYMM + sequence
            expect(project.code).toMatch(/^PRJ\d{6,}$/);
            
            // Verify uniqueness
            expect(codes.has(project.code)).toBe(false);
            codes.add(project.code);
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});
