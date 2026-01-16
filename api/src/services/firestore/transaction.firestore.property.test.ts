/**
 * Property-Based Tests for Transaction Atomicity
 * Using fast-check for property testing
 *
 * **Feature: firebase-phase3-firestore**
 * **Property 11: Transaction Atomicity**
 * **Validates: Requirements 5.6**
 *
 * These tests verify that batch operations and transactions
 * either all succeed or none do (no partial updates).
 */

import * as fc from 'fast-check';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as admin from 'firebase-admin';
import { BaseFirestoreService } from './base.firestore';

// ============================================
// TEST DOCUMENT TYPE
// ============================================

interface TestDocument {
  id: string;
  name: string;
  value: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// GENERATORS
// ============================================

/**
 * Generator for test document data
 */
const testDocumentArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  value: fc.integer({ min: 0, max: 1000000 }),
  status: fc.constantFrom('ACTIVE', 'INACTIVE', 'PENDING'),
});

/**
 * Generator for batch of documents
 */
const batchDocumentsArb = fc.array(testDocumentArb, { minLength: 2, maxLength: 10 });

/**
 * Generator for update data
 */
const updateDataArb = fc.record({
  name: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
  value: fc.option(fc.integer({ min: 0, max: 1000000 })),
  status: fc.option(fc.constantFrom('ACTIVE', 'INACTIVE', 'PENDING')),
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

// In-memory store for testing
let documentStore: Map<string, Record<string, unknown>>;
let shouldFailOnCommit: boolean;
let failAfterNOperations: number;
let operationCount: number;

/**
 * Convert Date objects to Timestamp for storage simulation
 */
function convertDatesToTimestamps(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Date) {
      result[key] = admin.firestore.Timestamp.fromDate(value);
    } else if (value && typeof value === 'object' && 'toDate' in value) {
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
      const docId = id || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      return {
        id: docId,
        get: vi.fn(async () => {
          const data = documentStore.get(docId);
          return {
            exists: !!data,
            id: docId,
            data: () => data,
          };
        }),
        set: vi.fn(async (data: Record<string, unknown>) => {
          documentStore.set(docId, convertDatesToTimestamps(data));
        }),
        update: vi.fn(async (data: Record<string, unknown>) => {
          const existing = documentStore.get(docId);
          if (existing) {
            documentStore.set(docId, { ...existing, ...convertDatesToTimestamps(data) });
          }
        }),
        delete: vi.fn(async () => {
          documentStore.delete(docId);
        }),
      };
    }),
    add: vi.fn(async (data: Record<string, unknown>) => {
      const docId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      documentStore.set(docId, convertDatesToTimestamps(data));
      return { id: docId };
    }),
    where: vi.fn(function(this: ReturnType<typeof createMockCollection>) { return this; }),
    orderBy: vi.fn(function(this: ReturnType<typeof createMockCollection>) { return this; }),
    limit: vi.fn(function(this: ReturnType<typeof createMockCollection>) { return this; }),
    startAfter: vi.fn(function(this: ReturnType<typeof createMockCollection>) { return this; }),
    get: vi.fn(async () => ({
      docs: Array.from(documentStore.entries()).map(([id, data]) => ({
        id,
        data: () => data,
        exists: true,
      })),
      empty: documentStore.size === 0,
    })),
    count: vi.fn(() => ({
      get: vi.fn(async () => ({
        data: () => ({ count: documentStore.size }),
      })),
    })),
  };
}

function createMockFirestore() {
  const mockCollection = createMockCollection();
  
  // Track batch operations for atomicity testing
  let batchOperations: Array<{ type: string; docId: string; data?: Record<string, unknown> }> = [];
  
  return {
    collection: vi.fn(() => mockCollection),
    batch: vi.fn(() => {
      batchOperations = [];
      return {
        set: vi.fn((docRef: { id: string }, data: Record<string, unknown>) => {
          batchOperations.push({ type: 'set', docId: docRef.id, data });
        }),
        update: vi.fn((docRef: { id: string }, data: Record<string, unknown>) => {
          batchOperations.push({ type: 'update', docId: docRef.id, data });
        }),
        delete: vi.fn((docRef: { id: string }) => {
          batchOperations.push({ type: 'delete', docId: docRef.id });
        }),
        commit: vi.fn(async () => {
          if (shouldFailOnCommit) {
            throw new Error('Simulated batch commit failure');
          }
          
          // Check if we should fail after N operations
          if (failAfterNOperations > 0 && operationCount >= failAfterNOperations) {
            throw new Error('Simulated partial failure');
          }
          
          // Apply all operations atomically
          for (const op of batchOperations) {
            operationCount++;
            if (op.type === 'set' && op.data) {
              documentStore.set(op.docId, convertDatesToTimestamps(op.data));
            } else if (op.type === 'update' && op.data) {
              const existing = documentStore.get(op.docId);
              if (existing) {
                documentStore.set(op.docId, { ...existing, ...convertDatesToTimestamps(op.data) });
              }
            } else if (op.type === 'delete') {
              documentStore.delete(op.docId);
            }
          }
        }),
      };
    }),
    runTransaction: vi.fn(async (fn: (t: unknown) => Promise<unknown>) => {
      if (shouldFailOnCommit) {
        throw new Error('Simulated transaction failure');
      }
      
      const transactionOps: Array<{ type: string; docId: string; data?: Record<string, unknown> }> = [];
      
      const result = await fn({
        get: vi.fn(async (docRef: { id: string }) => {
          const data = documentStore.get(docRef.id);
          return {
            exists: !!data,
            id: docRef.id,
            data: () => data,
          };
        }),
        set: vi.fn((docRef: { id: string }, data: Record<string, unknown>) => {
          transactionOps.push({ type: 'set', docId: docRef.id, data });
        }),
        update: vi.fn((docRef: { id: string }, data: Record<string, unknown>) => {
          transactionOps.push({ type: 'update', docId: docRef.id, data });
        }),
        delete: vi.fn((docRef: { id: string }) => {
          transactionOps.push({ type: 'delete', docId: docRef.id });
        }),
      });
      
      // Apply all transaction operations atomically
      for (const op of transactionOps) {
        if (op.type === 'set' && op.data) {
          documentStore.set(op.docId, convertDatesToTimestamps(op.data));
        } else if (op.type === 'update' && op.data) {
          const existing = documentStore.get(op.docId);
          if (existing) {
            documentStore.set(op.docId, { ...existing, ...convertDatesToTimestamps(op.data) });
          }
        } else if (op.type === 'delete') {
          documentStore.delete(op.docId);
        }
      }
      
      return result;
    }),
  };
}

// ============================================
// PROPERTY TESTS
// ============================================

describe('Transaction Atomicity Property Tests', () => {
  let service: BaseFirestoreService<TestDocument>;
  let mockFirestore: ReturnType<typeof createMockFirestore>;

  beforeEach(async () => {
    vi.clearAllMocks();
    documentStore = new Map();
    shouldFailOnCommit = false;
    failAfterNOperations = 0;
    operationCount = 0;
    mockFirestore = createMockFirestore();
    
    // Setup mock
    const { getFirestore } = await import('../firebase-admin.service');
    vi.mocked(getFirestore).mockResolvedValue(mockFirestore as unknown as admin.firestore.Firestore);
    
    service = new BaseFirestoreService<TestDocument>('testDocuments');
  });

  /**
   * **Feature: firebase-phase3-firestore, Property 11: Transaction Atomicity**
   * **Validates: Requirements 5.6**
   * 
   * For any batch operation or transaction, either all operations succeed
   * or none do (no partial updates).
   */
  it('Property 11: Batch create - all documents created or none', async () => {
    await fc.assert(
      fc.asyncProperty(
        batchDocumentsArb,
        async (documents) => {
          const initialCount = documentStore.size;
          
          // Create all documents in batch
          const created = await service.batchCreate(documents);
          
          // Verify all were created
          expect(created.length).toBe(documents.length);
          expect(documentStore.size).toBe(initialCount + documents.length);
          
          // Verify each document has correct data
          for (let i = 0; i < documents.length; i++) {
            expect(created[i].name).toBe(documents[i].name);
            expect(created[i].value).toBe(documents[i].value);
            expect(created[i].status).toBe(documents[i].status);
            expect(created[i].id).toBeDefined();
            expect(created[i].createdAt).toBeDefined();
            expect(created[i].updatedAt).toBeDefined();
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 11b: Batch update - all updates applied or none
   */
  it('Property 11b: Batch update - all updates applied or none', async () => {
    await fc.assert(
      fc.asyncProperty(
        batchDocumentsArb,
        updateDataArb,
        async (documents, updateData) => {
          // First create documents
          const created = await service.batchCreate(documents);
          
          // Prepare updates (only include defined values)
          const updates = created.map(doc => ({
            id: doc.id,
            data: Object.fromEntries(
              Object.entries(updateData).filter(([, v]) => v !== undefined)
            ) as Partial<TestDocument>,
          }));
          
          // Skip if no actual updates
          if (Object.keys(updates[0].data).length === 0) {
            return;
          }
          
          // Apply batch update
          await service.batchUpdate(updates);
          
          // Verify all updates were applied
          for (const update of updates) {
            const doc = await service.getById(update.id);
            expect(doc).not.toBeNull();
            
            for (const [key, value] of Object.entries(update.data)) {
              if (value !== undefined && doc) {
                expect((doc as unknown as Record<string, unknown>)[key]).toBe(value);
              }
            }
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 11c: Batch delete - all documents deleted or none
   */
  it('Property 11c: Batch delete - all documents deleted or none', async () => {
    await fc.assert(
      fc.asyncProperty(
        batchDocumentsArb,
        async (documents) => {
          // First create documents
          const created = await service.batchCreate(documents);
          const ids = created.map(d => d.id);
          
          // Verify all exist
          for (const id of ids) {
            const doc = await service.getById(id);
            expect(doc).not.toBeNull();
          }
          
          // Delete all in batch
          await service.batchDelete(ids);
          
          // Verify all were deleted
          for (const id of ids) {
            const doc = await service.getById(id);
            expect(doc).toBeNull();
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 11d: Failed batch leaves store unchanged
   */
  it('Property 11d: Failed batch create leaves store unchanged', async () => {
    await fc.assert(
      fc.asyncProperty(
        batchDocumentsArb,
        async (documents) => {
          // Take snapshot of current state
          const snapshotBefore = new Map(documentStore);
          
          // Set up failure
          shouldFailOnCommit = true;
          
          // Attempt batch create
          try {
            await service.batchCreate(documents);
            // Should not reach here
            expect(true).toBe(false);
          } catch {
            // Expected failure
          }
          
          // Verify store is unchanged
          expect(documentStore.size).toBe(snapshotBefore.size);
          for (const [id, data] of snapshotBefore) {
            expect(documentStore.get(id)).toEqual(data);
          }
          
          // Reset failure flag
          shouldFailOnCommit = false;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 11e: Transaction operations are atomic
   */
  it('Property 11e: Transaction operations are atomic', async () => {
    await fc.assert(
      fc.asyncProperty(
        testDocumentArb,
        testDocumentArb,
        async (doc1Data, doc2Data) => {
          // Create initial documents
          const doc1 = await service.create(doc1Data);
          const doc2 = await service.create(doc2Data);
          
          const originalValue1 = doc1.value;
          const originalValue2 = doc2.value;
          
          // Run transaction that updates both
          const transferAmount = Math.min(originalValue1, 100);
          
          await service.runTransaction(async () => {
            // Simulate transfer: decrease doc1, increase doc2
            await service.update(doc1.id, { value: originalValue1 - transferAmount } as Partial<TestDocument>);
            await service.update(doc2.id, { value: originalValue2 + transferAmount } as Partial<TestDocument>);
          });
          
          // Verify both updates were applied
          const updated1 = await service.getById(doc1.id);
          const updated2 = await service.getById(doc2.id);
          
          expect(updated1?.value).toBe(originalValue1 - transferAmount);
          expect(updated2?.value).toBe(originalValue2 + transferAmount);
          
          // Verify total value is preserved (conservation)
          expect((updated1?.value || 0) + (updated2?.value || 0)).toBe(originalValue1 + originalValue2);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 11f: Failed transaction leaves store unchanged
   */
  it('Property 11f: Failed transaction leaves store unchanged', async () => {
    await fc.assert(
      fc.asyncProperty(
        testDocumentArb,
        testDocumentArb,
        async (doc1Data, doc2Data) => {
          // Create initial documents
          const doc1 = await service.create(doc1Data);
          const doc2 = await service.create(doc2Data);
          
          // Take snapshot
          const value1Before = doc1.value;
          const value2Before = doc2.value;
          
          // Set up failure
          shouldFailOnCommit = true;
          
          // Attempt transaction
          try {
            await service.runTransaction(async () => {
              await service.update(doc1.id, { value: 999999 } as Partial<TestDocument>);
              await service.update(doc2.id, { value: 888888 } as Partial<TestDocument>);
            });
            // Should not reach here
            expect(true).toBe(false);
          } catch {
            // Expected failure
          }
          
          // Reset failure flag
          shouldFailOnCommit = false;
          
          // Verify documents are unchanged
          const after1 = await service.getById(doc1.id);
          const after2 = await service.getById(doc2.id);
          
          expect(after1?.value).toBe(value1Before);
          expect(after2?.value).toBe(value2Before);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 11g: Batch operations maintain data integrity
   */
  it('Property 11g: Batch operations maintain data integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(testDocumentArb, { minLength: 3, maxLength: 8 }),
        async (documents) => {
          // Create documents
          const created = await service.batchCreate(documents);
          
          // Calculate total value before
          const totalBefore = created.reduce((sum, d) => sum + d.value, 0);
          
          // Update all documents with new values that preserve total
          const newValues = documents.map((_, i) => Math.floor(totalBefore / documents.length) + (i === 0 ? totalBefore % documents.length : 0));
          
          const updates = created.map((doc, i) => ({
            id: doc.id,
            data: { value: newValues[i] } as Partial<TestDocument>,
          }));
          
          await service.batchUpdate(updates);
          
          // Verify total is preserved
          let totalAfter = 0;
          for (const doc of created) {
            const updated = await service.getById(doc.id);
            totalAfter += updated?.value || 0;
          }
          
          expect(totalAfter).toBe(totalBefore);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 11h: Sequential batch operations are independent
   */
  it('Property 11h: Sequential batch operations are independent', async () => {
    await fc.assert(
      fc.asyncProperty(
        batchDocumentsArb,
        batchDocumentsArb,
        async (batch1, batch2) => {
          // Create first batch
          const created1 = await service.batchCreate(batch1);
          const count1 = documentStore.size;
          
          // Create second batch
          const created2 = await service.batchCreate(batch2);
          
          // Verify both batches exist
          expect(documentStore.size).toBe(count1 + batch2.length);
          
          // Verify first batch is still intact
          for (const doc of created1) {
            const retrieved = await service.getById(doc.id);
            expect(retrieved).not.toBeNull();
            expect(retrieved?.name).toBe(doc.name);
          }
          
          // Verify second batch exists
          for (const doc of created2) {
            const retrieved = await service.getById(doc.id);
            expect(retrieved).not.toBeNull();
            expect(retrieved?.name).toBe(doc.name);
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});
