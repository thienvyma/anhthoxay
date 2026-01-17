/**
 * Pages Firestore Service
 * 
 * Handles pages and sections in Firestore:
 * - Pages in `pages/{pageId}`
 * - Sections as subcollection `pages/{pageId}/sections/{sectionId}`
 * 
 * @module services/firestore/pages.firestore
 * @requirements 3.7
 */

import * as admin from 'firebase-admin';
import { BaseFirestoreService, SubcollectionFirestoreService, FirestoreDocument } from './base.firestore';
import { getFirestore } from '../firebase-admin.service';
import { logger } from '../../utils/logger';

// ============================================
// ERROR CLASS
// ============================================

export class PagesFirestoreError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.code = code;
    this.name = 'PagesFirestoreError';
    this.statusCode = statusCode;
  }
}

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Page document
 */
export interface PageDoc extends FirestoreDocument {
  slug: string;
  title: string;
  isActive: boolean;
  headerConfig?: string | null;
  footerConfig?: string | null;
}

/**
 * Section document (subcollection of Page)
 */
export interface SectionDoc extends FirestoreDocument {
  pageId: string;
  kind: string;
  data: Record<string, unknown>;
  order: number;
}

/**
 * Page with sections
 */
export interface PageWithSections extends PageDoc {
  sections: SectionDoc[];
}

/**
 * Page with section count
 */
export interface PageWithSectionCount extends PageDoc {
  _count: { sections: number };
}

// ============================================
// INPUT TYPES
// ============================================

export interface CreatePageInput {
  slug: string;
  title: string;
}

export interface UpdatePageInput {
  title?: string;
  isActive?: boolean;
  headerConfig?: string | null;
  footerConfig?: string | null;
}

export interface CreateSectionInput {
  kind: string;
  data: Record<string, unknown>;
  order?: number;
}

export interface UpdateSectionInput {
  data?: Record<string, unknown>;
  order?: number;
  syncAll?: boolean;
}

/**
 * Ensure the provided section data is JSON-serializable.
 * This prevents Firestore writes failing when client accidentally sends
 * functions, DOM nodes, or other non-serializable values.
 */
function assertSerializable(obj: unknown, path = ''): void {
  try {
    JSON.stringify(obj);
  } catch (err) {
    logger.warn('Section data is not serializable', { path, error: err });
    throw new PagesFirestoreError('VALIDATION_ERROR', 'Section data contains non-serializable values', 400);
  }
}

// ============================================
// HELPER FUNCTION
// ============================================

/**
 * Convert Firestore document to SectionDoc
 */
function docToSectionEntity(doc: admin.firestore.QueryDocumentSnapshot): SectionDoc {
  const data = doc.data();
  return {
    id: doc.id,
    pageId: data.pageId as string,
    kind: data.kind as string,
    data: data.data as Record<string, unknown>,
    order: data.order as number,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

// ============================================
// SECTION FIRESTORE SERVICE
// ============================================

export class SectionFirestoreService extends SubcollectionFirestoreService<SectionDoc> {
  constructor() {
    super('pages', 'sections');
  }

  /**
   * Get all sections for a page ordered by order
   */
  async getSectionsForPage(pageId: string): Promise<SectionDoc[]> {
    return this.query(pageId, {
      orderBy: [{ field: 'order', direction: 'asc' }],
    });
  }

  /**
   * Get section by kind (across all pages)
   */
  async getSectionByKind(kind: string): Promise<SectionDoc | null> {
    const db = await getFirestore();
    const snapshot = await db
      .collectionGroup('sections')
      .where('kind', '==', kind)
      .orderBy('updatedAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return docToSectionEntity(doc);
  }

  /**
   * Get max order for a page
   */
  async getMaxOrder(pageId: string): Promise<number> {
    const sections = await this.query(pageId, {
      orderBy: [{ field: 'order', direction: 'desc' }],
      limit: 1,
    });
    return sections.length > 0 ? sections[0].order : 0;
  }

  /**
   * Update all sections with the same kind
   */
  async updateAllByKind(kind: string, data: Record<string, unknown>, excludeId?: string): Promise<void> {
    const db = await getFirestore();
    const snapshot = await db
      .collectionGroup('sections')
      .where('kind', '==', kind)
      .get();

    const batch = db.batch();
    const now = new Date();

    for (const doc of snapshot.docs) {
      if (excludeId && doc.id === excludeId) continue;
      batch.update(doc.ref, {
        data,
        updatedAt: admin.firestore.Timestamp.fromDate(now),
      });
    }

    await batch.commit();
    logger.info('Updated all sections by kind', { kind, count: snapshot.size - (excludeId ? 1 : 0) });
  }

  /**
   * Count sections for a page
   */
  async countForPage(pageId: string): Promise<number> {
    const sections = await this.query(pageId, {});
    return sections.length;
  }
}

// ============================================
// PAGE FIRESTORE SERVICE
// ============================================

export class PageFirestoreService extends BaseFirestoreService<PageDoc> {
  private sectionService: SectionFirestoreService;

  constructor() {
    super('pages');
    this.sectionService = new SectionFirestoreService();
  }

  /**
   * Get all pages with section count
   */
  async getAllPages(): Promise<PageWithSectionCount[]> {
    const pages = await this.query({
      orderBy: [{ field: 'slug', direction: 'asc' }],
    });

    const results: PageWithSectionCount[] = [];
    for (const page of pages) {
      const count = await this.sectionService.countForPage(page.id);
      results.push({
        ...page,
        _count: { sections: count },
      });
    }

    return results;
  }

  /**
   * Get page by slug
   */
  async getBySlug(slug: string): Promise<PageDoc | null> {
    const pages = await this.query({
      where: [{ field: 'slug', operator: '==', value: slug }],
      limit: 1,
    });
    return pages[0] || null;
  }

  /**
   * Get page by slug with all sections
   */
  async getBySlugWithSections(slug: string): Promise<PageWithSections | null> {
    const page = await this.getBySlug(slug);
    if (!page) return null;

    const sections = await this.sectionService.getSectionsForPage(page.id);
    return {
      ...page,
      sections,
    };
  }

  /**
   * Create a new page
   */
  async createPage(input: CreatePageInput): Promise<PageDoc> {
    if (!input.slug || !input.title) {
      throw new PagesFirestoreError('VALIDATION_ERROR', 'Slug and title are required', 400);
    }

    // Check for duplicate slug
    const existing = await this.getBySlug(input.slug);
    if (existing) {
      throw new PagesFirestoreError('CONFLICT', 'Page with this slug already exists', 409);
    }

    const page = await this.create({
      slug: input.slug,
      title: input.title,
      isActive: true,
      headerConfig: null,
      footerConfig: null,
    });

    logger.info('Created page', { id: page.id, slug: page.slug });
    return page;
  }

  /**
   * Update a page by slug
   */
  async updatePage(slug: string, input: UpdatePageInput): Promise<PageDoc> {
    const page = await this.getBySlug(slug);
    if (!page) {
      throw new PagesFirestoreError('NOT_FOUND', 'Page not found', 404);
    }

    const updated = await this.update(page.id, input);
    logger.info('Updated page', { id: page.id, slug });
    return updated;
  }

  /**
   * Delete a page and all its sections
   */
  async deletePage(slug: string): Promise<void> {
    const page = await this.getBySlug(slug);
    if (!page) {
      throw new PagesFirestoreError('NOT_FOUND', 'Page not found', 404);
    }

    // Delete all sections first
    const sections = await this.sectionService.getSectionsForPage(page.id);
    for (const section of sections) {
      await this.sectionService.delete(page.id, section.id);
    }

    // Delete the page
    await this.delete(page.id);
    logger.info('Deleted page with sections', { id: page.id, slug, sectionsDeleted: sections.length });
  }

  // ============================================
  // SECTION OPERATIONS
  // ============================================

  /**
   * Create a section for a page
   */
  async createSection(pageSlug: string, input: CreateSectionInput): Promise<SectionDoc> {
    if (!input.kind || input.data === undefined) {
      throw new PagesFirestoreError('VALIDATION_ERROR', 'Kind and data are required', 400);
    }

    const page = await this.getBySlug(pageSlug);
    if (!page) {
      throw new PagesFirestoreError('NOT_FOUND', 'Page not found', 404);
    }

    // Get next order if not provided
    const maxOrder = await this.sectionService.getMaxOrder(page.id);
    const order = input.order ?? (maxOrder + 1);

    const section = await this.sectionService.create(page.id, {
      pageId: page.id,
      kind: input.kind,
      data: input.data,
      order,
    });

    logger.info('Created section', { id: section.id, pageId: page.id, kind: input.kind });
    return section;
  }

  /**
   * Get section by kind
   */
  async getSectionByKind(kind: string): Promise<SectionDoc | null> {
    return this.sectionService.getSectionByKind(kind);
  }

  /**
   * Update a section by ID
   */
  async updateSection(sectionId: string, input: UpdateSectionInput): Promise<SectionDoc> {
    // Find the section across all pages
    const db = await getFirestore();
    const snapshot = await db
      .collectionGroup('sections')
      .where('id', '==', sectionId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      // Try to find by document ID directly - collectionGroup doesn't support 'id' field
      // We need to search differently
      const allPages = await this.query({});
      let foundSection: SectionDoc | null = null;
      let foundPageId: string | null = null;

      for (const page of allPages) {
        const section = await this.sectionService.getById(page.id, sectionId);
        if (section) {
          foundSection = section;
          foundPageId = page.id;
          break;
        }
      }

      if (!foundSection || !foundPageId) {
        throw new PagesFirestoreError('NOT_FOUND', 'Section not found', 404);
      }

      // Update the section
      const updateData: Partial<SectionDoc> = {};
      if (input.data !== undefined) {
        // Validate serializability to avoid Firestore write errors from client-sent functions/DOM nodes
        assertSerializable(input.data);
        updateData.data = input.data;
      }
      if (input.order !== undefined) {
        updateData.order = input.order;
      }

      const updated = await this.sectionService.update(foundPageId, sectionId, updateData);

      // If syncAll is true, update all sections with the same kind
      if (input.syncAll && input.data !== undefined) {
        await this.sectionService.updateAllByKind(updated.kind, input.data, sectionId);
      }

      logger.info('Updated section', { id: sectionId, syncAll: input.syncAll });
      return updated;
    }

    const doc = snapshot.docs[0];
    const sectionData = doc.data();
    const pageId = sectionData.pageId as string;

    // Update the section
    const updateData: Partial<SectionDoc> = {};
    if (input.data !== undefined) {
      updateData.data = input.data;
    }
    if (input.order !== undefined) {
      updateData.order = input.order;
    }

    const updated = await this.sectionService.update(pageId, sectionId, updateData);

    // If syncAll is true, update all sections with the same kind
    if (input.syncAll && input.data !== undefined) {
      await this.sectionService.updateAllByKind(updated.kind, input.data, sectionId);
    }

    logger.info('Updated section', { id: sectionId, syncAll: input.syncAll });
    return updated;
  }

  /**
   * Delete a section by ID
   */
  async deleteSection(sectionId: string): Promise<void> {
    // Find the section across all pages
    const allPages = await this.query({});
    let foundPageId: string | null = null;

    for (const page of allPages) {
      const section = await this.sectionService.getById(page.id, sectionId);
      if (section) {
        foundPageId = page.id;
        break;
      }
    }

    if (!foundPageId) {
      throw new PagesFirestoreError('NOT_FOUND', 'Section not found', 404);
    }

    await this.sectionService.delete(foundPageId, sectionId);
    logger.info('Deleted section', { id: sectionId });
  }
}

// ============================================
// SINGLETON INSTANCES
// ============================================

let pageServiceInstance: PageFirestoreService | null = null;
let sectionServiceInstance: SectionFirestoreService | null = null;

export function getPageFirestoreService(): PageFirestoreService {
  if (!pageServiceInstance) {
    pageServiceInstance = new PageFirestoreService();
  }
  return pageServiceInstance;
}

export function getSectionFirestoreService(): SectionFirestoreService {
  if (!sectionServiceInstance) {
    sectionServiceInstance = new SectionFirestoreService();
  }
  return sectionServiceInstance;
}
