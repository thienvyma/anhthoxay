/**
 * Leads Firestore Service
 * Handles customer leads with auto-merge, duplicate detection, and related leads tracking
 * 
 * @module services/firestore/leads.firestore
 * @requirements 3.2
 */

import * as admin from 'firebase-admin';
import {
  BaseFirestoreService,
  type QueryOptions,
  type PaginatedResult,
  type WhereClause,
} from './base.firestore';
import type {
  FirestoreLead,
  LeadStatus,
  LeadSource,
  StatusHistoryEntry,
} from '../../types/firestore.types';
import { normalizePhone } from '../../utils/phone-normalizer';
import { logger } from '../../utils/logger';

// ============================================
// CONSTANTS
// ============================================

/**
 * Time window for auto-merge in milliseconds (1 hour)
 * Leads with same phone + source within this window will be auto-merged
 */
const AUTO_MERGE_TIME_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// ============================================
// ERROR CLASS
// ============================================

export class LeadsFirestoreError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.name = 'LeadsFirestoreError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// ============================================
// INPUT TYPES
// ============================================

export interface CreateLeadInput {
  name: string;
  phone: string;
  email?: string;
  content: string;
  source: LeadSource;
  quoteData?: string;
}

export interface CreateLeadResult {
  lead: FirestoreLead;
  wasMerged: boolean;
  mergedIntoId?: string;
}

export interface UpdateLeadInput {
  status?: LeadStatus;
  notes?: string;
}

export interface LeadsQueryParams {
  search?: string;
  status?: LeadStatus;
  duplicateStatus?: 'all' | 'duplicates_only' | 'no_duplicates';
  hasRelated?: boolean;
  source?: LeadSource;
  page: number;
  limit: number;
}

export interface RelatedLeadSummary {
  id: string;
  source: LeadSource;
  status: LeadStatus;
  contentPreview: string;
  createdAt: Date;
}

export interface RelatedLeadsResult {
  bySource: Record<string, RelatedLeadSummary[]>;
  totalCount: number;
}

export interface MergeLeadsInput {
  primaryLeadId: string;
  secondaryLeadIds: string[];
}

export interface MergeLeadsResult {
  primaryLead: FirestoreLead;
  mergedCount: number;
}

export interface DailyLeadCount {
  date: string;
  count: number;
}

export interface LeadsStatsResult {
  dailyLeads: DailyLeadCount[];
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  conversionRate: number;
  totalLeads: number;
  newLeads: number;
  duplicateSubmissionsBlocked: number;
}

// ============================================
// LEADS FIRESTORE SERVICE
// ============================================

export class LeadsFirestoreService extends BaseFirestoreService<FirestoreLead> {
  constructor() {
    super('leads');
  }

  // ============================================
  // CREATE WITH AUTO-MERGE
  // ============================================

  /**
   * Create a new lead with auto-merge and duplicate detection
   * 
   * Auto-merge logic:
   * - If same normalizedPhone + same source + status NEW + within 1 hour → merge
   * 
   * Related leads detection:
   * - If same phone but different source → mark as related leads
   * 
   * Potential duplicate detection:
   * - If same phone + same source exists (outside time window) → mark as potential duplicate
   */
  async createLead(input: CreateLeadInput): Promise<CreateLeadResult> {
    const normalizedPhone = normalizePhone(input.phone);
    const timeWindowStart = new Date(Date.now() - AUTO_MERGE_TIME_WINDOW_MS);

    // Step 1: Find existing lead for auto-merge
    const existingLeadForMerge = normalizedPhone
      ? await this.findLeadForMerge(normalizedPhone, input.source, timeWindowStart)
      : null;

    // Step 2: Auto-merge if found
    if (existingLeadForMerge) {
      const mergedLead = await this.mergeContent(existingLeadForMerge, input);
      return {
        lead: mergedLead,
        wasMerged: true,
        mergedIntoId: existingLeadForMerge.id,
      };
    }

    // Step 3: Check for potential duplicates and related leads
    const { isPotentialDuplicate, potentialDuplicateIds, relatedLeadCount } =
      await this.checkDuplicatesAndRelated(normalizedPhone, input.source);

    // Step 4: Create new lead
    const newLead = await this.create({
      name: input.name,
      phone: input.phone,
      normalizedPhone: normalizedPhone || undefined,
      email: input.email,
      content: input.content,
      source: input.source,
      status: 'NEW',
      quoteData: input.quoteData,
      submissionCount: 1,
      isPotentialDuplicate,
      potentialDuplicateIds: potentialDuplicateIds.length > 0 ? potentialDuplicateIds : undefined,
      hasRelatedLeads: relatedLeadCount > 0,
      relatedLeadCount,
    });

    // Step 5: Update related leads count for existing leads
    if (relatedLeadCount > 0 && normalizedPhone) {
      await this.updateRelatedLeadsCount(normalizedPhone, newLead.id);
    }

    logger.info('Created new lead', { id: newLead.id, source: input.source });

    return {
      lead: newLead,
      wasMerged: false,
    };
  }

  /**
   * Find existing lead for auto-merge
   */
  private async findLeadForMerge(
    normalizedPhone: string,
    source: LeadSource,
    timeWindowStart: Date
  ): Promise<FirestoreLead | null> {
    const leads = await this.query({
      where: [
        { field: 'normalizedPhone', operator: '==', value: normalizedPhone },
        { field: 'source', operator: '==', value: source },
        { field: 'status', operator: '==', value: 'NEW' },
        { field: 'createdAt', operator: '>=', value: timeWindowStart },
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit: 1,
    });

    // Filter out merged leads
    const unmergedLeads = leads.filter(lead => !lead.mergedIntoId);
    return unmergedLeads.length > 0 ? unmergedLeads[0] : null;
  }

  /**
   * Merge new content into existing lead
   */
  private async mergeContent(
    existingLead: FirestoreLead,
    newInput: CreateLeadInput
  ): Promise<FirestoreLead> {
    const timestamp = new Date().toISOString();
    const separator = `\n\n--- Submission ${existingLead.submissionCount + 1} (${timestamp}) ---\n\n`;
    const mergedContent = existingLead.content + separator + newInput.content;

    const updatedLead = await this.update(existingLead.id, {
      content: mergedContent,
      quoteData: newInput.quoteData || existingLead.quoteData,
      submissionCount: existingLead.submissionCount + 1,
      name: newInput.name || existingLead.name,
      email: newInput.email || existingLead.email,
    });

    logger.info('Auto-merged lead submission', { 
      id: existingLead.id, 
      submissionCount: updatedLead.submissionCount 
    });

    return updatedLead;
  }

  /**
   * Check for potential duplicates and related leads
   */
  private async checkDuplicatesAndRelated(
    normalizedPhone: string | undefined,
    source: LeadSource
  ): Promise<{
    isPotentialDuplicate: boolean;
    potentialDuplicateIds: string[];
    relatedLeadCount: number;
  }> {
    if (!normalizedPhone) {
      return { isPotentialDuplicate: false, potentialDuplicateIds: [], relatedLeadCount: 0 };
    }

    // Find all leads with same normalized phone (not merged)
    const existingLeads = await this.query({
      where: [
        { field: 'normalizedPhone', operator: '==', value: normalizedPhone },
      ],
    });

    const unmergedLeads = existingLeads.filter(lead => !lead.mergedIntoId);

    // Potential duplicates: same source
    const potentialDuplicates = unmergedLeads.filter(lead => lead.source === source);
    const potentialDuplicateIds = potentialDuplicates.map(lead => lead.id);

    // Related leads: different source
    const relatedLeads = unmergedLeads.filter(lead => lead.source !== source);

    return {
      isPotentialDuplicate: potentialDuplicates.length > 0,
      potentialDuplicateIds,
      relatedLeadCount: relatedLeads.length,
    };
  }

  /**
   * Update hasRelatedLeads and relatedLeadCount for all leads with same phone
   */
  private async updateRelatedLeadsCount(
    normalizedPhone: string,
    excludeId?: string
  ): Promise<void> {
    const allLeads = await this.query({
      where: [
        { field: 'normalizedPhone', operator: '==', value: normalizedPhone },
      ],
    });

    const unmergedLeads = allLeads.filter(lead => !lead.mergedIntoId);

    for (const lead of unmergedLeads) {
      if (excludeId && lead.id === excludeId) continue;

      const relatedCount = unmergedLeads.filter(l => l.source !== lead.source && l.id !== lead.id).length;
      await this.update(lead.id, {
        hasRelatedLeads: relatedCount > 0,
        relatedLeadCount: relatedCount,
      });
    }
  }

  // ============================================
  // READ OPERATIONS
  // ============================================

  /**
   * Get lead by ID
   */
  async getLeadById(id: string): Promise<FirestoreLead> {
    const lead = await this.getById(id);
    if (!lead) {
      throw new LeadsFirestoreError('NOT_FOUND', 'Lead not found', 404);
    }
    return lead;
  }

  /**
   * Get lead with merge info
   */
  async getLeadWithMergeInfo(id: string): Promise<{
    lead: FirestoreLead;
    isMerged: boolean;
    mergedIntoId?: string;
  }> {
    const lead = await this.getLeadById(id);
    return {
      lead,
      isMerged: !!lead.mergedIntoId,
      mergedIntoId: lead.mergedIntoId,
    };
  }

  /**
   * Get related leads for a given lead
   */
  async getRelatedLeads(leadId: string): Promise<RelatedLeadsResult> {
    const lead = await this.getLeadById(leadId);

    if (!lead.normalizedPhone) {
      return { bySource: {}, totalCount: 0 };
    }

    const relatedLeads = await this.query({
      where: [
        { field: 'normalizedPhone', operator: '==', value: lead.normalizedPhone },
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });

    // Filter out merged leads and the current lead
    const filteredLeads = relatedLeads.filter(
      l => !l.mergedIntoId && l.id !== leadId
    );

    // Group by source
    const bySource: Record<string, RelatedLeadSummary[]> = {};

    for (const related of filteredLeads) {
      const contentPreview = related.content.length > 100
        ? related.content.substring(0, 100) + '...'
        : related.content;

      const summary: RelatedLeadSummary = {
        id: related.id,
        source: related.source,
        status: related.status,
        contentPreview,
        createdAt: related.createdAt,
      };

      if (!bySource[related.source]) {
        bySource[related.source] = [];
      }
      bySource[related.source].push(summary);
    }

    return {
      bySource,
      totalCount: filteredLeads.length,
    };
  }

  /**
   * Get leads with search, filter, and pagination
   */
  async getLeads(params: LeadsQueryParams): Promise<PaginatedResult<FirestoreLead>> {
    const { search, status, duplicateStatus, hasRelated, source, page, limit } = params;

    // Build where clauses
    const whereClause: WhereClause<FirestoreLead>[] = [];

    if (status) {
      whereClause.push({ field: 'status', operator: '==', value: status });
    }

    if (source) {
      whereClause.push({ field: 'source', operator: '==', value: source });
    }

    if (duplicateStatus === 'duplicates_only') {
      whereClause.push({ field: 'isPotentialDuplicate', operator: '==', value: true });
    } else if (duplicateStatus === 'no_duplicates') {
      whereClause.push({ field: 'isPotentialDuplicate', operator: '==', value: false });
    }

    if (hasRelated !== undefined) {
      whereClause.push({ field: 'hasRelatedLeads', operator: '==', value: hasRelated });
    }

    // Query with pagination
    const queryOptions: QueryOptions<FirestoreLead> = {
      where: whereClause.length > 0 ? whereClause : undefined,
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit,
    };

    // Get all matching leads (Firestore doesn't support offset, so we fetch more and filter)
    const allLeads = await this.query({
      ...queryOptions,
      limit: undefined, // Get all for filtering
    });

    // Filter out merged leads
    let filteredLeads = allLeads.filter(lead => !lead.mergedIntoId);

    // Apply search filter (client-side since Firestore doesn't support full-text search)
    if (search) {
      const searchLower = search.toLowerCase();
      filteredLeads = filteredLeads.filter(lead =>
        lead.name.toLowerCase().includes(searchLower) ||
        lead.phone.includes(searchLower) ||
        (lead.email && lead.email.toLowerCase().includes(searchLower))
      );
    }

    // Calculate pagination
    const total = filteredLeads.length;
    const startIndex = (page - 1) * limit;
    const paginatedLeads = filteredLeads.slice(startIndex, startIndex + limit);

    return {
      data: paginatedLeads,
      hasMore: startIndex + limit < total,
      total,
    };
  }

  // ============================================
  // UPDATE OPERATIONS
  // ============================================

  /**
   * Update a lead with status history tracking
   */
  async updateLead(
    id: string,
    input: UpdateLeadInput,
    changedBy?: string
  ): Promise<FirestoreLead> {
    const currentLead = await this.getLeadById(id);

    const updateData: Partial<FirestoreLead> = {};

    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    // Handle status change with history tracking
    if (input.status && input.status !== currentLead.status) {
      updateData.status = input.status;

      // Build status history
      const history: StatusHistoryEntry[] = currentLead.statusHistory || [];
      history.push({
        from: currentLead.status,
        to: input.status,
        changedAt: new Date(),
        changedBy,
      });
      updateData.statusHistory = history;
    }

    return this.update(id, updateData);
  }

  /**
   * Delete a lead
   */
  async deleteLead(id: string): Promise<void> {
    const lead = await this.getById(id);
    if (!lead) {
      throw new LeadsFirestoreError('NOT_FOUND', 'Lead not found', 404);
    }
    await this.delete(id);
    logger.info('Deleted lead', { id });
  }

  // ============================================
  // MANUAL MERGE OPERATIONS
  // ============================================

  /**
   * Validate leads for manual merge
   */
  async validateMergeLeads(input: MergeLeadsInput): Promise<{
    primaryLead: FirestoreLead;
    secondaryLeads: FirestoreLead[];
  }> {
    const { primaryLeadId, secondaryLeadIds } = input;

    if (secondaryLeadIds.includes(primaryLeadId)) {
      throw new LeadsFirestoreError('MERGE_SELF', 'Không thể merge lead với chính nó', 400);
    }

    if (secondaryLeadIds.length === 0) {
      throw new LeadsFirestoreError('MERGE_NO_SECONDARY', 'Phải có ít nhất một lead phụ để merge', 400);
    }

    const primaryLead = await this.getById(primaryLeadId);
    if (!primaryLead) {
      throw new LeadsFirestoreError('MERGE_LEAD_NOT_FOUND', 'Lead chính không tồn tại', 404);
    }

    if (primaryLead.mergedIntoId) {
      throw new LeadsFirestoreError('MERGE_ALREADY_MERGED', 'Lead chính đã được merge trước đó', 400);
    }

    // Get secondary leads
    const secondaryLeads: FirestoreLead[] = [];
    for (const id of secondaryLeadIds) {
      const lead = await this.getById(id);
      if (!lead) {
        throw new LeadsFirestoreError('MERGE_LEAD_NOT_FOUND', `Lead không tồn tại: ${id}`, 404);
      }
      if (lead.mergedIntoId) {
        throw new LeadsFirestoreError('MERGE_ALREADY_MERGED', `Lead đã được merge trước đó: ${id}`, 400);
      }
      secondaryLeads.push(lead);
    }

    // Validate same source
    const allLeads = [primaryLead, ...secondaryLeads];
    const sources = new Set(allLeads.map(l => l.source));
    if (sources.size > 1) {
      throw new LeadsFirestoreError('MERGE_DIFFERENT_SOURCE', 'Không thể merge leads từ nguồn khác nhau', 400);
    }

    return { primaryLead, secondaryLeads };
  }

  /**
   * Manually merge leads
   */
  async mergeLeads(input: MergeLeadsInput): Promise<MergeLeadsResult> {
    const { primaryLead, secondaryLeads } = await this.validateMergeLeads(input);

    // Build merged content
    let mergedContent = primaryLead.content;
    let totalSubmissionCount = primaryLead.submissionCount;

    const sortedSecondaryLeads = [...secondaryLeads].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    for (const secondaryLead of sortedSecondaryLeads) {
      const timestamp = secondaryLead.createdAt.toISOString();
      const separator = `\n\n--- Merged from Lead ${secondaryLead.id} (${timestamp}) ---\n\n`;
      mergedContent += separator + secondaryLead.content;
      totalSubmissionCount += secondaryLead.submissionCount;
    }

    const mergedAt = new Date();
    const secondaryLeadIds = secondaryLeads.map(l => l.id);

    // Use transaction for atomicity
    const db = await this.getDb();
    const collection = await this.getCollection();

    const updatedPrimaryLead = await db.runTransaction(async (transaction) => {
      // Update primary lead
      const primaryRef = collection.doc(primaryLead.id);
      transaction.update(primaryRef, {
        content: mergedContent,
        submissionCount: totalSubmissionCount,
        isPotentialDuplicate: false,
        potentialDuplicateIds: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date()),
      });

      // Soft-delete secondary leads
      for (const id of secondaryLeadIds) {
        const secondaryRef = collection.doc(id);
        transaction.update(secondaryRef, {
          mergedIntoId: primaryLead.id,
          mergedAt: admin.firestore.Timestamp.fromDate(mergedAt),
          updatedAt: admin.firestore.Timestamp.fromDate(new Date()),
        });
      }

      return {
        ...primaryLead,
        content: mergedContent,
        submissionCount: totalSubmissionCount,
        isPotentialDuplicate: false,
        potentialDuplicateIds: undefined,
      };
    });

    // Update potentialDuplicateIds on remaining leads
    if (primaryLead.normalizedPhone) {
      await this.cleanupPotentialDuplicateIds(primaryLead.normalizedPhone, primaryLead.source, secondaryLeadIds, primaryLead.id);
    }

    logger.info('Merged leads', { 
      primaryId: primaryLead.id, 
      mergedCount: secondaryLeads.length 
    });

    return {
      primaryLead: updatedPrimaryLead,
      mergedCount: secondaryLeads.length,
    };
  }

  /**
   * Clean up potentialDuplicateIds after merge
   */
  private async cleanupPotentialDuplicateIds(
    normalizedPhone: string,
    source: LeadSource,
    mergedIds: string[],
    excludeId: string
  ): Promise<void> {
    const remainingLeads = await this.query({
      where: [
        { field: 'normalizedPhone', operator: '==', value: normalizedPhone },
        { field: 'source', operator: '==', value: source },
      ],
    });

    for (const lead of remainingLeads) {
      if (lead.mergedIntoId || lead.id === excludeId) continue;

      if (lead.potentialDuplicateIds) {
        const filteredIds = lead.potentialDuplicateIds.filter(id => !mergedIds.includes(id));
        await this.update(lead.id, {
          potentialDuplicateIds: filteredIds.length > 0 ? filteredIds : undefined,
          isPotentialDuplicate: filteredIds.length > 0,
        });
      }
    }
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Get dashboard statistics for leads
   */
  async getStats(): Promise<LeadsStatsResult> {
    // Get all non-merged leads
    const allLeads = await this.query({});
    const leads = allLeads.filter(lead => !lead.mergedIntoId);

    // Daily leads for last 30 days
    const dailyLeadsMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyLeadsMap.set(dateStr, 0);
    }

    leads.forEach(lead => {
      const dateStr = lead.createdAt.toISOString().split('T')[0];
      if (dailyLeadsMap.has(dateStr)) {
        dailyLeadsMap.set(dateStr, (dailyLeadsMap.get(dateStr) || 0) + 1);
      }
    });

    const dailyLeads = Array.from(dailyLeadsMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Status distribution
    const byStatus: Record<string, number> = {};
    leads.forEach(lead => {
      byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
    });

    // Source distribution
    const bySource: Record<string, number> = {};
    leads.forEach(lead => {
      bySource[lead.source] = (bySource[lead.source] || 0) + 1;
    });

    // Conversion rate
    const totalNonCancelled = leads.filter(l => l.status !== 'CANCELLED').length;
    const converted = byStatus['CONVERTED'] || 0;
    const conversionRate = totalNonCancelled > 0
      ? Math.round((converted / totalNonCancelled) * 100 * 100) / 100
      : 0;

    // Duplicate submissions blocked
    const duplicateSubmissionsBlocked = leads.reduce(
      (sum, lead) => sum + (lead.submissionCount - 1),
      0
    );

    return {
      dailyLeads,
      byStatus,
      bySource,
      conversionRate,
      totalLeads: leads.length,
      newLeads: byStatus['NEW'] || 0,
      duplicateSubmissionsBlocked,
    };
  }

  // ============================================
  // EXPORT
  // ============================================

  /**
   * Export leads to CSV format
   */
  async exportToCsv(params?: { search?: string; status?: string }): Promise<string> {
    const allLeads = await this.query({
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });

    let leads = allLeads.filter(lead => !lead.mergedIntoId);

    // Apply filters
    if (params?.status) {
      leads = leads.filter(lead => lead.status === params.status);
    }

    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      leads = leads.filter(lead =>
        lead.name.toLowerCase().includes(searchLower) ||
        lead.phone.includes(searchLower) ||
        (lead.email && lead.email.toLowerCase().includes(searchLower))
      );
    }

    // Generate CSV
    const headers = ['name', 'phone', 'email', 'content', 'status', 'source', 'createdAt'];
    const csvRows = [headers.join(',')];

    leads.forEach(lead => {
      const row = [
        `"${(lead.name || '').replace(/"/g, '""')}"`,
        `"${(lead.phone || '').replace(/"/g, '""')}"`,
        `"${(lead.email || '').replace(/"/g, '""')}"`,
        `"${(lead.content || '').replace(/"/g, '""')}"`,
        `"${lead.status}"`,
        `"${lead.source}"`,
        `"${lead.createdAt.toISOString()}"`,
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  // ============================================
  // HELPER QUERIES
  // ============================================

  /**
   * Get leads by phone number
   */
  async getByPhone(phone: string): Promise<FirestoreLead[]> {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) return [];

    return this.query({
      where: [
        { field: 'normalizedPhone', operator: '==', value: normalizedPhone },
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get leads by status
   */
  async getByStatus(status: LeadStatus): Promise<FirestoreLead[]> {
    const leads = await this.query({
      where: [
        { field: 'status', operator: '==', value: status },
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });

    return leads.filter(lead => !lead.mergedIntoId);
  }

  /**
   * Find potential duplicates for a lead
   */
  async findDuplicates(leadId: string): Promise<FirestoreLead[]> {
    const lead = await this.getLeadById(leadId);
    
    if (!lead.normalizedPhone) return [];

    const duplicates = await this.query({
      where: [
        { field: 'normalizedPhone', operator: '==', value: lead.normalizedPhone },
        { field: 'source', operator: '==', value: lead.source },
      ],
    });

    return duplicates.filter(d => !d.mergedIntoId && d.id !== leadId);
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let leadsFirestoreService: LeadsFirestoreService | null = null;

export function getLeadsFirestoreService(): LeadsFirestoreService {
  if (!leadsFirestoreService) {
    leadsFirestoreService = new LeadsFirestoreService();
  }
  return leadsFirestoreService;
}

export default LeadsFirestoreService;
