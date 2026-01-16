/**
 * Service Fee Firestore Service
 * 
 * Handles service fee storage in Firestore.
 * Service fees are stored in `serviceFees/{feeId}` collection.
 * 
 * @module services/firestore/service-fee.firestore
 * @requirements 3.5
 */

import { BaseFirestoreService, type QueryOptions } from './base.firestore';
import type { FirestoreServiceFee, ServiceFeeType } from '../../types/firestore.types';
import { logger } from '../../utils/logger';

// ============================================
// TYPES
// ============================================

/**
 * Input for creating a service fee
 */
export interface CreateServiceFeeInput {
  name: string;
  code: string;
  type: ServiceFeeType;
  value: number;
  description?: string;
  isActive?: boolean;
}

/**
 * Input for updating a service fee
 */
export interface UpdateServiceFeeInput {
  name?: string;
  code?: string;
  type?: ServiceFeeType;
  value?: number;
  description?: string;
  isActive?: boolean;
}

// ============================================
// SERVICE FEE ERROR CLASS
// ============================================

export class ServiceFeeFirestoreError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'ServiceFeeFirestoreError';

    const statusMap: Record<string, number> = {
      NOT_FOUND: 404,
      CODE_EXISTS: 409,
      INVALID_VALUE: 400,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}

// ============================================
// SERVICE FEE FIRESTORE SERVICE CLASS
// ============================================

/**
 * Firestore service for service fee management
 */
export class ServiceFeeFirestoreService extends BaseFirestoreService<FirestoreServiceFee> {
  constructor() {
    super('serviceFees');
  }

  // ============================================
  // QUERY METHODS
  // ============================================

  /**
   * List all service fees
   * 
   * @param activeOnly - If true, only return active fees
   * @returns Array of service fees
   */
  async list(activeOnly = false): Promise<FirestoreServiceFee[]> {
    const queryOptions: QueryOptions<FirestoreServiceFee> = {
      orderBy: [{ field: 'createdAt', direction: 'asc' }],
    };

    if (activeOnly) {
      queryOptions.where = [{ field: 'isActive', operator: '==', value: true }];
    }

    return this.query(queryOptions);
  }

  /**
   * Get service fee by code
   * 
   * @param code - Service fee code (e.g., VERIFICATION_FEE)
   * @returns Service fee or null if not found
   */
  async getByCode(code: string): Promise<FirestoreServiceFee | null> {
    const results = await this.query({
      where: [{ field: 'code', operator: '==', value: code }],
      limit: 1,
    });

    return results.length > 0 ? results[0] : null;
  }

  /**
   * Get service fees by type
   * 
   * @param type - Fee type (FIXED or PERCENTAGE)
   * @returns Array of service fees with the specified type
   */
  async getByType(type: ServiceFeeType): Promise<FirestoreServiceFee[]> {
    return this.query({
      where: [{ field: 'type', operator: '==', value: type }],
      orderBy: [{ field: 'createdAt', direction: 'asc' }],
    });
  }

  // ============================================
  // CRUD METHODS
  // ============================================

  /**
   * Create a new service fee
   * 
   * @param data - Service fee data
   * @returns Created service fee
   * @throws ServiceFeeFirestoreError if code already exists
   */
  async createServiceFee(data: CreateServiceFeeInput): Promise<FirestoreServiceFee> {
    // Check if code already exists
    const existing = await this.getByCode(data.code);
    if (existing) {
      throw new ServiceFeeFirestoreError(
        'CODE_EXISTS',
        `Mã phí "${data.code}" đã tồn tại`
      );
    }

    // Validate percentage value
    if (data.type === 'PERCENTAGE' && data.value > 100) {
      throw new ServiceFeeFirestoreError(
        'INVALID_VALUE',
        'Phần trăm phí phải từ 0 đến 100'
      );
    }

    const feeData: Omit<FirestoreServiceFee, 'id' | 'createdAt' | 'updatedAt'> = {
      name: data.name,
      code: data.code,
      type: data.type,
      value: data.value,
      description: data.description,
      isActive: data.isActive ?? true,
    };

    const fee = await this.create(feeData);
    logger.debug('Service fee created', { id: fee.id, code: fee.code });
    
    return fee;
  }

  /**
   * Update an existing service fee
   * 
   * @param id - Service fee ID
   * @param data - Update data
   * @returns Updated service fee
   * @throws ServiceFeeFirestoreError if validation fails
   */
  async updateServiceFee(id: string, data: UpdateServiceFeeInput): Promise<FirestoreServiceFee> {
    // Check if fee exists
    const existing = await this.getById(id);
    if (!existing) {
      throw new ServiceFeeFirestoreError('NOT_FOUND', 'Không tìm thấy phí dịch vụ');
    }

    // Check if new code conflicts with another fee
    if (data.code && data.code !== existing.code) {
      const codeExists = await this.getByCode(data.code);
      if (codeExists) {
        throw new ServiceFeeFirestoreError(
          'CODE_EXISTS',
          `Mã phí "${data.code}" đã tồn tại`
        );
      }
    }

    // Validate percentage value
    const newType = data.type ?? existing.type;
    const newValue = data.value ?? existing.value;
    if (newType === 'PERCENTAGE' && newValue > 100) {
      throw new ServiceFeeFirestoreError(
        'INVALID_VALUE',
        'Phần trăm phí phải từ 0 đến 100'
      );
    }

    const updateData: Partial<Omit<FirestoreServiceFee, 'id' | 'createdAt' | 'updatedAt'>> = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const fee = await this.update(id, updateData);
    logger.debug('Service fee updated', { id, changes: Object.keys(updateData) });
    
    return fee;
  }

  /**
   * Delete a service fee
   * 
   * @param id - Service fee ID
   * @throws ServiceFeeFirestoreError if fee not found
   */
  async deleteServiceFee(id: string): Promise<void> {
    // Check if fee exists
    const existing = await this.getById(id);
    if (!existing) {
      throw new ServiceFeeFirestoreError('NOT_FOUND', 'Không tìm thấy phí dịch vụ');
    }

    await this.delete(id);
    logger.debug('Service fee deleted', { id });
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Calculate fee amount based on type and base amount
   * 
   * @param feeCode - Service fee code
   * @param baseAmount - Base amount for percentage calculation
   * @returns Calculated fee amount or null if fee not found
   */
  async calculateFee(feeCode: string, baseAmount: number): Promise<number | null> {
    const fee = await this.getByCode(feeCode);
    if (!fee || !fee.isActive) {
      return null;
    }

    if (fee.type === 'FIXED') {
      return fee.value;
    }

    // PERCENTAGE type
    return Math.round((baseAmount * fee.value) / 100);
  }

  /**
   * Get all active fee codes
   * 
   * @returns Array of active fee codes
   */
  async getActiveCodes(): Promise<string[]> {
    const fees = await this.list(true);
    return fees.map(fee => fee.code);
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let serviceFeeServiceInstance: ServiceFeeFirestoreService | null = null;

/**
 * Get singleton instance of ServiceFeeFirestoreService
 */
export function getServiceFeeFirestoreService(): ServiceFeeFirestoreService {
  if (!serviceFeeServiceInstance) {
    serviceFeeServiceInstance = new ServiceFeeFirestoreService();
  }
  return serviceFeeServiceInstance;
}

export default ServiceFeeFirestoreService;
