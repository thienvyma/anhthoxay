/**
 * Furniture Category Service
 *
 * Handles business logic for:
 * - Categories (Danh mục sản phẩm)
 *
 * **Feature: furniture-quotation**
 * **Requirements: 2.1, 2.6, 2.7**
 */

import {
  PrismaClient,
  Prisma,
  FurnitureCategory,
} from '@prisma/client';
import { FurnitureServiceError } from './furniture.error';
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  FurnitureCategoryWithCount,
} from './furniture.types';

export class FurnitureCategoryService {
  constructor(private prisma: PrismaClient) {}

  async getCategories(): Promise<FurnitureCategoryWithCount[]> {
    return this.prisma.furnitureCategory.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async createCategory(input: CreateCategoryInput): Promise<FurnitureCategory> {
    try {
      return await this.prisma.furnitureCategory.create({
        data: input,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new FurnitureServiceError(
            'CONFLICT',
            'Category with this name already exists',
            409
          );
        }
      }
      throw error;
    }
  }

  async updateCategory(
    id: string,
    input: UpdateCategoryInput
  ): Promise<FurnitureCategory> {
    try {
      return await this.prisma.furnitureCategory.update({
        where: { id },
        data: input,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new FurnitureServiceError('NOT_FOUND', 'Category not found', 404);
        }
      }
      throw error;
    }
  }

  async deleteCategory(id: string): Promise<void> {
    const count = await this.prisma.furnitureProduct.count({
      where: { categoryId: id },
    });
    if (count > 0) {
      throw new FurnitureServiceError(
        'CONFLICT',
        'Không thể xóa danh mục đang có sản phẩm',
        409
      );
    }

    try {
      await this.prisma.furnitureCategory.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new FurnitureServiceError('NOT_FOUND', 'Category not found', 404);
        }
      }
      throw error;
    }
  }
}
