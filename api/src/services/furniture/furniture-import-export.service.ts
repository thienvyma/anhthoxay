/**
 * Furniture Import/Export Service
 *
 * Handles CSV import and export for furniture data
 *
 * **Feature: furniture-quotation**
 * **Requirements: 1.6, 1.7, 1.8**
 */

import { PrismaClient } from '@prisma/client';
import { FurnitureServiceError } from './furniture.error';
import {
  DuAnRow,
  LayoutRow,
  ApartmentTypeRow,
  ImportResult,
  ExportResult,
} from './furniture.types';

export class FurnitureImportExportService {
  constructor(private prisma: PrismaClient) {}

  // ============================================
  // CSV PARSING
  // ============================================

  /**
   * Parse CSV string to array of objects
   */
  parseCSV<T extends object>(content: string): T[] {
    const lines = content
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0);
    if (lines.length === 0) {
      return [];
    }

    const headers = this.parseCSVLine(lines[0]);
    const result: T[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const obj: Record<string, string> = {};

      for (let j = 0; j < headers.length; j++) {
        const header = headers[j].trim();
        obj[header] = values[j]?.trim() ?? '';
      }

      result.push(obj as T);
    }

    return result;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
    }

    result.push(current);
    return result;
  }

  /**
   * Generate CSV string from array of objects
   */
  generateCSV<T extends Record<string, unknown>>(
    data: T[],
    headers: string[]
  ): string {
    const lines: string[] = [];

    lines.push(headers.join(','));

    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header];
        const strValue =
          value === null || value === undefined ? '' : String(value);

        if (
          strValue.includes(',') ||
          strValue.includes('"') ||
          strValue.includes('\n')
        ) {
          return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
      });
      lines.push(values.join(','));
    }

    return lines.join('\n');
  }

  // ============================================
  // IMPORT
  // ============================================

  async importFromCSV(files: {
    duAn: string;
    layouts: string;
    apartmentTypes: string;
  }): Promise<ImportResult> {
    const duAnData = this.parseCSV<DuAnRow>(files.duAn);
    const layoutsData = this.parseCSV<LayoutRow>(files.layouts);
    const apartmentTypesData = this.parseCSV<ApartmentTypeRow>(files.apartmentTypes);

    let developersCount = 0;
    let projectsCount = 0;
    let buildingsCount = 0;
    let layoutsCount = 0;
    let apartmentTypesCount = 0;

    await this.prisma.$transaction(async (tx) => {
      // Extract unique developers
      const developerNames = [...new Set(duAnData.map((row) => row.ChuDauTu))];
      const developerMap = new Map<string, string>();

      for (const name of developerNames) {
        if (!name) continue;

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
      const projectMap = new Map<string, string>();

      for (const row of duAnData) {
        if (!row.ChuDauTu || !row.MaDuAn) continue;

        const developerId = developerMap.get(row.ChuDauTu);
        if (!developerId) continue;

        const key = `${developerId}:${row.MaDuAn}`;
        if (projectKeys.has(key)) continue;
        projectKeys.add(key);

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
      const buildingMap = new Map<string, { id: string; maxAxis: number }>();

      for (const row of duAnData) {
        if (!row.ChuDauTu || !row.MaDuAn || !row.TenToaNha) continue;

        const developerId = developerMap.get(row.ChuDauTu);
        if (!developerId) continue;

        const projectKey = `${developerId}:${row.MaDuAn}`;
        const projectId = projectMap.get(projectKey);
        if (!projectId) continue;

        const buildingKey = `${projectId}:${row.TenToaNha}`;

        if (buildingMap.has(buildingKey)) continue;

        const maxFloor = parseInt(row.SoTangMax, 10) || 1;
        const maxAxis = parseInt(row.SoTrucMax, 10) || 0;

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

        const maxAxis = buildingCodeMaxAxis.get(row.MaToaNha);
        if (maxAxis !== undefined && axis > maxAxis) {
          throw new FurnitureServiceError(
            'IMPORT_ERROR',
            `Layout axis ${axis} exceeds maxAxis ${maxAxis} for building ${row.MaToaNha}`,
            400
          );
        }

        const apartmentType = row.ApartmentType.trim().toLowerCase();
        const layoutAxis = `${row.MaToaNha}_${axis.toString().padStart(2, '0')}`;

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
          await tx.furnitureLayout.update({
            where: { id: existingLayout.id },
            data: { apartmentType },
          });
        }
      }

      // Create apartment types
      for (const row of apartmentTypesData) {
        if (!row.MaToaNha || !row.ApartmentType) continue;

        const apartmentType = row.ApartmentType.trim().toLowerCase();
        const imageUrl = row['Ảnh']?.trim() || null;
        const description = row['Mô tả']?.trim() || null;

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

  // ============================================
  // EXPORT
  // ============================================

  async exportToCSV(): Promise<ExportResult> {
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
      Ảnh: at.imageUrl || '',
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

  // ============================================
  // CATALOG EXPORT (Categories, Materials, Products, Variants, Fees)
  // ============================================

  /**
   * Export furniture catalog to CSV
   * Returns 5 CSV files: Categories, Materials, ProductBases, Variants, Fees
   */
  async exportCatalogToCSV(): Promise<{
    categories: string;
    materials: string;
    productBases: string;
    variants: string;
    fees: string;
  }> {
    // Categories
    const categories = await this.prisma.furnitureCategory.findMany({
      orderBy: { order: 'asc' },
    });
    const categoriesCSV = this.generateCSV(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description || '',
        icon: c.icon || '',
        order: c.order,
        isActive: c.isActive ? 'true' : 'false',
      })),
      ['id', 'name', 'description', 'icon', 'order', 'isActive']
    );

    // Materials
    const materials = await this.prisma.furnitureMaterial.findMany({
      orderBy: { order: 'asc' },
    });
    const materialsCSV = this.generateCSV(
      materials.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description || '',
        order: m.order,
        isActive: m.isActive ? 'true' : 'false',
      })),
      ['id', 'name', 'description', 'order', 'isActive']
    );

    // Product Bases
    const productBases = await this.prisma.furnitureProductBase.findMany({
      include: { category: true },
      orderBy: { order: 'asc' },
    });
    const productBasesCSV = this.generateCSV(
      productBases.map((p) => ({
        id: p.id,
        name: p.name,
        categoryId: p.categoryId,
        categoryName: p.category.name,
        description: p.description || '',
        imageUrl: p.imageUrl || '',
        allowFitIn: p.allowFitIn ? 'true' : 'false',
        order: p.order,
        isActive: p.isActive ? 'true' : 'false',
      })),
      ['id', 'name', 'categoryId', 'categoryName', 'description', 'imageUrl', 'allowFitIn', 'order', 'isActive']
    );

    // Variants
    const variants = await this.prisma.furnitureProductVariant.findMany({
      include: { productBase: true, material: true },
      orderBy: [{ productBaseId: 'asc' }, { order: 'asc' }],
    });
    const variantsCSV = this.generateCSV(
      variants.map((v) => ({
        id: v.id,
        productBaseId: v.productBaseId,
        productBaseName: v.productBase.name,
        materialId: v.materialId,
        materialName: v.material.name,
        pricePerUnit: v.pricePerUnit,
        pricingType: v.pricingType,
        length: v.length,
        width: v.width || '',
        calculatedPrice: v.calculatedPrice,
        imageUrl: v.imageUrl || '',
        order: v.order,
        isActive: v.isActive ? 'true' : 'false',
      })),
      ['id', 'productBaseId', 'productBaseName', 'materialId', 'materialName', 'pricePerUnit', 'pricingType', 'length', 'width', 'calculatedPrice', 'imageUrl', 'order', 'isActive']
    );

    // Fees
    const fees = await this.prisma.furnitureFee.findMany({
      orderBy: { order: 'asc' },
    });
    const feesCSV = this.generateCSV(
      fees.map((f) => ({
        id: f.id,
        name: f.name,
        code: f.code,
        type: f.type,
        value: f.value,
        applicability: f.applicability,
        description: f.description || '',
        order: f.order,
        isActive: f.isActive ? 'true' : 'false',
      })),
      ['id', 'name', 'code', 'type', 'value', 'applicability', 'description', 'order', 'isActive']
    );

    return {
      categories: categoriesCSV,
      materials: materialsCSV,
      productBases: productBasesCSV,
      variants: variantsCSV,
      fees: feesCSV,
    };
  }

  // ============================================
  // CATALOG IMPORT (Categories, Materials, Products, Variants, Fees)
  // ============================================

  /**
   * Import furniture catalog from CSV
   * Supports upsert (update if exists, create if not)
   */
  async importCatalogFromCSV(files: {
    categories?: string;
    materials?: string;
    productBases?: string;
    variants?: string;
    fees?: string;
  }): Promise<{
    categories: { created: number; updated: number };
    materials: { created: number; updated: number };
    productBases: { created: number; updated: number };
    variants: { created: number; updated: number };
    fees: { created: number; updated: number };
  }> {
    const result = {
      categories: { created: 0, updated: 0 },
      materials: { created: 0, updated: 0 },
      productBases: { created: 0, updated: 0 },
      variants: { created: 0, updated: 0 },
      fees: { created: 0, updated: 0 },
    };

    await this.prisma.$transaction(async (tx) => {
      // Import Categories
      if (files.categories) {
        const rows = this.parseCSV<{
          id: string;
          name: string;
          description: string;
          icon: string;
          order: string;
          isActive: string;
        }>(files.categories);

        for (const row of rows) {
          if (!row.name) continue;
          const existing = await tx.furnitureCategory.findUnique({ where: { name: row.name } });
          const data = {
            name: row.name,
            description: row.description || null,
            icon: row.icon || null,
            order: parseInt(row.order, 10) || 0,
            isActive: row.isActive !== 'false',
          };
          if (existing) {
            await tx.furnitureCategory.update({ where: { id: existing.id }, data });
            result.categories.updated++;
          } else {
            await tx.furnitureCategory.create({ data });
            result.categories.created++;
          }
        }
      }

      // Import Materials
      if (files.materials) {
        const rows = this.parseCSV<{
          id: string;
          name: string;
          description: string;
          order: string;
          isActive: string;
        }>(files.materials);

        for (const row of rows) {
          if (!row.name) continue;
          const existing = await tx.furnitureMaterial.findUnique({ where: { name: row.name } });
          const data = {
            name: row.name,
            description: row.description || null,
            order: parseInt(row.order, 10) || 0,
            isActive: row.isActive !== 'false',
          };
          if (existing) {
            await tx.furnitureMaterial.update({ where: { id: existing.id }, data });
            result.materials.updated++;
          } else {
            await tx.furnitureMaterial.create({ data });
            result.materials.created++;
          }
        }
      }

      // Import Product Bases (requires categoryId)
      if (files.productBases) {
        const rows = this.parseCSV<{
          id: string;
          name: string;
          categoryId: string;
          categoryName: string;
          description: string;
          imageUrl: string;
          allowFitIn: string;
          order: string;
          isActive: string;
        }>(files.productBases);

        for (const row of rows) {
          if (!row.name) continue;
          
          // Find category by name or id
          let categoryId = row.categoryId;
          if (!categoryId && row.categoryName) {
            const category = await tx.furnitureCategory.findUnique({ where: { name: row.categoryName } });
            if (category) categoryId = category.id;
          }
          if (!categoryId) continue;

          const existing = row.id ? await tx.furnitureProductBase.findUnique({ where: { id: row.id } }) : null;
          const data = {
            name: row.name,
            categoryId,
            description: row.description || null,
            imageUrl: row.imageUrl || null,
            allowFitIn: row.allowFitIn === 'true',
            order: parseInt(row.order, 10) || 0,
            isActive: row.isActive !== 'false',
          };
          if (existing) {
            await tx.furnitureProductBase.update({ where: { id: existing.id }, data });
            result.productBases.updated++;
          } else {
            await tx.furnitureProductBase.create({ data });
            result.productBases.created++;
          }
        }
      }

      // Import Variants (requires productBaseId and materialId)
      if (files.variants) {
        const rows = this.parseCSV<{
          id: string;
          productBaseId: string;
          productBaseName: string;
          materialId: string;
          materialName: string;
          pricePerUnit: string;
          pricingType: string;
          length: string;
          width: string;
          calculatedPrice: string;
          imageUrl: string;
          order: string;
          isActive: string;
        }>(files.variants);

        for (const row of rows) {
          // Find productBase by id or name
          let productBaseId = row.productBaseId;
          if (!productBaseId && row.productBaseName) {
            const pb = await tx.furnitureProductBase.findFirst({ where: { name: row.productBaseName } });
            if (pb) productBaseId = pb.id;
          }
          if (!productBaseId) continue;

          // Find material by id or name
          let materialId = row.materialId;
          if (!materialId && row.materialName) {
            const mat = await tx.furnitureMaterial.findUnique({ where: { name: row.materialName } });
            if (mat) materialId = mat.id;
          }
          if (!materialId) continue;

          const pricePerUnit = parseFloat(row.pricePerUnit) || 0;
          const length = parseFloat(row.length) || 0;
          const width = row.width ? parseFloat(row.width) : null;
          const pricingType = row.pricingType === 'M2' ? 'M2' : 'LINEAR';
          const calculatedPrice = row.calculatedPrice 
            ? parseFloat(row.calculatedPrice) 
            : (pricingType === 'M2' && width ? pricePerUnit * length * width : pricePerUnit * length);

          const existing = row.id ? await tx.furnitureProductVariant.findUnique({ where: { id: row.id } }) : null;
          const data = {
            productBaseId,
            materialId,
            pricePerUnit,
            pricingType,
            length,
            width,
            calculatedPrice,
            imageUrl: row.imageUrl || null,
            order: parseInt(row.order, 10) || 0,
            isActive: row.isActive !== 'false',
          };
          if (existing) {
            await tx.furnitureProductVariant.update({ where: { id: existing.id }, data });
            result.variants.updated++;
          } else {
            await tx.furnitureProductVariant.create({ data });
            result.variants.created++;
          }
        }
      }

      // Import Fees
      if (files.fees) {
        const rows = this.parseCSV<{
          id: string;
          name: string;
          code: string;
          type: string;
          value: string;
          applicability: string;
          description: string;
          order: string;
          isActive: string;
        }>(files.fees);

        for (const row of rows) {
          if (!row.name || !row.code) continue;
          const existing = await tx.furnitureFee.findUnique({ where: { code: row.code } });
          const data = {
            name: row.name,
            code: row.code,
            type: row.type === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED',
            value: parseFloat(row.value) || 0,
            applicability: row.applicability === 'CUSTOM' ? 'CUSTOM' : 'BOTH',
            description: row.description || null,
            order: parseInt(row.order, 10) || 0,
            isActive: row.isActive !== 'false',
          };
          if (existing) {
            await tx.furnitureFee.update({ where: { id: existing.id }, data });
            result.fees.updated++;
          } else {
            await tx.furnitureFee.create({ data });
            result.fees.created++;
          }
        }
      }
    });

    return result;
  }
}