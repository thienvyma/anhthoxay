/**
 * Furniture Fee Service
 *
 * Handles business logic for:
 * - Fees (Phí)
 *
 * **Feature: furniture-quotation**
 * **Requirements: 4.1, 4.2, 4.3, 4.4**
 */

import { PrismaClient, Prisma, FurnitureFee } from '@prisma/client';
import { FurnitureServiceError } from './furniture.error';
import { CreateFeeInput, UpdateFeeInput } from './furniture.types';

export class FurnitureFeeService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all fees (for admin - includes inactive)
   */
  async getFees(activeOnly = false): Promise<FurnitureFee[]> {
    return this.prisma.furnitureFee.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Get only active fees (for public/quotation use)
   */
  async getActiveFees(): Promise<FurnitureFee[]> {
    return this.prisma.furnitureFee.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Get the FIT_IN fee from database
   */
  async getFitInFee(): Promise<FurnitureFee | null> {
    return this.prisma.furnitureFee.findUnique({
      where: { code: 'FIT_IN' },
    });
  }

  /**
   * Get the FIT_IN fee value (throws if not configured)
   */
  async getFitInFeeValue(): Promise<number> {
    const fitInFee = await this.getFitInFee();
    if (!fitInFee) {
      throw new FurnitureServiceError(
        'FIT_IN_FEE_NOT_CONFIGURED',
        'FIT_IN fee not found in system',
        500
      );
    }
    return fitInFee.value;
  }

  async createFee(input: CreateFeeInput): Promise<FurnitureFee> {
    return this.prisma.furnitureFee.create({
      data: {
        ...input,
        applicability: input.applicability || 'BOTH',
      },
    });
  }

  async updateFee(id: string, input: UpdateFeeInput): Promise<FurnitureFee> {
    try {
      return await this.prisma.furnitureFee.update({
        where: { id },
        data: input,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new FurnitureServiceError('NOT_FOUND', 'Fee not found', 404);
        }
      }
      throw error;
    }
  }

  async deleteFee(id: string): Promise<void> {
    try {
      await this.prisma.furnitureFee.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new FurnitureServiceError('NOT_FOUND', 'Fee not found', 404);
        }
      }
      throw error;
    }
  }
}
