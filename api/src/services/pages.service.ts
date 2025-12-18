/**
 * Pages & Sections Service Module
 *
 * Handles business logic for pages and sections CRUD operations.
 * Separates data access and business logic from HTTP handling.
 *
 * **Feature: api-refactoring**
 * **Requirements: 2.1, 2.2, 2.3**
 */

import { PrismaClient, Prisma, Page, Section } from '@prisma/client';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface CreatePageInput {
  slug: string;
  title: string;
}

export interface UpdatePageInput {
  title?: string;
  headerConfig?: string;
  footerConfig?: string;
}

export interface CreateSectionInput {
  kind: string;
  data: Prisma.JsonValue;
  order?: number;
}

export interface UpdateSectionInput {
  data?: Prisma.JsonValue;
  order?: number;
  syncAll?: boolean;
}

export interface PageWithSections extends Page {
  sections: SectionWithParsedData[];
}

export interface SectionWithParsedData extends Omit<Section, 'data'> {
  data: Prisma.JsonValue;
}

export interface PageWithSectionCount extends Page {
  _count: { sections: number };
}

// ============================================
// ERROR CLASS
// ============================================

export class PagesServiceError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.code = code;
    this.name = 'PagesServiceError';
    this.statusCode = statusCode;
  }
}

// ============================================
// PAGES SERVICE CLASS
// ============================================

export class PagesService {
  constructor(private prisma: PrismaClient) {}

  // ============================================
  // PAGE OPERATIONS
  // ============================================

  /**
   * Get all pages with section count
   */
  async getAllPages(): Promise<PageWithSectionCount[]> {
    return this.prisma.page.findMany({
      orderBy: { slug: 'asc' },
      include: { _count: { select: { sections: true } } },
    });
  }

  /**
   * Get a single page by slug with all sections
   */
  async getPageBySlug(slug: string): Promise<PageWithSections | null> {
    const page = await this.prisma.page.findUnique({
      where: { slug },
      include: { sections: { orderBy: { order: 'asc' } } },
    });

    if (!page) {
      return null;
    }

    // Parse section data from JSON string
    return {
      ...page,
      sections: page.sections.map((s) => ({
        ...s,
        data: JSON.parse(s.data) as Prisma.JsonValue,
      })),
    };
  }

  /**
   * Create a new page
   * @throws PagesServiceError if slug already exists
   */
  async createPage(input: CreatePageInput): Promise<Page> {
    if (!input.slug || !input.title) {
      throw new PagesServiceError('VALIDATION_ERROR', 'Slug and title are required', 400);
    }

    try {
      return await this.prisma.page.create({
        data: { slug: input.slug, title: input.title },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new PagesServiceError('CONFLICT', 'Page with this slug already exists', 409);
        }
      }
      throw error;
    }
  }

  /**
   * Update a page by slug
   * @throws PagesServiceError if page not found
   */
  async updatePage(slug: string, input: UpdatePageInput): Promise<Page> {
    try {
      return await this.prisma.page.update({
        where: { slug },
        data: input,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new PagesServiceError('NOT_FOUND', 'Page not found', 404);
        }
      }
      throw error;
    }
  }

  /**
   * Delete a page and all its sections
   * @throws PagesServiceError if page not found
   */
  async deletePage(slug: string): Promise<void> {
    const page = await this.prisma.page.findUnique({ where: { slug } });
    if (!page) {
      throw new PagesServiceError('NOT_FOUND', 'Page not found', 404);
    }

    // Delete sections first, then page
    await this.prisma.section.deleteMany({ where: { pageId: page.id } });
    await this.prisma.page.delete({ where: { slug } });
  }

  // ============================================
  // SECTION OPERATIONS
  // ============================================

  /**
   * Create a new section for a page
   * @throws PagesServiceError if page not found or validation fails
   */
  async createSection(pageSlug: string, input: CreateSectionInput): Promise<SectionWithParsedData> {
    if (!input.kind || input.data === undefined) {
      throw new PagesServiceError('VALIDATION_ERROR', 'Kind and data are required', 400);
    }

    const page = await this.prisma.page.findUnique({ where: { slug: pageSlug } });
    if (!page) {
      throw new PagesServiceError('NOT_FOUND', 'Page not found', 404);
    }

    // Get next order if not provided
    const max = await this.prisma.section.aggregate({
      _max: { order: true },
      where: { pageId: page.id },
    });
    const nextOrder = input.order ?? ((max._max.order ?? 0) + 1);

    const section = await this.prisma.section.create({
      data: {
        pageId: page.id,
        kind: input.kind,
        data: JSON.stringify(input.data),
        order: nextOrder,
      },
    });

    return {
      ...section,
      data: JSON.parse(section.data) as Prisma.JsonValue,
    };
  }

  /**
   * Get section by kind (for shared sections like QUOTE_FORM)
   */
  async getSectionByKind(kind: string): Promise<SectionWithParsedData | null> {
    const section = await this.prisma.section.findFirst({
      where: { kind },
      orderBy: { updatedAt: 'desc' },
    });

    if (!section) {
      return null;
    }

    return {
      ...section,
      data: JSON.parse(section.data) as Prisma.JsonValue,
    };
  }

  /**
   * Update a section by ID
   * @throws PagesServiceError if section not found
   */
  async updateSection(id: string, input: UpdateSectionInput): Promise<SectionWithParsedData> {
    try {
      // Update the current section
      const section = await this.prisma.section.update({
        where: { id },
        data: {
          data: input.data !== undefined ? JSON.stringify(input.data) : undefined,
          order: input.order,
        },
      });

      // If syncAll is true, update all sections with the same kind
      if (input.syncAll && input.data !== undefined) {
        await this.prisma.section.updateMany({
          where: {
            kind: section.kind,
            id: { not: id }, // Exclude the current section (already updated)
          },
          data: { data: JSON.stringify(input.data) },
        });
      }

      return {
        ...section,
        data: JSON.parse(section.data) as Prisma.JsonValue,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new PagesServiceError('NOT_FOUND', 'Section not found', 404);
        }
      }
      throw error;
    }
  }

  /**
   * Delete a section by ID
   * @throws PagesServiceError if section not found
   */
  async deleteSection(id: string): Promise<void> {
    try {
      await this.prisma.section.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new PagesServiceError('NOT_FOUND', 'Section not found', 404);
        }
      }
      throw error;
    }
  }
}
