/**
 * Errors Index
 * Re-exports all error classes and utilities
 */

export {
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
  isRetryableError,
  calculateRetryDelay,
  DEFAULT_RETRY_CONFIG,
  type RetryConfig,
} from './firestore.errors';
