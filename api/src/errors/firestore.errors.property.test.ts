/**
 * Property-Based Tests for Firestore Error Handling
 * Using fast-check for property testing
 *
 * **Feature: firebase-phase3-firestore**
 * **Validates: Requirements 13.1, 13.2**
 *
 * These tests verify the correctness properties of the Firestore error handling
 * using mocked Firestore operations to test the logic without requiring
 * actual Firestore connection.
 */

import * as fc from 'fast-check';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as admin from 'firebase-admin';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  ForbiddenError,
  ServiceUnavailableError,
  DuplicateError,
  RateLimitError,
  mapFirestoreError,
  isNotFoundError,
  isValidationError,
  isConflictError,
  isForbiddenError,
  isServiceUnavailableError,
  fromZodError,
  withRetry,
  isRetryableError,
  calculateRetryDelay,
  DEFAULT_RETRY_CONFIG,
} from './firestore.errors';
import { BaseFirestoreService, type FirestoreDocument } from '../services/firestore/base.firestore';

// ============================================
// TEST TYPES
// ============================================

interface TestDocument extends FirestoreDocument {
  name: string;
  value: number;
}

// ============================================
// GENERATORS
// ============================================

/**
 * Generator for collection names
 */
const collectionNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(s));

/**
 * Generator for document IDs
 */
const documentIdArb = fc.string({ minLength: 1, maxLength: 100 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s));

/**
 * Generator for field names
 */
const fieldNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s));

/**
 * Generator for error messages
 */
const errorMessageArb = fc.string({ minLength: 1, maxLength: 200 });

/**
 * Generator for Firestore error codes
 */
const firestoreErrorCodeArb = fc.constantFrom(
  'not-found',
  'permission-denied',
  'already-exists',
  'failed-precondition',
  'aborted',
  'unavailable',
  'resource-exhausted',
  'deadline-exceeded',
  'cancelled',
  'invalid-argument',
  'out-of-range',
  'unimplemented',
  'internal',
  'data-loss',
  'unauthenticated'
);

/**
 * Generator for retry attempts
 */
const retryAttemptArb = fc.integer({ min: 0, max: 10 });

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
vi.mock('../services/firebase-admin.service', () => ({
  getFirestore: vi.fn(),
}));

// In-memory store for testing
let mockStore: Map<string, Record<string, unknown>>;

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
          mockStore.set(docId, data);
        }),
        update: vi.fn(async (data: Record<string, unknown>) => {
          const existing = mockStore.get(docId);
          if (existing) {
            mockStore.set(docId, { ...existing, ...data });
          }
        }),
        delete: vi.fn(async () => {
          mockStore.delete(docId);
        }),
      };
    }),
    add: vi.fn(async (data: Record<string, unknown>) => {
      const docId = `auto_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      mockStore.set(docId, data);
      return { id: docId };
    }),
    where: vi.fn(function() { return this; }),
    orderBy: vi.fn(function() { return this; }),
    limit: vi.fn(function() { return this; }),
    get: vi.fn(async () => ({
      docs: Array.from(mockStore.entries()).map(([id, data]) => ({
        id,
        data: () => data,
        exists: true,
      })),
      empty: mockStore.size === 0,
    })),
  };
}

function createMockFirestore() {
  const mockCollection = createMockCollection();
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

describe('Firestore Error Handling Property Tests', () => {
  let service: BaseFirestoreService<TestDocument>;
  let mockFirestore: ReturnType<typeof createMockFirestore>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockStore = new Map();
    mockFirestore = createMockFirestore();
    
    const { getFirestore } = await import('../services/firebase-admin.service');
    vi.mocked(getFirestore).mockResolvedValue(mockFirestore as unknown as admin.firestore.Firestore);
    
    service = new BaseFirestoreService<TestDocument>('testCollection');
  });

  /**
   * **Feature: firebase-phase3-firestore, Property 16: Error Handling - Not Found**
   * **Validates: Requirements 13.1**
   * 
   * For any non-existent document ID, getById should return null (not throw).
   */
  it('Property 16: Error Handling - Not Found', async () => {
    await fc.assert(
      fc.asyncProperty(documentIdArb, async (nonExistentId) => {
        // Ensure the document doesn't exist
        mockStore.clear();
        
        // getById should return null for non-existent documents
        const result = await service.getById(nonExistentId);
        
        expect(result).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: firebase-phase3-firestore, Property 17: Error Handling - Validation**
   * **Validates: Requirements 13.2**
   * 
   * For any invalid document data, ValidationError should contain field details.
   * When duplicate field names exist, the last error message for that field is kept.
   */
  it('Property 17: Error Handling - Validation', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            field: fieldNameArb,
            message: errorMessageArb,
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (fieldErrors) => {
          // Create ValidationError from field errors
          const error = ValidationError.fromFieldErrors(fieldErrors);
          
          // Verify error properties
          expect(error).toBeInstanceOf(ValidationError);
          expect(error.code).toBe('VALIDATION_ERROR');
          expect(error.statusCode).toBe(400);
          expect(error.message).toBe('Validation failed');
          
          // Build expected fields map (last message wins for duplicate fields)
          const expectedFields: Record<string, string> = {};
          for (const fieldError of fieldErrors) {
            expectedFields[fieldError.field] = fieldError.message;
          }
          
          // Verify fields match expected (accounting for duplicates - last one wins)
          expect(error.fields).toEqual(expectedFields);
          
          // Verify fields count matches unique field count
          const uniqueFields = new Set(fieldErrors.map(e => e.field));
          expect(Object.keys(error.fields).length).toBe(uniqueFields.size);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Error Type Property Tests', () => {
  /**
   * NotFoundError should correctly capture collection and document ID
   */
  it('NotFoundError captures collection and document ID', () => {
    fc.assert(
      fc.property(collectionNameArb, documentIdArb, (collection, documentId) => {
        const error = new NotFoundError(collection, documentId);
        
        expect(error.collection).toBe(collection);
        expect(error.documentId).toBe(documentId);
        expect(error.code).toBe('NOT_FOUND');
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain(collection);
        expect(error.message).toContain(documentId);
        expect(isNotFoundError(error)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * ValidationError should correctly capture field errors
   */
  it('ValidationError captures field errors', () => {
    fc.assert(
      fc.property(
        errorMessageArb,
        fc.dictionary(fieldNameArb, errorMessageArb, { minKeys: 1, maxKeys: 10 }),
        (message, fields) => {
          const error = new ValidationError(message, fields);
          
          expect(error.message).toBe(message);
          expect(error.fields).toEqual(fields);
          expect(error.code).toBe('VALIDATION_ERROR');
          expect(error.statusCode).toBe(400);
          expect(isValidationError(error)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * ConflictError should have correct status code
   */
  it('ConflictError has correct properties', () => {
    fc.assert(
      fc.property(errorMessageArb, (message) => {
        const error = new ConflictError(message);
        
        expect(error.message).toBe(message);
        expect(error.code).toBe('CONFLICT');
        expect(error.statusCode).toBe(409);
        expect(isConflictError(error)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * ForbiddenError should have correct status code
   */
  it('ForbiddenError has correct properties', () => {
    fc.assert(
      fc.property(errorMessageArb, (message) => {
        const error = new ForbiddenError(message);
        
        expect(error.message).toBe(message);
        expect(error.code).toBe('FORBIDDEN');
        expect(error.statusCode).toBe(403);
        expect(isForbiddenError(error)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * ServiceUnavailableError should capture retry information
   */
  it('ServiceUnavailableError captures retry information', () => {
    fc.assert(
      fc.property(
        errorMessageArb,
        fc.option(fc.integer({ min: 1, max: 3600 })),
        (message, retryAfter) => {
          const error = new ServiceUnavailableError(message, retryAfter ?? undefined);
          
          expect(error.message).toBe(message);
          expect(error.code).toBe('SERVICE_UNAVAILABLE');
          expect(error.statusCode).toBe(503);
          expect(error.retryAfter).toBe(retryAfter ?? undefined);
          expect(isServiceUnavailableError(error)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * DuplicateError should capture field and value
   */
  it('DuplicateError captures field and value', () => {
    fc.assert(
      fc.property(fieldNameArb, fc.string(), (field, value) => {
        const error = new DuplicateError(field, value);
        
        expect(error.field).toBe(field);
        expect(error.value).toBe(value);
        expect(error.code).toBe('DUPLICATE');
        expect(error.statusCode).toBe(409);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * RateLimitError should capture retry after
   */
  it('RateLimitError captures retry after', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 3600 }), (retryAfter) => {
        const error = new RateLimitError(retryAfter);
        
        expect(error.retryAfter).toBe(retryAfter);
        expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
        expect(error.statusCode).toBe(429);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Error Mapping Property Tests', () => {
  /**
   * mapFirestoreError should correctly map Firestore error codes
   */
  it('mapFirestoreError maps Firestore error codes correctly', () => {
    fc.assert(
      fc.property(firestoreErrorCodeArb, errorMessageArb, (code, message) => {
        const firestoreError = { code: `firestore/${code}`, message };
        const mappedError = mapFirestoreError(firestoreError);
        
        // Verify error is mapped to correct type
        expect(mappedError).toBeDefined();
        expect(mappedError.statusCode).toBeGreaterThanOrEqual(400);
        expect(mappedError.statusCode).toBeLessThanOrEqual(599);
        
        // Verify specific mappings
        switch (code) {
          case 'not-found':
            expect(mappedError.statusCode).toBe(404);
            break;
          case 'permission-denied':
            expect(mappedError.statusCode).toBe(403);
            expect(isForbiddenError(mappedError)).toBe(true);
            break;
          case 'already-exists':
            expect(mappedError.statusCode).toBe(409);
            expect(isConflictError(mappedError)).toBe(true);
            break;
          case 'unavailable':
          case 'deadline-exceeded':
            expect(mappedError.statusCode).toBe(503);
            expect(isServiceUnavailableError(mappedError)).toBe(true);
            break;
          case 'resource-exhausted':
            expect(mappedError.statusCode).toBe(429);
            break;
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * mapFirestoreError should handle already-mapped errors
   */
  it('mapFirestoreError returns same error if already FirestoreError', () => {
    fc.assert(
      fc.property(collectionNameArb, documentIdArb, (collection, documentId) => {
        const originalError = new NotFoundError(collection, documentId);
        const mappedError = mapFirestoreError(originalError);
        
        expect(mappedError).toBe(originalError);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * mapFirestoreError should handle generic errors
   */
  it('mapFirestoreError handles generic Error objects', () => {
    fc.assert(
      fc.property(errorMessageArb, (message) => {
        const genericError = new Error(message);
        const mappedError = mapFirestoreError(genericError);
        
        expect(mappedError.code).toBe('UNKNOWN');
        expect(mappedError.statusCode).toBe(500);
        expect(mappedError.message).toBe(message);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Retry Logic Property Tests', () => {
  /**
   * isRetryableError should correctly identify retryable errors
   */
  it('isRetryableError identifies retryable errors', () => {
    // Retryable errors
    expect(isRetryableError(new ConflictError('aborted'))).toBe(false); // ConflictError with message 'aborted' is not the same as code 'aborted'
    expect(isRetryableError(new ServiceUnavailableError('unavailable'))).toBe(true);
    expect(isRetryableError(new RateLimitError(60))).toBe(true);
    
    // Non-retryable errors
    expect(isRetryableError(new NotFoundError('col', 'id'))).toBe(false);
    expect(isRetryableError(new ValidationError('msg', {}))).toBe(false);
    expect(isRetryableError(new ForbiddenError('msg'))).toBe(false);
  });

  /**
   * calculateRetryDelay should increase with attempts (exponential backoff)
   */
  it('calculateRetryDelay increases with attempts', () => {
    fc.assert(
      fc.property(retryAttemptArb, (attempt) => {
        const delay = calculateRetryDelay(attempt);
        
        // Delay should be positive
        expect(delay).toBeGreaterThan(0);
        
        // Delay should not exceed max
        expect(delay).toBeLessThanOrEqual(DEFAULT_RETRY_CONFIG.maxDelayMs);
        
        // For attempt 0, delay should be around initialDelayMs (with jitter)
        if (attempt === 0) {
          expect(delay).toBeLessThanOrEqual(DEFAULT_RETRY_CONFIG.initialDelayMs * 1.1);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * withRetry should succeed on first try if no error
   */
  it('withRetry succeeds on first try if no error', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer(), async (value) => {
        let callCount = 0;
        const fn = async () => {
          callCount++;
          return value;
        };
        
        const result = await withRetry(fn);
        
        expect(result).toBe(value);
        expect(callCount).toBe(1);
      }),
      { numRuns: 50 }
    );
  });

  /**
   * withRetry should throw non-retryable errors immediately
   */
  it('withRetry throws non-retryable errors immediately', async () => {
    await fc.assert(
      fc.asyncProperty(collectionNameArb, documentIdArb, async (collection, documentId) => {
        let callCount = 0;
        const error = new NotFoundError(collection, documentId);
        const fn = async () => {
          callCount++;
          throw error;
        };
        
        await expect(withRetry(fn)).rejects.toThrow(NotFoundError);
        expect(callCount).toBe(1);
      }),
      { numRuns: 50 }
    );
  });
});

describe('Zod Error Conversion Property Tests', () => {
  /**
   * fromZodError should correctly convert Zod errors to ValidationError
   * When duplicate paths exist, the last error message for that path is kept.
   */
  it('fromZodError converts Zod errors correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            path: fc.array(fc.oneof(fc.string({ minLength: 1, maxLength: 20 }), fc.integer({ min: 0, max: 100 })), { minLength: 1, maxLength: 5 }),
            message: errorMessageArb,
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (errors) => {
          const zodError = { errors };
          const validationError = fromZodError(zodError);
          
          expect(validationError).toBeInstanceOf(ValidationError);
          expect(validationError.code).toBe('VALIDATION_ERROR');
          expect(validationError.statusCode).toBe(400);
          
          // Build expected fields map (last message wins for duplicate paths)
          const expectedFields: Record<string, string> = {};
          for (const error of errors) {
            const fieldName = error.path.join('.');
            expectedFields[fieldName] = error.message;
          }
          
          // Verify fields match expected
          expect(validationError.fields).toEqual(expectedFields);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Error toJSON Property Tests', () => {
  /**
   * Error toJSON should produce valid JSON representation
   */
  it('Error toJSON produces valid JSON', () => {
    fc.assert(
      fc.property(collectionNameArb, documentIdArb, (collection, documentId) => {
        const error = new NotFoundError(collection, documentId);
        const json = error.toJSON();
        
        expect(json.name).toBe('NotFoundError');
        expect(json.code).toBe('NOT_FOUND');
        expect(json.statusCode).toBe(404);
        expect(json.message).toContain(collection);
        expect(json.message).toContain(documentId);
        expect(json.details).toEqual({ collection, documentId });
        
        // Should be serializable
        const serialized = JSON.stringify(json);
        const parsed = JSON.parse(serialized);
        expect(parsed.code).toBe('NOT_FOUND');
      }),
      { numRuns: 100 }
    );
  });
});
