/**
 * Furniture Service Module
 *
 * Handles business logic for furniture quotation system including:
 * - Developers (Chủ đầu tư)
 * - Projects (Dự án)
 * - Buildings (Tòa nhà)
 * - Layouts (Layout căn hộ)
 * - Apartment Types (Loại căn hộ)
 * - Categories (Danh mục sản phẩm)
 * - Products (Sản phẩm nội thất)
 * - Combos (Gói combo)
 * - Fees (Phí)
 * - Quotations (Báo giá)
 *
 * **Feature: furniture-quotation**
 * **Requirements: 1.1 - 11.3**
 */

import {
  PrismaClient,
  Prisma,
  FurnitureDeveloper,
  FurnitureProject,
  FurnitureBuilding,
  FurnitureLayout,
  FurnitureApartmentType,
  FurnitureCategory,
  FurnitureProduct,
  FurnitureCombo,
  FurnitureFee,
  FurnitureQuotation,
} from '@prisma/client';

// ============================================
// ERROR CLASS
// ============================================

/**
 * Custom error class for Furniture Service
 * Follows pattern from pricing.service.ts
 * _Requirements: 1.12, 1.14_
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


// ============================================
// TYPES & INTERFACES
// ============================================

/**
 * Combo with items relation
 */
export interface FurnitureComboWithItems extends FurnitureCombo {
  items: Array<{
    id: string;
    comboId: string;
    productId: string;
    quantity: number;
    product: FurnitureProduct;
  }>;
}

/**
 * Product with category relation
 */
export interface FurnitureProductWithCategory extends FurnitureProduct {
  category: FurnitureCategory;
}

/**
 * Category with product count
 */
export interface FurnitureCategoryWithCount extends FurnitureCategory {
  _count: { products: number };
}

/**
 * Quotation item for calculation
 */
export interface QuotationItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

/**
 * Fee breakdown in quotation
 */
export interface FeeBreakdown {
  name: string;
  type: string;
  value: number;
  amount: number;
}

/**
 * Quotation calculation result
 */
export interface QuotationCalculation {
  basePrice: number;
  feesBreakdown: FeeBreakdown[];
  totalPrice: number;
}

// ============================================
// INPUT TYPES
// ============================================

export interface CreateDeveloperInput {
  name: string;
  imageUrl?: string;
}

export interface UpdateDeveloperInput {
  name?: string;
  imageUrl?: string;
}

export interface CreateProjectInput {
  name: string;
  code: string;
  developerId: string;
  imageUrl?: string;
}

export interface UpdateProjectInput {
  name?: string;
  code?: string;
  imageUrl?: string;
}

export interface CreateBuildingInput {
  name: string;
  code: string;
  projectId: string;
  maxFloor: number;
  maxAxis: number;
  imageUrl?: string;
}

export interface UpdateBuildingInput {
  name?: string;
  code?: string;
  imageUrl?: string;
  maxFloor?: number;
  maxAxis?: number;
}

export interface CreateLayoutInput {
  buildingCode: string;
  axis: number;
  apartmentType: string;
}

export interface UpdateLayoutInput {
  apartmentType?: string;
}

export interface CreateApartmentTypeInput {
  buildingCode: string;
  apartmentType: string;
  imageUrl?: string;
  description?: string;
}

export interface UpdateApartmentTypeInput {
  apartmentType?: string;
  imageUrl?: string;
  description?: string;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
}

export interface CreateProductInput {
  name: string;
  categoryId: string;
  price: number;
  imageUrl?: string;
  description?: string;
  dimensions?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  categoryId?: string;
  price?: number;
  imageUrl?: string;
  description?: string;
  dimensions?: string;
  order?: number;
  isActive?: boolean;
}

export interface CreateComboItemInput {
  productId: string;
  quantity: number;
}

export interface CreateComboInput {
  name: string;
  apartmentTypes: string[];
  price: number;
  imageUrl?: string;
  description?: string;
  isActive?: boolean;
  items: CreateComboItemInput[];
}

export interface UpdateComboInput {
  name?: string;
  apartmentTypes?: string[];
  price?: number;
  imageUrl?: string;
  description?: string;
  isActive?: boolean;
  items?: CreateComboItemInput[];
}

export interface CreateFeeInput {
  name: string;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  applicability: 'COMBO' | 'CUSTOM' | 'BOTH';
  description?: string;
  isActive?: boolean;
  order?: number;
}

export interface UpdateFeeInput {
  name?: string;
  type?: 'FIXED' | 'PERCENTAGE';
  value?: number;
  applicability?: 'COMBO' | 'CUSTOM' | 'BOTH';
  description?: string;
  isActive?: boolean;
  order?: number;
}

export interface CreateQuotationInput {
  leadId: string;
  developerName: string;
  projectName: string;
  buildingName: string;
  buildingCode: string;
  floor: number;
  axis: number;
  apartmentType: string;
  layoutImageUrl?: string;
  selectionType: 'COMBO' | 'CUSTOM';
  comboId?: string;
  comboName?: string;
  items: QuotationItem[];
  fees: FurnitureFee[];
}


// ============================================
// FURNITURE SERVICE CLASS
// ============================================

/**
 * Furniture Service
 * _Requirements: 1.1_
 */
export class FurnitureService {
  constructor(private prisma: PrismaClient) {}

  // ============================================
  // DEVELOPERS
  // _Requirements: 1.10, 1.11, 1.14_
  // ============================================

  /**
   * Get all developers
   */
  async getDevelopers(): Promise<FurnitureDeveloper[]> {
    return this.prisma.furnitureDeveloper.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Create a new developer
   * @throws FurnitureServiceError if name already exists
   */
  async createDeveloper(input: CreateDeveloperInput): Promise<FurnitureDeveloper> {
    try {
      return await this.prisma.furnitureDeveloper.create({
        data: input,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new FurnitureServiceError(
            'CONFLICT',
            'Developer with this name already exists',
            409
          );
        }
      }
      throw error;
    }
  }

  /**
   * Update a developer
   * @throws FurnitureServiceError if not found
   */
  async updateDeveloper(
    id: string,
    input: UpdateDeveloperInput
  ): Promise<FurnitureDeveloper> {
    try {
      return await this.prisma.furnitureDeveloper.update({
        where: { id },
        data: input,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new FurnitureServiceError('NOT_FOUND', 'Developer not found', 404);
        }
      }
      throw error;
    }
  }

  /**
   * Delete a developer (cascade deletes projects)
   * @throws FurnitureServiceError if not found
   */
  async deleteDeveloper(id: string): Promise<void> {
    try {
      await this.prisma.furnitureDeveloper.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new FurnitureServiceError('NOT_FOUND', 'Developer not found', 404);
        }
      }
      throw error;
    }
  }

  // ============================================
  // PROJECTS
  // _Requirements: 1.10, 1.11, 1.14_
  // ============================================

  /**
   * Get all projects, optionally filtered by developer
   */
  async getProjects(developerId?: string): Promise<FurnitureProject[]> {
    return this.prisma.furnitureProject.findMany({
      where: developerId ? { developerId } : undefined,
      orderBy: { name: 'asc' },
      include: { developer: true },
    });
  }

  /**
   * Create a new project
   * @throws FurnitureServiceError if code already exists for developer
   */
  async createProject(input: CreateProjectInput): Promise<FurnitureProject> {
    try {
      return await this.prisma.furnitureProject.create({
        data: input,
        include: { developer: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new FurnitureServiceError(
            'CONFLICT',
            'Project with this code already exists for this developer',
            409
          );
        }
        if (error.code === 'P2003') {
          throw new FurnitureServiceError('NOT_FOUND', 'Developer not found', 404);
        }
      }
      throw error;
    }
  }

  /**
   * Update a project
   * @throws FurnitureServiceError if not found
   */
  async updateProject(id: string, input: UpdateProjectInput): Promise<FurnitureProject> {
    try {
      return await this.prisma.furnitureProject.update({
        where: { id },
        data: input,
        include: { developer: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new FurnitureServiceError('NOT_FOUND', 'Project not found', 404);
        }
      }
      throw error;
    }
  }

  /**
   * Delete a project (cascade deletes buildings)
   * @throws FurnitureServiceError if not found
   */
  async deleteProject(id: string): Promise<void> {
    try {
      await this.prisma.furnitureProject.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new FurnitureServiceError('NOT_FOUND', 'Project not found', 404);
        }
      }
      throw error;
    }
  }


  // ============================================
  // BUILDINGS
  // _Requirements: 1.10, 1.11, 1.13, 1.14_
  // ============================================

  /**
   * Get all buildings, optionally filtered by project
   */
  async getBuildings(projectId?: string): Promise<FurnitureBuilding[]> {
    return this.prisma.furnitureBuilding.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { name: 'asc' },
      include: { project: true },
    });
  }

  /**
   * Create a new building
   * @throws FurnitureServiceError if validation fails or project not found
   */
  async createBuilding(input: CreateBuildingInput): Promise<FurnitureBuilding> {
    // Validate maxFloor > 0 and maxAxis >= 0
    if (input.maxFloor <= 0) {
      throw new FurnitureServiceError(
        'VALIDATION_ERROR',
        'maxFloor must be greater than 0',
        400
      );
    }
    if (input.maxAxis < 0) {
      throw new FurnitureServiceError(
        'VALIDATION_ERROR',
        'maxAxis must be greater than or equal to 0',
        400
      );
    }

    try {
      return await this.prisma.furnitureBuilding.create({
        data: input,
        include: { project: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new FurnitureServiceError('NOT_FOUND', 'Project not found', 404);
        }
      }
      throw error;
    }
  }

  /**
   * Update a building
   * @throws FurnitureServiceError if not found or validation fails
   */
  async updateBuilding(
    id: string,
    input: UpdateBuildingInput
  ): Promise<FurnitureBuilding> {
    // Validate maxFloor > 0 if provided
    if (input.maxFloor !== undefined && input.maxFloor <= 0) {
      throw new FurnitureServiceError(
        'VALIDATION_ERROR',
        'maxFloor must be greater than 0',
        400
      );
    }
    // Validate maxAxis >= 0 if provided
    if (input.maxAxis !== undefined && input.maxAxis < 0) {
      throw new FurnitureServiceError(
        'VALIDATION_ERROR',
        'maxAxis must be greater than or equal to 0',
        400
      );
    }

    try {
      return await this.prisma.furnitureBuilding.update({
        where: { id },
        data: input,
        include: { project: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new FurnitureServiceError('NOT_FOUND', 'Building not found', 404);
        }
      }
      throw error;
    }
  }

  /**
   * Delete a building
   * @throws FurnitureServiceError if not found
   */
  async deleteBuilding(id: string): Promise<void> {
    try {
      await this.prisma.furnitureBuilding.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new FurnitureServiceError('NOT_FOUND', 'Building not found', 404);
        }
      }
      throw error;
    }
  }

  // ============================================
  // LAYOUTS
  // _Requirements: 1.3, 1.10, 1.11, 1.14_
  // ============================================

  /**
   * Get all layouts for a building code
   */
  async getLayouts(buildingCode: string): Promise<FurnitureLayout[]> {
    return this.prisma.furnitureLayout.findMany({
      where: { buildingCode },
      orderBy: { axis: 'asc' },
    });
  }

  /**
   * Get a single layout by building code and axis
   */
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

  /**
   * Create a new layout
   * Generate layoutAxis = `${buildingCode}_${axis.toString().padStart(2, '0')}`
   * @throws FurnitureServiceError if layout already exists
   */
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

  /**
   * Update a layout
   * @throws FurnitureServiceError if not found
   */
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

  /**
   * Delete a layout
   * @throws FurnitureServiceError if not found
   */
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
  // _Requirements: 1.4, 1.5, 1.10, 1.11, 1.14_
  // ============================================

  /**
   * Get apartment types, optionally filtered by building code and type
   * If type is provided but no exact match found, returns all apartment types for the building
   */
  async getApartmentTypes(
    buildingCode: string,
    type?: string
  ): Promise<FurnitureApartmentType[]> {
    // First, try to find with exact type match if provided
    if (type) {
      const normalizedType = type.trim().toLowerCase();
      const exactMatch = await this.prisma.furnitureApartmentType.findMany({
        where: { 
          buildingCode,
          apartmentType: normalizedType,
        },
        orderBy: { apartmentType: 'asc' },
      });
      
      // If found exact match, return it
      if (exactMatch.length > 0) {
        return exactMatch;
      }
    }
    
    // Otherwise, return all apartment types for this building
    return this.prisma.furnitureApartmentType.findMany({
      where: { buildingCode },
      orderBy: { apartmentType: 'asc' },
    });
  }

  /**
   * Create a new apartment type
   */
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

  /**
   * Update an apartment type
   * @throws FurnitureServiceError if not found
   */
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

  /**
   * Delete an apartment type
   * @throws FurnitureServiceError if not found
   */
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
  // CATEGORIES
  // _Requirements: 2.1, 2.6, 2.7_
  // ============================================

  /**
   * Get all categories with product count
   */
  async getCategories(): Promise<FurnitureCategoryWithCount[]> {
    return this.prisma.furnitureCategory.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  /**
   * Create a new category
   * @throws FurnitureServiceError if name already exists
   */
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

  /**
   * Update a category
   * @throws FurnitureServiceError if not found
   */
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

  /**
   * Delete a category (only if no products exist)
   * @throws FurnitureServiceError if not found or has products
   */
  async deleteCategory(id: string): Promise<void> {
    // Check if category has products
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


  // ============================================
  // PRODUCTS
  // _Requirements: 2.2, 2.3, 2.4, 2.5_
  // ============================================

  /**
   * Get all active products, optionally filtered by category
   */
  async getProducts(categoryId?: string): Promise<FurnitureProductWithCategory[]> {
    return this.prisma.furnitureProduct.findMany({
      where: {
        isActive: true,
        ...(categoryId ? { categoryId } : {}),
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: { category: true },
    });
  }

  /**
   * Create a new product
   * @throws FurnitureServiceError if category not found
   */
  async createProduct(input: CreateProductInput): Promise<FurnitureProductWithCategory> {
    try {
      return await this.prisma.furnitureProduct.create({
        data: input,
        include: { category: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new FurnitureServiceError('NOT_FOUND', 'Category not found', 404);
        }
      }
      throw error;
    }
  }

  /**
   * Update a product
   * @throws FurnitureServiceError if not found
   */
  async updateProduct(
    id: string,
    input: UpdateProductInput
  ): Promise<FurnitureProductWithCategory> {
    try {
      return await this.prisma.furnitureProduct.update({
        where: { id },
        data: input,
        include: { category: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new FurnitureServiceError('NOT_FOUND', 'Product not found', 404);
        }
      }
      throw error;
    }
  }

  /**
   * Delete a product
   * @throws FurnitureServiceError if not found
   */
  async deleteProduct(id: string): Promise<void> {
    try {
      await this.prisma.furnitureProduct.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new FurnitureServiceError('NOT_FOUND', 'Product not found', 404);
        }
      }
      throw error;
    }
  }

  // ============================================
  // COMBOS
  // _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  // ============================================

  /**
   * Get all active combos, optionally filtered by apartment type
   */
  async getCombos(apartmentType?: string): Promise<FurnitureComboWithItems[]> {
    const combos = await this.prisma.furnitureCombo.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    // Filter by apartment type if provided
    if (apartmentType) {
      const normalizedType = apartmentType.trim().toLowerCase();
      return combos.filter((combo) => {
        const types: string[] = JSON.parse(combo.apartmentTypes);
        return types.some((t) => t.toLowerCase() === normalizedType);
      });
    }

    return combos;
  }

  /**
   * Create a new combo with items
   */
  async createCombo(input: CreateComboInput): Promise<FurnitureComboWithItems> {
    const { items, apartmentTypes, ...comboData } = input;

    return this.prisma.furnitureCombo.create({
      data: {
        ...comboData,
        apartmentTypes: JSON.stringify(apartmentTypes),
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    });
  }

  /**
   * Update a combo
   * @throws FurnitureServiceError if not found
   */
  async updateCombo(
    id: string,
    input: UpdateComboInput
  ): Promise<FurnitureComboWithItems> {
    const { items, apartmentTypes, ...comboData } = input;

    try {
      // Update combo data
      const updateData: Prisma.FurnitureComboUpdateInput = { ...comboData };
      if (apartmentTypes !== undefined) {
        updateData.apartmentTypes = JSON.stringify(apartmentTypes);
      }

      // If items are provided, replace all items
      if (items !== undefined) {
        // Delete existing items
        await this.prisma.furnitureComboItem.deleteMany({
          where: { comboId: id },
        });

        // Create new items
        await this.prisma.furnitureComboItem.createMany({
          data: items.map((item) => ({
            comboId: id,
            productId: item.productId,
            quantity: item.quantity,
          })),
        });
      }

      return await this.prisma.furnitureCombo.update({
        where: { id },
        data: updateData,
        include: {
          items: {
            include: { product: true },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new FurnitureServiceError('NOT_FOUND', 'Combo not found', 404);
        }
      }
      throw error;
    }
  }

  /**
   * Delete a combo
   * @throws FurnitureServiceError if not found
   */
  async deleteCombo(id: string): Promise<void> {
    try {
      await this.prisma.furnitureCombo.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new FurnitureServiceError('NOT_FOUND', 'Combo not found', 404);
        }
      }
      throw error;
    }
  }

  /**
   * Duplicate a combo
   * Create copy with name = `${originalName} (Copy)`
   * @throws FurnitureServiceError if not found
   */
  async duplicateCombo(id: string): Promise<FurnitureComboWithItems> {
    const original = await this.prisma.furnitureCombo.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!original) {
      throw new FurnitureServiceError('NOT_FOUND', 'Combo not found', 404);
    }

    return this.prisma.furnitureCombo.create({
      data: {
        name: `${original.name} (Copy)`,
        apartmentTypes: original.apartmentTypes,
        price: original.price,
        imageUrl: original.imageUrl,
        description: original.description,
        isActive: original.isActive,
        items: {
          create: original.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    });
  }


  // ============================================
  // FEES
  // _Requirements: 4.1, 4.2, 4.3, 4.4_
  // ============================================

  /**
   * Get all active fees, optionally filtered by applicability
   */
  async getFees(applicability?: 'COMBO' | 'CUSTOM' | 'BOTH'): Promise<FurnitureFee[]> {
    const where: Prisma.FurnitureFeeWhereInput = { isActive: true };
    if (applicability) {
      where.applicability = applicability;
    }

    return this.prisma.furnitureFee.findMany({
      where,
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Create a new fee
   */
  async createFee(input: CreateFeeInput): Promise<FurnitureFee> {
    return this.prisma.furnitureFee.create({
      data: input,
    });
  }

  /**
   * Update a fee
   * @throws FurnitureServiceError if not found
   */
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

  /**
   * Delete a fee
   * @throws FurnitureServiceError if not found
   */
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

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Calculate unit number from building code, floor, and axis
   * Format: {buildingCode}.{floor padded to 2 digits}{axis padded to 2 digits}
   * Example: calculateUnitNumber('LBV A', 15, 3) => 'LBV A.1503'
   * _Requirements: 6.5_
   */
  calculateUnitNumber(buildingCode: string, floor: number, axis: number): string {
    const floorStr = floor.toString().padStart(2, '0');
    const axisStr = axis.toString().padStart(2, '0');
    return `${buildingCode}.${floorStr}${axisStr}`;
  }

  /**
   * Calculate quotation pricing
   * - basePrice = sum of item prices * quantities
   * - Filter fees by applicability matching selectionType
   * - Apply FIXED fees directly, PERCENTAGE fees as basePrice * value / 100
   * _Requirements: 4.5, 7.6_
   */
  calculateQuotation(
    items: QuotationItem[],
    fees: FurnitureFee[],
    selectionType: 'COMBO' | 'CUSTOM'
  ): QuotationCalculation {
    // Calculate base price
    const basePrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Filter applicable fees
    const applicableFees = fees.filter(
      (fee) => fee.applicability === 'BOTH' || fee.applicability === selectionType
    );

    // Calculate fee amounts
    const feesBreakdown: FeeBreakdown[] = applicableFees.map((fee) => {
      const amount =
        fee.type === 'FIXED' ? fee.value : (basePrice * fee.value) / 100;
      return {
        name: fee.name,
        type: fee.type,
        value: fee.value,
        amount,
      };
    });

    // Calculate total
    const totalFees = feesBreakdown.reduce((sum, fee) => sum + fee.amount, 0);
    const totalPrice = basePrice + totalFees;

    return {
      basePrice,
      feesBreakdown,
      totalPrice,
    };
  }


  // ============================================
  // QUOTATIONS
  // _Requirements: 7.8, 8.1, 8.3, 11.1, 11.2, 11.3_
  // ============================================

  /**
   * Create a quotation
   * @throws FurnitureServiceError if lead not found
   */
  async createQuotation(input: CreateQuotationInput): Promise<FurnitureQuotation> {
    // Validate lead exists
    const lead = await this.prisma.customerLead.findUnique({
      where: { id: input.leadId },
    });
    if (!lead) {
      throw new FurnitureServiceError('NOT_FOUND', 'Lead not found', 404);
    }

    // Calculate unit number
    const unitNumber = this.calculateUnitNumber(
      input.buildingCode,
      input.floor,
      input.axis
    );

    // Calculate pricing
    const calculation = this.calculateQuotation(
      input.items,
      input.fees,
      input.selectionType
    );

    return this.prisma.furnitureQuotation.create({
      data: {
        leadId: input.leadId,
        developerName: input.developerName,
        projectName: input.projectName,
        buildingName: input.buildingName,
        buildingCode: input.buildingCode,
        floor: input.floor,
        axis: input.axis,
        unitNumber,
        apartmentType: input.apartmentType,
        layoutImageUrl: input.layoutImageUrl,
        selectionType: input.selectionType,
        comboId: input.comboId,
        comboName: input.comboName,
        items: JSON.stringify(input.items),
        basePrice: calculation.basePrice,
        fees: JSON.stringify(calculation.feesBreakdown),
        totalPrice: calculation.totalPrice,
      },
    });
  }

  /**
   * Get all quotations for a lead, ordered by createdAt desc
   */
  async getQuotationsByLead(leadId: string): Promise<FurnitureQuotation[]> {
    return this.prisma.furnitureQuotation.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single quotation by ID
   * @throws FurnitureServiceError if quotation not found
   * _Requirements: 8.2_
   */
  async getQuotationById(id: string): Promise<FurnitureQuotation> {
    const quotation = await this.prisma.furnitureQuotation.findUnique({
      where: { id },
    });

    if (!quotation) {
      throw new FurnitureServiceError('NOT_FOUND', 'Quotation not found', 404);
    }

    return quotation;
  }

  // ============================================
  // METRICS GRID HELPER
  // _Requirements: 1.2_
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
    // Get all layouts for this building
    const layouts = await this.getLayouts(buildingCode);
    const layoutMap = new Map<number, string>();
    layouts.forEach((layout) => {
      layoutMap.set(layout.axis, layout.apartmentType);
    });

    // Generate grid: rows = floors (1 to maxFloor), columns = axes (0 to maxAxis)
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

  // ============================================
  // CSV IMPORT/EXPORT
  // _Requirements: 1.6, 1.7, 1.8_
  // ============================================

  /**
   * Parse CSV string to array of objects
   * Handles quoted values with commas
   * _Requirements: 1.6_
   */
  parseCSV<T extends object>(content: string): T[] {
    const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0) {
      return [];
    }

    // Parse header row
    const headers = this.parseCSVLine(lines[0]);
    const result: T[] = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const obj: Record<string, string> = {};
      
      for (let j = 0; j < headers.length; j++) {
        // Trim header names to handle spaces (e.g., "Ảnh " -> "Ảnh")
        const header = headers[j].trim();
        obj[header] = values[j]?.trim() ?? '';
      }
      
      result.push(obj as T);
    }

    return result;
  }

  /**
   * Parse a single CSV line, handling quoted values with commas
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else if (char === '"') {
          // End of quoted value
          inQuotes = false;
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          // Start of quoted value
          inQuotes = true;
        } else if (char === ',') {
          // End of field
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
    }

    // Add last field
    result.push(current);

    return result;
  }

  /**
   * Generate CSV string from array of objects
   * Quote values containing commas
   * _Requirements: 1.8_
   */
  generateCSV<T extends Record<string, unknown>>(data: T[], headers: string[]): string {
    const lines: string[] = [];

    // Add header row
    lines.push(headers.join(','));

    // Add data rows
    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header];
        const strValue = value === null || value === undefined ? '' : String(value);
        
        // Quote values containing commas, quotes, or newlines
        if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
          return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
      });
      lines.push(values.join(','));
    }

    return lines.join('\n');
  }

  /**
   * Import data from CSV files
   * _Requirements: 1.6, 1.7_
   */
  async importFromCSV(files: {
    duAn: string;
    layouts: string;
    apartmentTypes: string;
  }): Promise<{
    developers: number;
    projects: number;
    buildings: number;
    layouts: number;
    apartmentTypes: number;
  }> {
    // Parse CSV files
    interface DuAnRow {
      ChuDauTu: string;
      TenDuAn: string;
      MaDuAn: string;
      TenToaNha: string;
      MaToaNha: string;
      SoTangMax: string;
      SoTrucMax: string;
    }

    interface LayoutRow {
      LayoutAxis: string;
      MaToaNha: string;
      SoTruc: string;
      ApartmentType: string;
    }

    interface ApartmentTypeRow {
      MaToaNha: string;
      ApartmentType: string;
      'Ảnh': string;
      'Mô tả': string;
    }

    const duAnData = this.parseCSV<DuAnRow>(files.duAn);
    const layoutsData = this.parseCSV<LayoutRow>(files.layouts);
    const apartmentTypesData = this.parseCSV<ApartmentTypeRow>(files.apartmentTypes);

    // Track counts
    let developersCount = 0;
    let projectsCount = 0;
    let buildingsCount = 0;
    let layoutsCount = 0;
    let apartmentTypesCount = 0;

    // Use transaction for atomicity
    await this.prisma.$transaction(async (tx) => {
      // Extract unique developers
      const developerNames = [...new Set(duAnData.map((row) => row.ChuDauTu))];
      const developerMap = new Map<string, string>(); // name -> id

      for (const name of developerNames) {
        if (!name) continue;
        
        // Check if developer exists
        let developer = await tx.furnitureDeveloper.findUnique({
          where: { name },
        });

        if (!developer) {
          developer = await tx.furnitureDeveloper.create({
            data: { name },
          });
          developersCount++;
        }

        developerMap.set(name, developer.id);
      }

      // Extract unique projects
      const projectKeys = new Set<string>();
      const projectMap = new Map<string, string>(); // "developerId:code" -> id

      for (const row of duAnData) {
        if (!row.ChuDauTu || !row.MaDuAn) continue;
        
        const developerId = developerMap.get(row.ChuDauTu);
        if (!developerId) continue;

        const key = `${developerId}:${row.MaDuAn}`;
        if (projectKeys.has(key)) continue;
        projectKeys.add(key);

        // Check if project exists
        let project = await tx.furnitureProject.findFirst({
          where: { developerId, code: row.MaDuAn },
        });

        if (!project) {
          project = await tx.furnitureProject.create({
            data: {
              name: row.TenDuAn,
              code: row.MaDuAn,
              developerId,
            },
          });
          projectsCount++;
        }

        projectMap.set(key, project.id);
      }

      // Create buildings
      const buildingMap = new Map<string, { id: string; maxAxis: number }>(); // "projectId:name" -> { id, maxAxis }

      for (const row of duAnData) {
        if (!row.ChuDauTu || !row.MaDuAn || !row.TenToaNha) continue;

        const developerId = developerMap.get(row.ChuDauTu);
        if (!developerId) continue;

        const projectKey = `${developerId}:${row.MaDuAn}`;
        const projectId = projectMap.get(projectKey);
        if (!projectId) continue;

        const buildingKey = `${projectId}:${row.TenToaNha}`;
        
        // Skip if already processed
        if (buildingMap.has(buildingKey)) continue;

        const maxFloor = parseInt(row.SoTangMax, 10) || 1;
        const maxAxis = parseInt(row.SoTrucMax, 10) || 0;

        // Check if building exists
        let building = await tx.furnitureBuilding.findFirst({
          where: { projectId, name: row.TenToaNha },
        });

        if (!building) {
          building = await tx.furnitureBuilding.create({
            data: {
              name: row.TenToaNha,
              code: row.MaToaNha,
              projectId,
              maxFloor,
              maxAxis,
            },
          });
          buildingsCount++;
        } else {
          // Update if needed
          await tx.furnitureBuilding.update({
            where: { id: building.id },
            data: {
              code: row.MaToaNha,
              maxFloor,
              maxAxis,
            },
          });
        }

        buildingMap.set(buildingKey, { id: building.id, maxAxis });
      }

      // Build a map of buildingCode -> maxAxis for validation
      const buildingCodeMaxAxis = new Map<string, number>();
      for (const row of duAnData) {
        const maxAxis = parseInt(row.SoTrucMax, 10) || 0;
        const existing = buildingCodeMaxAxis.get(row.MaToaNha);
        if (existing === undefined || maxAxis > existing) {
          buildingCodeMaxAxis.set(row.MaToaNha, maxAxis);
        }
      }

      // Create layouts
      for (const row of layoutsData) {
        if (!row.MaToaNha || row.SoTruc === undefined) continue;

        const axis = parseInt(row.SoTruc, 10);
        if (isNaN(axis) || axis < 0) continue;

        // Validate SoTruc within SoTrucMax range
        const maxAxis = buildingCodeMaxAxis.get(row.MaToaNha);
        if (maxAxis !== undefined && axis > maxAxis) {
          throw new FurnitureServiceError(
            'IMPORT_ERROR',
            `Layout axis ${axis} exceeds maxAxis ${maxAxis} for building ${row.MaToaNha}`,
            400
          );
        }

        // Normalize apartmentType (trim, lowercase)
        const apartmentType = row.ApartmentType.trim().toLowerCase();
        const layoutAxis = `${row.MaToaNha}_${axis.toString().padStart(2, '0')}`;

        // Check if layout exists
        const existingLayout = await tx.furnitureLayout.findUnique({
          where: { layoutAxis },
        });

        if (!existingLayout) {
          await tx.furnitureLayout.create({
            data: {
              layoutAxis,
              buildingCode: row.MaToaNha,
              axis,
              apartmentType,
            },
          });
          layoutsCount++;
        } else {
          // Update if needed
          await tx.furnitureLayout.update({
            where: { id: existingLayout.id },
            data: { apartmentType },
          });
        }
      }

      // Create apartment types
      for (const row of apartmentTypesData) {
        if (!row.MaToaNha || !row.ApartmentType) continue;

        // Normalize apartmentType (trim, lowercase)
        const apartmentType = row.ApartmentType.trim().toLowerCase();
        const imageUrl = row['Ảnh']?.trim() || null;
        const description = row['Mô tả']?.trim() || null;

        // Check if apartment type exists
        const existingType = await tx.furnitureApartmentType.findFirst({
          where: {
            buildingCode: row.MaToaNha,
            apartmentType,
          },
        });

        if (!existingType) {
          await tx.furnitureApartmentType.create({
            data: {
              buildingCode: row.MaToaNha,
              apartmentType,
              imageUrl,
              description,
            },
          });
          apartmentTypesCount++;
        } else {
          // Update if needed
          await tx.furnitureApartmentType.update({
            where: { id: existingType.id },
            data: { imageUrl, description },
          });
        }
      }
    });

    return {
      developers: developersCount,
      projects: projectsCount,
      buildings: buildingsCount,
      layouts: layoutsCount,
      apartmentTypes: apartmentTypesCount,
    };
  }

  /**
   * Export data to CSV format
   * _Requirements: 1.8_
   */
  async exportToCSV(): Promise<{
    duAn: string;
    layouts: string;
    apartmentTypes: string;
  }> {
    // Get all data with relations
    const developers = await this.prisma.furnitureDeveloper.findMany({
      include: {
        projects: {
          include: {
            buildings: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const layouts = await this.prisma.furnitureLayout.findMany({
      orderBy: [{ buildingCode: 'asc' }, { axis: 'asc' }],
    });

    const apartmentTypes = await this.prisma.furnitureApartmentType.findMany({
      orderBy: [{ buildingCode: 'asc' }, { apartmentType: 'asc' }],
    });

    // Generate DuAn.csv
    const duAnRows: Array<{
      ChuDauTu: string;
      TenDuAn: string;
      MaDuAn: string;
      TenToaNha: string;
      MaToaNha: string;
      SoTangMax: number;
      SoTrucMax: number;
    }> = [];

    for (const developer of developers) {
      for (const project of developer.projects) {
        for (const building of project.buildings) {
          duAnRows.push({
            ChuDauTu: developer.name,
            TenDuAn: project.name,
            MaDuAn: project.code,
            TenToaNha: building.name,
            MaToaNha: building.code,
            SoTangMax: building.maxFloor,
            SoTrucMax: building.maxAxis,
          });
        }
      }
    }

    const duAnCSV = this.generateCSV(duAnRows, [
      'ChuDauTu',
      'TenDuAn',
      'MaDuAn',
      'TenToaNha',
      'MaToaNha',
      'SoTangMax',
      'SoTrucMax',
    ]);

    // Generate LayoutIDs.csv
    const layoutRows = layouts.map((layout) => ({
      LayoutAxis: layout.layoutAxis,
      MaToaNha: layout.buildingCode,
      SoTruc: layout.axis,
      ApartmentType: layout.apartmentType,
    }));

    const layoutsCSV = this.generateCSV(layoutRows, [
      'LayoutAxis',
      'MaToaNha',
      'SoTruc',
      'ApartmentType',
    ]);

    // Generate ApartmentType.csv
    const apartmentTypeRows = apartmentTypes.map((at) => ({
      MaToaNha: at.buildingCode,
      ApartmentType: at.apartmentType,
      'Ảnh': at.imageUrl || '',
      'Mô tả': at.description || '',
    }));

    const apartmentTypesCSV = this.generateCSV(apartmentTypeRows, [
      'MaToaNha',
      'ApartmentType',
      'Ảnh',
      'Mô tả',
    ]);

    return {
      duAn: duAnCSV,
      layouts: layoutsCSV,
      apartmentTypes: apartmentTypesCSV,
    };
  }
}
