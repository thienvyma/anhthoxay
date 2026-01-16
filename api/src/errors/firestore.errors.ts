/**
 * Firestore Error Handling
 * Custom error classes and error mapping for Firestore operations
 * 
 * @module errors/firestore.errors
 * @requirements 13.1, 13.2, 13.3, 13.4, 13.5
 */

import { logger } from '../utils/logger';

// ============================================
// BASE ERROR CLASS
// ============================================

/**
 * Base Firestore error class
 */
export class FirestoreError extends Error {
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    statusCode: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'FirestoreError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

// ============================================
// SPECIFIC ERROR CLASSES
// ============================================

/**
 * Error thrown when a document is not found
 * @requirements 13.1
 */
export class NotFoundError extends FirestoreError {
  collection: string;
  documentId: string;

  constructor(collection: string, documentId: string) {
    super(
      'NOT_FOUND',
      `Document not found: ${collection}/${documentId}`,
      404,
      { collection, documentId }
    );
    this.name = 'NotFoundError';
    this.collection = collection;
    this.documentId = documentId;
  }
}

/**
 * Error thrown when validation fails
 * @requirements 13.2
 */
export class ValidationError extends FirestoreError {
  fields: Record<string, string>;

  constructor(message: string, fields: Record<string, string>) {
    super(
      'VALIDATION_ERROR',
      message,
      400,
      { fields }
    );
    this.name = 'ValidationError';
    this.fields = fields;
  }

  static fromFieldErrors(errors: Array<{ field: string; message: string }>): ValidationError {
    const fields: Record<string, string> = {};
    for (const error of errors) {
      fields[error.field] = error.message;
    }
    return new ValidationError('Validation failed', fields);
  }
}

/**
 * Error thrown when a transaction conflict occurs
 * @requirements 13.3
 */
export class ConflictError extends FirestoreError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      'CONFLICT',
      message,
      409,
      details
    );
    this.name = 'ConflictError';
  }
}

/**
 * Error thrown when permission is denied
 * @requirements 13.5
 */
export class ForbiddenError extends FirestoreError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      'FORBIDDEN',
      message,
      403,
      details
    );
    this.name = 'ForbiddenError';
  }
}

/**
 * Error thrown when Firestore service is unavailable
 * @requirements 13.4
 */
export class ServiceUnavailableError extends FirestoreError {
  retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(
      'SERVICE_UNAVAILABLE',
      message,
      503,
      retryAfter ? { retryAfter } : undefined
    );
    this.name = 'ServiceUnavailableError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Error thrown when a duplicate document is detected
 */
export class DuplicateError extends FirestoreError {
  field: string;
  value: unknown;

  constructor(field: string, value: unknown) {
    super(
      'DUPLICATE',
      `Duplicate value for field: ${field}`,
      409,
      { field, value }
    );
    this.name = 'DuplicateError';
    this.field = field;
    this.value = value;
  }
}

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends FirestoreError {
  retryAfter: number;

  constructor(retryAfter: number) {
    super(
      'RATE_LIMIT_EXCEEDED',
      'Too many requests. Please try again later.',
      429,
      { retryAfter }
    );
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

// ============================================
// ERROR MAPPING
// ============================================

/**
 * Firestore error code to status code mapping
 */
const FIRESTORE_ERROR_STATUS_MAP: Record<string, number> = {
  'not-found': 404,
  'permission-denied': 403,
  'already-exists': 409,
  'failed-precondition': 400,
  'aborted': 409,
  'unavailable': 503,
  'resource-exhausted': 429,
  'deadline-exceeded': 504,
  'cancelled': 499,
  'invalid-argument': 400,
  'out-of-range': 400,
  'unimplemented': 501,
  'internal': 500,
  'data-loss': 500,
  'unauthenticated': 401,
};

/**
 * Map Firestore error to application error
 */
export function mapFirestoreError(error: unknown): FirestoreError {
  // Already a FirestoreError
  if (error instanceof FirestoreError) {
    return error;
  }

  // Handle Firebase/Firestore errors
  if (error && typeof error === 'object' && 'code' in error) {
    const errorCode = String((error as { code: unknown }).code);
    const errorMessage = 'message' in error ? String((error as { message: unknown }).message) : 'Unknown error';
    
    // Extract Firestore error code (format: "firestore/error-code" or just "error-code")
    const code = errorCode.replace('firestore/', '').replace('firebase/', '');
    
    // Map to specific error types
    switch (code) {
      case 'not-found':
        return new FirestoreError('NOT_FOUND', 'Document not found', 404);
      case 'permission-denied':
        return new ForbiddenError('Permission denied');
      case 'already-exists':
        return new ConflictError('Document already exists');
      case 'failed-precondition':
      case 'invalid-argument':
      case 'out-of-range':
        return new ValidationError(errorMessage, {});
      case 'aborted':
        return new ConflictError('Transaction aborted due to conflict');
      case 'unavailable':
      case 'deadline-exceeded':
        return new ServiceUnavailableError('Firestore service is temporarily unavailable', 30);
      case 'resource-exhausted':
        return new RateLimitError(60);
      default: {
        const statusCode = FIRESTORE_ERROR_STATUS_MAP[code] || 500;
        return new FirestoreError(code.toUpperCase(), errorMessage, statusCode);
      }
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    return new FirestoreError('UNKNOWN', error.message, 500);
  }

  // Unknown error type
  return new FirestoreError('UNKNOWN', 'An unknown error occurred', 500);
}

// ============================================
// RETRY LOGIC
// ============================================

/**
 * Configuration for retry logic
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

/**
 * Default retry configuration
 * @requirements 13.3
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  retryableErrors: ['aborted', 'unavailable', 'deadline-exceeded', 'resource-exhausted'],
};

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown, config: RetryConfig = DEFAULT_RETRY_CONFIG): boolean {
  if (error instanceof ConflictError && error.code === 'aborted') {
    return true;
  }
  if (error instanceof ServiceUnavailableError) {
    return true;
  }
  if (error instanceof RateLimitError) {
    return true;
  }
  
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code: unknown }).code).replace('firestore/', '');
    return config.retryableErrors.includes(code);
  }
  
  return false;
}

/**
 * Calculate delay for retry with exponential backoff
 */
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  // Add jitter (±10%)
  const jitter = delay * 0.1 * (Math.random() * 2 - 1);
  return Math.min(delay + jitter, config.maxDelayMs);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic for transaction conflicts
 * @requirements 13.3
 * 
 * @param fn - Function to execute
 * @param config - Retry configuration
 * @returns Result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (attempt < config.maxRetries && isRetryableError(error, config)) {
        const delay = calculateRetryDelay(attempt, config);
        logger.warn(`Retrying operation after ${delay}ms (attempt ${attempt + 1}/${config.maxRetries})`, {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        await sleep(delay);
        continue;
      }
      
      // No more retries, throw the error
      throw mapFirestoreError(error);
    }
  }
  
  // Should not reach here, but just in case
  throw mapFirestoreError(lastError);
}

/**
 * Execute a transaction with retry logic
 * @requirements 13.3
 */
export async function withTransactionRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  return withRetry(fn, {
    ...DEFAULT_RETRY_CONFIG,
    maxRetries,
    retryableErrors: ['aborted'], // Only retry on transaction conflicts
  });
}

// ============================================
// ERROR HELPERS
// ============================================

/**
 * Check if error is a NotFoundError
 */
export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

/**
 * Check if error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Check if error is a ConflictError
 */
export function isConflictError(error: unknown): error is ConflictError {
  return error instanceof ConflictError;
}

/**
 * Check if error is a ForbiddenError
 */
export function isForbiddenError(error: unknown): error is ForbiddenError {
  return error instanceof ForbiddenError;
}

/**
 * Check if error is a ServiceUnavailableError
 */
export function isServiceUnavailableError(error: unknown): error is ServiceUnavailableError {
  return error instanceof ServiceUnavailableError;
}

/**
 * Create a validation error from Zod errors
 */
export function fromZodError(zodError: { errors: Array<{ path: (string | number)[]; message: string }> }): ValidationError {
  const fields: Record<string, string> = {};
  for (const error of zodError.errors) {
    const path = error.path.join('.');
    fields[path] = error.message;
  }
  return new ValidationError('Validation failed', fields);
}

export default {
  FirestoreError,
  NotFoundError,
  ValidationError,
  ConflictError,
  ForbiddenError,
  ServiceUnavailableError,
  DuplicateError,
  RateLimitError,
  mapFirestoreError,
  withRetry,
  withTransactionRetry,
  isNotFoundError,
  isValidationError,
  isConflictError,
  isForbiddenError,
  isServiceUnavailableError,
  fromZodError,
};
