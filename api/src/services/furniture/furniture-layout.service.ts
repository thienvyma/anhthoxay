/**
 * Furniture Layout Service
 *
 * Handles business logic for:
 * - Layouts (Layout căn hộ)
 * - Apartment Types (Loại căn hộ)
 * - Metrics Grid generation
 *
 * **Feature: furniture-quotation**
 * **Requirements: 1.3, 1.4, 1.5, 1.10, 1.11, 1.14**
 */

import {
  PrismaClient,
  Prisma,
  FurnitureLayout,
  FurnitureApartmentType,
} from '@prisma/client';
import { FurnitureServiceError } from './furniture.error';
import {
  CreateLayoutInput,
  UpdateLayoutInput,
  CreateApartmentTypeInput,
  UpdateApartmentTypeInput,
} from './furniture.types';

export class FurnitureLayoutService {
  constructor(private prisma: PrismaClient) {}

  // ============================================
  // LAYOUTS
  // ============================================

  async getLayouts(buildingCode: string): Promise<FurnitureLayout[]> {
    return this.prisma.furnitureLayout.findMany({
      where: { buildingCode },
      orderBy: { axis: 'asc' },
    });
  }

  async getLayoutByAxis(
    buildingCode: string,
    axis: number
  ): Promise<FurnitureLayout | null> {
    return this.prisma.furnitureLayout.findUnique({
      where: {
        buildingCode_axis: { buildingCode, axis },
      },
    });
  }

  async createLayout(input: CreateLayoutInput): Promise<FurnitureLayout> {
    const layoutAxis = `${input.buildingCode}_${input.axis.toString().padStart(2, '0')}`;
    const normalizedApartmentType = input.apartmentType.trim().toLowerCase();

    try {
      return await this.prisma.furnitureLayout.create({
        data: {
          layoutAxis,
          buildingCode: input.buildingCode,
          axis: input.axis,
          apartmentType: normalizedApartmentType,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new FurnitureServiceError(
            'CONFLICT',
            'Layout for this building code and axis already exists',
            409
          );
        }
      }
      throw error;
    }
  }

  async updateLayout(id: string, input: UpdateLayoutInput): Promise<FurnitureLayout> {
    const updateData: Prisma.FurnitureLayoutUpdateInput = {};
    if (input.apartmentType !== undefined) {
      updateData.apartmentType = input.apartmentType.trim().toLowerCase();
    }

    try {
      return await this.prisma.furnitureLayout.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new FurnitureServiceError('NOT_FOUND', 'Layout not found', 404);
        }
      }
      throw error;
    }
  }

  async deleteLayout(id: string): Promise<void> {
    try {
      await this.prisma.furnitureLayout.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new FurnitureServiceError('NOT_FOUND', 'Layout not found', 404);
        }
      }
      throw error;
    }
  }

  // ============================================
  // APARTMENT TYPES
  // ============================================

  async getApartmentTypes(
    buildingCode: string,
    type?: string
  ): Promise<FurnitureApartmentType[]> {
    if (type) {
      const normalizedType = type.trim().toLowerCase();
      const exactMatch = await this.prisma.furnitureApartmentType.findMany({
        where: {
          buildingCode,
          apartmentType: normalizedType,
        },
        orderBy: { apartmentType: 'asc' },
      });

      if (exactMatch.length > 0) {
        return exactMatch;
      }
    }

    return this.prisma.furnitureApartmentType.findMany({
      where: { buildingCode },
      orderBy: { apartmentType: 'asc' },
    });
  }

  async createApartmentType(
    input: CreateApartmentTypeInput
  ): Promise<FurnitureApartmentType> {
    return this.prisma.furnitureApartmentType.create({
      data: {
        buildingCode: input.buildingCode,
        apartmentType: input.apartmentType.trim().toLowerCase(),
        imageUrl: input.imageUrl,
        description: input.description,
      },
    });
  }

  async updateApartmentType(
    id: string,
    input: UpdateApartmentTypeInput
  ): Promise<FurnitureApartmentType> {
    const updateData: Prisma.FurnitureApartmentTypeUpdateInput = {};
    if (input.apartmentType !== undefined) {
      updateData.apartmentType = input.apartmentType.trim().toLowerCase();
    }
    if (input.imageUrl !== undefined) {
      updateData.imageUrl = input.imageUrl;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    try {
      return await this.prisma.furnitureApartmentType.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new FurnitureServiceError('NOT_FOUND', 'Apartment type not found', 404);
        }
      }
      throw error;
    }
  }

  async deleteApartmentType(id: string): Promise<void> {
    try {
      await this.prisma.furnitureApartmentType.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new FurnitureServiceError('NOT_FOUND', 'Apartment type not found', 404);
        }
      }
      throw error;
    }
  }

  // ============================================
  // METRICS GRID
  // ============================================

  /**
   * Generate a metrics grid for a building
   * Returns a 2D array where rows = floors (1 to maxFloor), columns = axes (0 to maxAxis)
   * Each cell contains the apartmentType from layouts lookup
   */
  async generateMetricsGrid(
    buildingCode: string,
    maxFloor: number,
    maxAxis: number
  ): Promise<(string | null)[][]> {
    const layouts = await this.getLayouts(buildingCode);
    const layoutMap = new Map<number, string>();
    layouts.forEach((layout) => {
      layoutMap.set(layout.axis, layout.apartmentType);
    });

    const grid: (string | null)[][] = [];
    for (let floor = 1; floor <= maxFloor; floor++) {
      const row: (string | null)[] = [];
      for (let axis = 0; axis <= maxAxis; axis++) {
        row.push(layoutMap.get(axis) || null);
      }
      grid.push(row);
    }

    return grid;
  }
}
