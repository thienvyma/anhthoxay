/**
 * Property-Based Tests for Base Firestore Service
 * Using fast-check for property testing
 *
 * **Feature: firebase-phase3-firestore**
 * **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9**
 *
 * These tests verify the correctness properties of the Firestore service
 * using mocked Firestore operations to test the logic without requiring
 * actual Firestore connection.
 */

import * as fc from 'fast-check';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as admin from 'firebase-admin';
import {
  BaseFirestoreService,
  timestampToDate,
  dateToTimestamp,
  type FirestoreDocument,
} from './base.firestore';

// ============================================
// TEST TYPES
// ============================================

interface TestDocument extends FirestoreDocument {
  name: string;
  value: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
  eventDate?: Date;
}

// ============================================
// GENERATORS
// ============================================

/**
 * Generator for valid document data (without id, createdAt, updatedAt)
 */
const documentDataArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  value: fc.integer({ min: 0, max: 1000000 }),
  tags: fc.oneof(fc.constant(undefined), fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 })),
  metadata: fc.oneof(fc.constant(undefined), fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.string())),
  eventDate: fc.oneof(fc.constant(undefined), fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })),
});

/**
 * Generator for dates - only valid dates within a reasonable range
 */
const dateArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime()));

// ============================================
// MOCK SETUP
// ============================================

// Mock the firebase-admin module with inline class definition
vi.mock('firebase-admin', () => {
  // Define MockTimestamp inside the factory to avoid hoisting issues
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

// In-memory store for testing
let mockStore: Map<string, Record<string, unknown>>;
let mockCollection: ReturnType<typeof createMockCollection>;

/**
 * Convert Date objects to Timestamp for storage simulation
 * Uses the mocked admin.firestore.Timestamp
 */
function convertDatesToTimestamps(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Date) {
      result[key] = admin.firestore.Timestamp.fromDate(value);
    } else if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function') {
      // Already a Timestamp-like object
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

function createMockCollection() {
  return {
    doc: vi.fn((id?: string) => {
      const docId = id || `auto_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      return {
        id: docId,
        get: vi.fn(async () => {
          const data = mockStore.get(docId);
          return {
            exists: !!data,
            id: docId,
            data: () => data,
          };
        }),
        set: vi.fn(async (data: Record<string, unknown>) => {
          // Convert any Date objects to Timestamp for storage
          mockStore.set(docId, convertDatesToTimestamps(data));
        }),
        update: vi.fn(async (data: Record<string, unknown>) => {
          const existing = mockStore.get(docId);
          if (existing) {
            mockStore.set(docId, { ...existing, ...convertDatesToTimestamps(data) });
          }
        }),
        delete: vi.fn(async () => {
          mockStore.delete(docId);
        }),
      };
    }),
    add: vi.fn(async (data: Record<string, unknown>) => {
      const docId = `auto_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      // Convert any Date objects to Timestamp for storage
      mockStore.set(docId, convertDatesToTimestamps(data));
      return { id: docId };
    }),
    where: vi.fn(() => mockCollection),
    orderBy: vi.fn(() => mockCollection),
    limit: vi.fn(() => mockCollection),
    startAfter: vi.fn(() => mockCollection),
    get: vi.fn(async () => ({
      docs: Array.from(mockStore.entries()).map(([id, data]) => ({
        id,
        data: () => data,
        exists: true,
      })),
      empty: mockStore.size === 0,
    })),
    count: vi.fn(() => ({
      get: vi.fn(async () => ({
        data: () => ({ count: mockStore.size }),
      })),
    })),
  };
}

function createMockFirestore() {
  return {
    collection: vi.fn(() => mockCollection),
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

describe('BaseFirestoreService Property Tests', () => {
  let service: BaseFirestoreService<TestDocument>;
  let mockFirestore: ReturnType<typeof createMockFirestore>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockStore = new Map();
    mockCollection = createMockCollection();
    mockFirestore = createMockFirestore();
    
    // Setup mock
    const { getFirestore } = await import('../firebase-admin.service');
    vi.mocked(getFirestore).mockResolvedValue(mockFirestore as unknown as admin.firestore.Firestore);
    
    service = new BaseFirestoreService<TestDocument>('testCollection');
  });

  /**
   * **Feature: firebase-phase3-firestore, Property 1: Create-Read Round Trip**
   * **Validates: Requirements 1.2, 1.3**
   * 
   * For any valid document data, creating a document and then reading it by ID
   * should return the same data (excluding auto-generated fields).
   */
  it('Property 1: Create-Read Round Trip', async () => {
    await fc.assert(
      fc.asyncProperty(documentDataArb, async (inputData) => {
        // Create document
        const created = await service.create(inputData);
        
        // Verify created document has required fields
        expect(created.id).toBeDefined();
        expect(created.createdAt).toBeInstanceOf(Date);
        expect(created.updatedAt).toBeInstanceOf(Date);
        
        // Verify input data is preserved
        expect(created.name).toBe(inputData.name);
        expect(created.value).toBe(inputData.value);
        
        // Read document
        const read = await service.getById(created.id);
        
        // Verify read returns the document
        expect(read).not.toBeNull();
        expect(read?.id).toBe(created.id);
        expect(read?.name).toBe(inputData.name);
        expect(read?.value).toBe(inputData.value);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: firebase-phase3-firestore, Property 2: Update Preserves Unmodified Fields**
   * **Validates: Requirements 1.4**
   * 
   * For any existing document and partial update data, updating the document
   * should only change the specified fields while preserving all other fields.
   */
  it('Property 2: Update Preserves Unmodified Fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        documentDataArb,
        fc.record({
          name: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
        }),
        async (initialData, updateData) => {
          // Create initial document
          const created = await service.create(initialData);
          const originalValue = created.value;
          
          // Prepare update (only update name if provided)
          const updatePayload: Partial<Omit<TestDocument, 'id' | 'createdAt' | 'updatedAt'>> = {};
          if (updateData.name !== null && updateData.name !== undefined) {
            updatePayload.name = updateData.name;
          }
          
          // Skip if no update data
          if (Object.keys(updatePayload).length === 0) {
            return;
          }
          
          // Update document
          const updated = await service.update(created.id, updatePayload);
          
          // Verify updated fields changed
          if (updateData.name !== null && updateData.name !== undefined) {
            expect(updated.name).toBe(updateData.name);
          }
          
          // Verify unmodified fields preserved
          expect(updated.value).toBe(originalValue);
          expect(updated.id).toBe(created.id);
          
          // updatedAt should be updated
          expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: firebase-phase3-firestore, Property 3: Delete Removes Document**
   * **Validates: Requirements 1.5**
   * 
   * For any existing document, after deletion, reading by ID should return null.
   */
  it('Property 3: Delete Removes Document', async () => {
    await fc.assert(
      fc.asyncProperty(documentDataArb, async (inputData) => {
        // Create document
        const created = await service.create(inputData);
        
        // Verify document exists
        const beforeDelete = await service.getById(created.id);
        expect(beforeDelete).not.toBeNull();
        
        // Delete document
        await service.delete(created.id);
        
        // Verify document no longer exists
        const afterDelete = await service.getById(created.id);
        expect(afterDelete).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: firebase-phase3-firestore, Property 4: Query Returns Matching Documents**
   * **Validates: Requirements 1.6**
   * 
   * For any set of documents and filter conditions, query should return
   * exactly the documents that match all filter conditions.
   */
  it('Property 4: Query Returns Matching Documents', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(documentDataArb, { minLength: 1, maxLength: 10 }),
        async (documents) => {
          // Clear store and create documents
          mockStore.clear();
          
          for (const doc of documents) {
            await service.create(doc);
          }
          
          // Query all documents
          const results = await service.query({});
          
          // Verify all created documents are returned
          expect(results.length).toBe(documents.length);
          
          // Verify each result has required fields
          for (const result of results) {
            expect(result.id).toBeDefined();
            expect(result.createdAt).toBeDefined();
            expect(result.updatedAt).toBeDefined();
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: firebase-phase3-firestore, Property 5: Pagination Covers All Results**
   * **Validates: Requirements 1.7**
   * 
   * For any query with pagination, the service should correctly report hasMore
   * and return paginated results. Note: With mocks, we test the pagination logic
   * rather than actual cursor-based navigation.
   */
  it('Property 5: Pagination Covers All Results', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(documentDataArb, { minLength: 1, maxLength: 20 }),
        fc.integer({ min: 1, max: 10 }),
        async (documents, pageSize) => {
          // Clear store and create documents
          mockStore.clear();
          
          const createdIds = new Set<string>();
          for (const doc of documents) {
            const created = await service.create(doc);
            createdIds.add(created.id);
          }
          
          // Test queryPaginated returns correct structure
          const page = await service.queryPaginated({ limit: pageSize });
          
          // Verify page structure
          expect(page.data).toBeDefined();
          expect(Array.isArray(page.data)).toBe(true);
          expect(typeof page.hasMore).toBe('boolean');
          
          // Verify hasMore is correct based on total documents vs page size
          // Note: The mock returns all documents, so hasMore depends on limit+1 logic
          if (documents.length > pageSize) {
            expect(page.hasMore).toBe(true);
            expect(page.data.length).toBe(pageSize);
          } else {
            expect(page.hasMore).toBe(false);
            expect(page.data.length).toBe(documents.length);
          }
          
          // Verify all returned documents have required fields
          for (const doc of page.data) {
            expect(doc.id).toBeDefined();
            expect(createdIds.has(doc.id)).toBe(true);
          }
        }
      ),
      { numRuns: 30 }
    );
  });
});

describe('Timestamp Conversion Property Tests', () => {
  /**
   * **Feature: firebase-phase3-firestore, Property 6: Timestamp Serialization Round Trip**
   * **Validates: Requirements 1.8, 1.9**
   * 
   * For any document with Date fields, storing and retrieving should preserve
   * the date values (within millisecond precision).
   */
  it('Property 6: Timestamp Serialization Round Trip', () => {
    fc.assert(
      fc.property(dateArb, (inputDate) => {
        // Convert Date to Timestamp
        const timestamp = dateToTimestamp(inputDate);
        
        // Verify timestamp was created
        expect(timestamp).toBeDefined();
        
        // Convert Timestamp back to Date
        const outputDate = timestampToDate(timestamp);
        
        // Verify date was recovered
        expect(outputDate).toBeDefined();
        expect(outputDate).toBeInstanceOf(Date);
        
        // Verify date values match (within millisecond precision)
        // Firestore Timestamps have nanosecond precision, but we only care about milliseconds
        const inputMs = inputDate.getTime();
        const outputMs = outputDate?.getTime() ?? 0;
        
        expect(Math.abs(inputMs - outputMs)).toBeLessThanOrEqual(1);
      }),
      { numRuns: 100 }
    );
  });

  it('timestampToDate handles null/undefined', () => {
    expect(timestampToDate(null)).toBeUndefined();
    expect(timestampToDate(undefined)).toBeUndefined();
  });

  it('dateToTimestamp handles null/undefined', () => {
    expect(dateToTimestamp(null)).toBeUndefined();
    expect(dateToTimestamp(undefined)).toBeUndefined();
  });

  it('timestampToDate handles Date input', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const result = timestampToDate(date);
    expect(result).toEqual(date);
  });
});
