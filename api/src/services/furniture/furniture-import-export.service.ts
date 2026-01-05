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
}
