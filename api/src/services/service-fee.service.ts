/**
 * Service Fee Service
 *
 * Business logic for service fee management.
 * Handles CRUD operations for service fees.
 *
 * **Feature: bidding-phase1-foundation**
 * **Requirements: REQ-5.2**
 */

import { PrismaClient } from '@prisma/client';
import type {
  CreateServiceFeeInput,
  UpdateServiceFeeInput,
  ServiceFee,
} from '../schemas/service-fee.schema';

// ============================================
// SERVICE FEE SERVICE CLASS
// ============================================

export class ServiceFeeService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * List all service fees
   * @param activeOnly - If true, only return active fees
   */
  async list(activeOnly = false): Promise<ServiceFee[]> {
    const where = activeOnly ? { isActive: true } : {};
    
    return this.prisma.serviceFee.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get service fee by ID
   * @param id - Service fee ID
   */
  async getById(id: string): Promise<ServiceFee | null> {
    return this.prisma.serviceFee.findUnique({
      where: { id },
    });
  }

  /**
   * Get service fee by code
   * @param code - Service fee code (e.g., VERIFICATION_FEE)
   */
  async getByCode(code: string): Promise<ServiceFee | null> {
    return this.prisma.serviceFee.findUnique({
      where: { code },
    });
  }

  /**
   * Create a new service fee
   * @param data - Service fee data
   */
  async create(data: CreateServiceFeeInput): Promise<ServiceFee> {
    // Check if code already exists
    const existing = await this.getByCode(data.code);
    if (existing) {
      throw new ServiceFeeError(
        'CODE_EXISTS',
        `Mã phí "${data.code}" đã tồn tại`
      );
    }

    return this.prisma.serviceFee.create({
      data: {
        name: data.name,
        code: data.code,
        type: data.type,
        value: data.value,
        description: data.description ?? null,
        isActive: data.isActive ?? true,
      },
    });
  }

  /**
   * Update an existing service fee
   * @param id - Service fee ID
   * @param data - Updated data
   */
  async update(id: string, data: UpdateServiceFeeInput): Promise<ServiceFee> {
    // Check if fee exists
    const existing = await this.getById(id);
    if (!existing) {
      throw new ServiceFeeError('NOT_FOUND', 'Không tìm thấy phí dịch vụ');
    }

    // Check if new code conflicts with another fee
    if (data.code && data.code !== existing.code) {
      const codeExists = await this.getByCode(data.code);
      if (codeExists) {
        throw new ServiceFeeError(
          'CODE_EXISTS',
          `Mã phí "${data.code}" đã tồn tại`
        );
      }
    }

    // Validate percentage value if type is being changed or value is being updated
    const newType = data.type ?? existing.type;
    const newValue = data.value ?? existing.value;
    if (newType === 'PERCENTAGE' && newValue > 100) {
      throw new ServiceFeeError(
        'INVALID_VALUE',
        'Phần trăm phí phải từ 0 đến 100'
      );
    }

    return this.prisma.serviceFee.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.code !== undefined && { code: data.code }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.value !== undefined && { value: data.value }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  /**
   * Delete a service fee
   * @param id - Service fee ID
   */
  async delete(id: string): Promise<void> {
    // Check if fee exists
    const existing = await this.getById(id);
    if (!existing) {
      throw new ServiceFeeError('NOT_FOUND', 'Không tìm thấy phí dịch vụ');
    }

    await this.prisma.serviceFee.delete({
      where: { id },
    });
  }
}

// ============================================
// SERVICE FEE ERROR CLASS
// ============================================

export class ServiceFeeError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'ServiceFeeError';

    // Map error codes to HTTP status codes
    const statusMap: Record<string, number> = {
      NOT_FOUND: 404,
      CODE_EXISTS: 409,
      INVALID_VALUE: 400,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}
