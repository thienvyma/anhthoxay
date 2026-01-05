/**
 * Furniture Service Error Class
 *
 * Custom error class for Furniture Service
 * Follows pattern from pricing.service.ts
 *
 * **Feature: furniture-quotation**
 * **Requirements: 1.12, 1.14**
 */

export class FurnitureServiceError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.code = code;
    this.name = 'FurnitureServiceError';
    this.statusCode = statusCode;
  }
}
