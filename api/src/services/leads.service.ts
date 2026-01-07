/**
 * Leads Service Module
 *
 * Handles business logic for customer leads including CRUD operations,
 * statistics calculation, CSV export, and duplicate management.
 * Separates data access and business logic from HTTP handling.
 *
 * **Feature: lead-duplicate-management**
 * **Requirements: 1.1-1.4, 2.1-2.5, 3.1-3.3, 4.1, 4.3**
 */

import { PrismaClient, Prisma, CustomerLead } from '@prisma/client';
import { normalizePhone } from '../utils/phone-normalizer';

// ============================================
// TYPES & INTERFACES
// ============================================

/**
 * Status history entry for tracking lead status changes
 */
export interface StatusHistoryEntry {
  from: string;
  to: string;
  changedAt: string;
  changedBy?: string;
}

/**
 * Input for creating a new lead
 */
export interface CreateLeadInput {
  name: string;
  phone: string;
  email?: string | null;
  content: string;
  source: 'QUOTE_FORM' | 'CONTACT_FORM' | 'FURNITURE_QUOTE';
  quoteData?: string;
}

/**
 * Result of creating a lead (includes merge info)
 */
export interface CreateLeadResult {
  lead: CustomerLead;
  wasMerged: boolean;
  mergedIntoId?: string;
}

/**
 * Input for updating a lead
 */
export interface UpdateLeadInput {
  status?: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CANCELLED';
  notes?: string;
}

/**
 * Query parameters for listing leads
 * 
 * **Feature: lead-duplicate-management**
 * **Requirements: 8.1, 8.2, 8.3**
 */
export interface LeadsQueryParams {
  search?: string;
  status?: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CANCELLED';
  // Duplicate management filters
  duplicateStatus?: 'all' | 'duplicates_only' | 'no_duplicates';
  hasRelated?: boolean;
  source?: 'QUOTE_FORM' | 'CONTACT_FORM' | 'FURNITURE_QUOTE';
  page: number;
  limit: number;
}

/**
 * Paginated result for leads list
 */
export interface PaginatedLeadsResult {
  leads: CustomerLead[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Daily lead count for stats
 */
export interface DailyLeadCount {
  date: string;
  count: number;
}

/**
 * Lead statistics result
 */
export interface LeadsStatsResult {
  dailyLeads: DailyLeadCount[];
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  conversionRate: number;
  totalLeads: number;
  newLeads: number;
  duplicateSubmissionsBlocked: number;
}

/**
 * Related lead summary for display
 * 
 * **Feature: lead-duplicate-management**
 * **Requirements: 5.2, 5.3**
 */
export interface RelatedLeadSummary {
  id: string;
  source: string;
  status: string;
  contentPreview: string;
  createdAt: Date;
}

/**
 * Input for manual merge operation
 * 
 * **Feature: lead-duplicate-management**
 * **Requirements: 6.1, 6.2, 6.3**
 */
export interface MergeLeadsInput {
  primaryLeadId: string;
  secondaryLeadIds: string[];
}

/**
 * Result of manual merge operation
 * 
 * **Feature: lead-duplicate-management**
 * **Requirements: 6.3, 6.4, 6.5**
 */
export interface MergeLeadsResult {
  primaryLead: CustomerLead;
  mergedCount: number;
}

/**
 * Result of getting related leads
 * 
 * **Feature: lead-duplicate-management**
 * **Requirements: 5.1, 5.2, 5.3**
 */
export interface RelatedLeadsResult {
  bySource: Record<string, RelatedLeadSummary[]>;
  totalCount: number;
}

// ============================================
// ERROR CLASS
// ============================================

export class LeadsServiceError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.code = code;
    this.name = 'LeadsServiceError';
    this.statusCode = statusCode;
  }
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Time window for auto-merge in milliseconds (1 hour)
 * Leads with same phone + source within this window will be auto-merged
 */
const AUTO_MERGE_TIME_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// ============================================
// LEADS SERVICE CLASS
// ============================================

export class LeadsService {
  constructor(private prisma: PrismaClient) {}

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Create a new customer lead with auto-merge and duplicate detection
   *
   * Auto-merge logic (Requirements 2.1-2.5):
   * - If same normalizedPhone + same source + status NEW + within 1 hour → merge
   * - If existing lead status is not NEW → create new lead
   *
   * Related leads detection (Requirements 3.1-3.3):
   * - If same phone but different source → mark as related leads
   *
   * Potential duplicate detection (Requirements 4.1, 4.3):
   * - If same phone + same source exists (outside time window) → mark as potential duplicate
   */
  async createLead(input: CreateLeadInput): Promise<CreateLeadResult> {
    // Step 1: Normalize phone number
    const normalizedPhone = normalizePhone(input.phone);

    // Step 2: Find existing lead for auto-merge
    // Same normalizedPhone + same source + status NEW + within 1 hour
    const timeWindowStart = new Date(Date.now() - AUTO_MERGE_TIME_WINDOW_MS);

    const existingLeadForMerge = normalizedPhone
      ? await this.prisma.customerLead.findFirst({
          where: {
            normalizedPhone,
            source: input.source,
            status: 'NEW',
            createdAt: { gte: timeWindowStart },
            mergedIntoId: null, // Not already merged
          },
          orderBy: { createdAt: 'desc' },
        })
      : null;

    // Step 3: Auto-merge if found (Requirements 2.1-2.4)
    if (existingLeadForMerge) {
      const mergedLead = await this.mergeContent(existingLeadForMerge, input);
      return {
        lead: mergedLead,
        wasMerged: true,
        mergedIntoId: existingLeadForMerge.id,
      };
    }

    // Step 4: Check for potential duplicates and related leads
    const { isPotentialDuplicate, potentialDuplicateIds, relatedLeads } =
      await this.checkDuplicatesAndRelated(normalizedPhone, input.source);

    // Step 5: Create new lead
    const newLead = await this.prisma.customerLead.create({
      data: {
        name: input.name,
        phone: input.phone,
        normalizedPhone: normalizedPhone || null,
        email: input.email || null,
        content: input.content,
        source: input.source,
        quoteData: input.quoteData,
        isPotentialDuplicate,
        potentialDuplicateIds: potentialDuplicateIds.length > 0
          ? JSON.stringify(potentialDuplicateIds)
          : null,
        hasRelatedLeads: relatedLeads.length > 0,
        relatedLeadCount: relatedLeads.length,
      },
    });

    // Step 6: Update related leads (same phone, different source)
    if (relatedLeads.length > 0) {
      await this.updateRelatedLeadsCount(normalizedPhone);
    }

    return {
      lead: newLead,
      wasMerged: false,
    };
  }

  /**
   * Merge new content into existing lead (Requirements 2.2, 2.3, 2.4)
   * - Append content with timestamp separator
   * - Update quoteData if new one provided
   * - Increment submissionCount
   */
  private async mergeContent(
    existingLead: CustomerLead,
    newInput: CreateLeadInput
  ): Promise<CustomerLead> {
    const timestamp = new Date().toISOString();
    const separator = `\n\n--- Submission ${existingLead.submissionCount + 1} (${timestamp}) ---\n\n`;
    const mergedContent = existingLead.content + separator + newInput.content;

    // Update quoteData if new one provided
    const newQuoteData = newInput.quoteData || existingLead.quoteData;

    return this.prisma.customerLead.update({
      where: { id: existingLead.id },
      data: {
        content: mergedContent,
        quoteData: newQuoteData,
        submissionCount: existingLead.submissionCount + 1,
        // Update name/email if provided (use latest)
        name: newInput.name || existingLead.name,
        email: newInput.email || existingLead.email,
      },
    });
  }

  /**
   * Check for potential duplicates and related leads
   * - Potential duplicate: same phone + same source (outside time window)
   * - Related leads: same phone + different source
   */
  private async checkDuplicatesAndRelated(
    normalizedPhone: string,
    source: string
  ): Promise<{
    isPotentialDuplicate: boolean;
    potentialDuplicateIds: string[];
    relatedLeads: CustomerLead[];
  }> {
    if (!normalizedPhone) {
      return {
        isPotentialDuplicate: false,
        potentialDuplicateIds: [],
        relatedLeads: [],
      };
    }

    // Find all leads with same normalized phone (not merged)
    const existingLeads = await this.prisma.customerLead.findMany({
      where: {
        normalizedPhone,
        mergedIntoId: null,
      },
    });

    // Potential duplicates: same source (Requirements 4.1, 4.3)
    const potentialDuplicates = existingLeads.filter((lead) => lead.source === source);
    const potentialDuplicateIds = potentialDuplicates.map((lead) => lead.id);

    // Related leads: different source (Requirements 3.2, 3.3)
    const relatedLeads = existingLeads.filter((lead) => lead.source !== source);

    return {
      isPotentialDuplicate: potentialDuplicates.length > 0,
      potentialDuplicateIds,
      relatedLeads,
    };
  }

  /**
   * Update hasRelatedLeads and relatedLeadCount for all leads with same phone
   * Called when a new lead is created with same phone but different source
   */
  private async updateRelatedLeadsCount(normalizedPhone: string): Promise<void> {
    if (!normalizedPhone) return;

    // Get all leads with same normalized phone (not merged)
    const allRelatedLeads = await this.prisma.customerLead.findMany({
      where: {
        normalizedPhone,
        mergedIntoId: null,
      },
      select: { id: true, source: true },
    });

    // Update each lead with count of leads from OTHER sources
    for (const lead of allRelatedLeads) {
      const relatedCount = allRelatedLeads.filter((l) => l.source !== lead.source).length;
      await this.prisma.customerLead.update({
        where: { id: lead.id },
        data: {
          hasRelatedLeads: relatedCount > 0,
          relatedLeadCount: relatedCount,
        },
      });
    }
  }

  /**
   * Get a lead by ID
   * @throws LeadsServiceError if lead not found
   */
  async getLeadById(id: string): Promise<CustomerLead> {
    const lead = await this.prisma.customerLead.findUnique({ where: { id } });

    if (!lead) {
      throw new LeadsServiceError('NOT_FOUND', 'Lead not found', 404);
    }

    return lead;
  }

  /**
   * Get all related leads for a given lead (same normalizedPhone, any source)
   * Groups results by source for easy display
   * 
   * **Feature: lead-duplicate-management**
   * **Requirements: 5.1, 5.2, 5.3**
   * 
   * @param leadId - The ID of the lead to find related leads for
   * @returns Related leads grouped by source with content preview
   * @throws LeadsServiceError if lead not found
   */
  async getRelatedLeads(leadId: string): Promise<RelatedLeadsResult> {
    // Get the lead to find its normalizedPhone
    const lead = await this.prisma.customerLead.findUnique({
      where: { id: leadId },
      select: { id: true, normalizedPhone: true },
    });

    if (!lead) {
      throw new LeadsServiceError('NOT_FOUND', 'Lead not found', 404);
    }

    // If no normalized phone, no related leads possible
    if (!lead.normalizedPhone) {
      return { bySource: {}, totalCount: 0 };
    }

    // Find all leads with same normalizedPhone (excluding merged leads and the current lead)
    const relatedLeads = await this.prisma.customerLead.findMany({
      where: {
        normalizedPhone: lead.normalizedPhone,
        mergedIntoId: null,
        id: { not: leadId }, // Exclude the current lead
      },
      select: {
        id: true,
        source: true,
        status: true,
        content: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by source with content preview (Requirements 5.2, 5.3)
    const bySource: Record<string, RelatedLeadSummary[]> = {};

    for (const related of relatedLeads) {
      // Create content preview (first 100 chars)
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
      totalCount: relatedLeads.length,
    };
  }

  /**
   * Get leads with search, filter, and pagination
   * 
   * **Feature: lead-duplicate-management**
   * **Requirements: 8.1, 8.2, 8.3**
   * 
   * Filters:
   * - duplicateStatus: 'all' | 'duplicates_only' | 'no_duplicates'
   * - hasRelated: filter by hasRelatedLeads
   * - source: filter by lead source
   * - Excludes merged leads (mergedIntoId != null) by default
   */
  async getLeads(params: LeadsQueryParams): Promise<PaginatedLeadsResult> {
    const { search, status, duplicateStatus, hasRelated, source, page, limit } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.CustomerLeadWhereInput = {
      // Exclude merged leads by default (Requirements 8.3)
      mergedIntoId: null,
    };

    // Status filter
    if (status) {
      where.status = status;
    }

    // Source filter (Requirements 8.1)
    if (source) {
      where.source = source;
    }

    // Duplicate status filter (Requirements 8.1, 8.2)
    if (duplicateStatus === 'duplicates_only') {
      where.isPotentialDuplicate = true;
    } else if (duplicateStatus === 'no_duplicates') {
      where.isPotentialDuplicate = false;
    }
    // 'all' = no filter on isPotentialDuplicate

    // Has related leads filter (Requirements 8.2)
    if (hasRelated !== undefined) {
      where.hasRelatedLeads = hasRelated;
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      where.OR = [
        { name: { contains: searchLower } },
        { phone: { contains: searchLower } },
        { email: { contains: searchLower } },
      ];
    }

    // Get total count and data in parallel
    const [total, leads] = await Promise.all([
      this.prisma.customerLead.count({ where }),
      this.prisma.customerLead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { leads, total, page, limit };
  }

  /**
   * Update a lead with status history tracking
   * @throws LeadsServiceError if lead not found
   */
  async updateLead(
    id: string,
    input: UpdateLeadInput,
    changedBy?: string
  ): Promise<CustomerLead> {
    // Get current lead to check status change
    const currentLead = await this.prisma.customerLead.findUnique({ where: { id } });

    if (!currentLead) {
      throw new LeadsServiceError('NOT_FOUND', 'Lead not found', 404);
    }

    // Prepare update data
    const updateData: Prisma.CustomerLeadUpdateInput = {};

    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    // Handle status change with history tracking
    if (input.status && input.status !== currentLead.status) {
      updateData.status = input.status;

      // Parse existing history or create new array
      let history: StatusHistoryEntry[] = [];
      if (currentLead.statusHistory) {
        try {
          history = JSON.parse(currentLead.statusHistory) as StatusHistoryEntry[];
        } catch {
          history = [];
        }
      }

      // Add new entry
      const newEntry: StatusHistoryEntry = {
        from: currentLead.status,
        to: input.status,
        changedAt: new Date().toISOString(),
        changedBy,
      };
      history.push(newEntry);

      updateData.statusHistory = JSON.stringify(history);
    }

    return this.prisma.customerLead.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete a lead by ID
   * @throws LeadsServiceError if lead not found
   */
  async deleteLead(id: string): Promise<void> {
    const lead = await this.prisma.customerLead.findUnique({ where: { id } });

    if (!lead) {
      throw new LeadsServiceError('NOT_FOUND', 'Lead not found', 404);
    }

    await this.prisma.customerLead.delete({ where: { id } });
  }

  // ============================================
  // MANUAL MERGE OPERATIONS
  // ============================================

  /**
   * Validate leads for manual merge operation
   * 
   * **Feature: lead-duplicate-management**
   * **Requirements: 6.1, 6.2**
   * 
   * Validates:
   * - All leads exist
   * - All leads have same source
   * - Primary lead is not already merged
   * - Secondary leads are not already merged
   * - Cannot merge lead with itself
   * 
   * @param input - Merge input with primary and secondary lead IDs
   * @throws LeadsServiceError if validation fails
   */
  async validateMergeLeads(input: MergeLeadsInput): Promise<{
    primaryLead: CustomerLead;
    secondaryLeads: CustomerLead[];
  }> {
    const { primaryLeadId, secondaryLeadIds } = input;

    // Validate: Cannot merge lead with itself
    if (secondaryLeadIds.includes(primaryLeadId)) {
      throw new LeadsServiceError(
        'MERGE_SELF',
        'Không thể merge lead với chính nó',
        400
      );
    }

    // Validate: Must have at least one secondary lead
    if (secondaryLeadIds.length === 0) {
      throw new LeadsServiceError(
        'MERGE_NO_SECONDARY',
        'Phải có ít nhất một lead phụ để merge',
        400
      );
    }

    // Get primary lead
    const primaryLead = await this.prisma.customerLead.findUnique({
      where: { id: primaryLeadId },
    });

    if (!primaryLead) {
      throw new LeadsServiceError(
        'MERGE_LEAD_NOT_FOUND',
        'Lead chính không tồn tại',
        404
      );
    }

    // Validate: Primary lead is not already merged (Requirements 6.2)
    if (primaryLead.mergedIntoId) {
      throw new LeadsServiceError(
        'MERGE_ALREADY_MERGED',
        'Lead chính đã được merge trước đó',
        400
      );
    }

    // Get secondary leads
    const secondaryLeads = await this.prisma.customerLead.findMany({
      where: { id: { in: secondaryLeadIds } },
    });

    // Validate: All secondary leads exist
    if (secondaryLeads.length !== secondaryLeadIds.length) {
      const foundIds = secondaryLeads.map((l) => l.id);
      const missingIds = secondaryLeadIds.filter((id) => !foundIds.includes(id));
      throw new LeadsServiceError(
        'MERGE_LEAD_NOT_FOUND',
        `Lead không tồn tại: ${missingIds.join(', ')}`,
        404
      );
    }

    // Validate: All secondary leads are not already merged (Requirements 6.2)
    const alreadyMergedLeads = secondaryLeads.filter((l) => l.mergedIntoId);
    if (alreadyMergedLeads.length > 0) {
      throw new LeadsServiceError(
        'MERGE_ALREADY_MERGED',
        `Lead đã được merge trước đó: ${alreadyMergedLeads.map((l) => l.id).join(', ')}`,
        400
      );
    }

    // Validate: All leads have same source (Requirements 6.1)
    const allLeads = [primaryLead, ...secondaryLeads];
    const sources = new Set(allLeads.map((l) => l.source));
    if (sources.size > 1) {
      throw new LeadsServiceError(
        'MERGE_DIFFERENT_SOURCE',
        'Không thể merge leads từ nguồn khác nhau',
        400
      );
    }

    return { primaryLead, secondaryLeads };
  }

  /**
   * Manually merge leads (Admin/Manager only)
   * 
   * **Feature: lead-duplicate-management**
   * **Requirements: 6.3, 6.4, 6.5**
   * 
   * Merge behavior:
   * - Append content from secondary leads to primary with timestamps
   * - Sum up submissionCount
   * - Set mergedIntoId and mergedAt on secondary leads (soft-delete)
   * - Update potentialDuplicateIds
   * 
   * @param input - Merge input with primary and secondary lead IDs
   * @returns Merged primary lead and count of merged leads
   * @throws LeadsServiceError if validation fails
   */
  async mergeLeads(input: MergeLeadsInput): Promise<MergeLeadsResult> {
    // Step 1: Validate merge operation
    const { primaryLead, secondaryLeads } = await this.validateMergeLeads(input);

    // Step 2: Build merged content with timestamps (Requirements 6.3)
    let mergedContent = primaryLead.content;
    let totalSubmissionCount = primaryLead.submissionCount;

    // Sort secondary leads by createdAt for chronological order
    const sortedSecondaryLeads = [...secondaryLeads].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    for (const secondaryLead of sortedSecondaryLeads) {
      const timestamp = secondaryLead.createdAt.toISOString();
      const separator = `\n\n--- Merged from Lead ${secondaryLead.id} (${timestamp}) ---\n\n`;
      mergedContent += separator + secondaryLead.content;
      totalSubmissionCount += secondaryLead.submissionCount; // Sum up counts (Requirements 6.4)
    }

    // Step 3: Execute merge in transaction
    const mergedAt = new Date();
    const secondaryLeadIds = secondaryLeads.map((l) => l.id);

    const result = await this.prisma.$transaction(async (tx) => {
      // Update primary lead with merged content
      const updatedPrimaryLead = await tx.customerLead.update({
        where: { id: primaryLead.id },
        data: {
          content: mergedContent,
          submissionCount: totalSubmissionCount,
          // Clear potential duplicate status since we've merged
          isPotentialDuplicate: false,
          potentialDuplicateIds: null,
        },
      });

      // Soft-delete secondary leads (Requirements 6.5)
      await tx.customerLead.updateMany({
        where: { id: { in: secondaryLeadIds } },
        data: {
          mergedIntoId: primaryLead.id,
          mergedAt,
        },
      });

      // Update potentialDuplicateIds on remaining leads with same phone+source
      // Remove merged lead IDs from their potentialDuplicateIds
      if (primaryLead.normalizedPhone) {
        const remainingLeads = await tx.customerLead.findMany({
          where: {
            normalizedPhone: primaryLead.normalizedPhone,
            source: primaryLead.source,
            mergedIntoId: null,
            id: { not: primaryLead.id },
          },
          select: { id: true, potentialDuplicateIds: true },
        });

        for (const lead of remainingLeads) {
          if (lead.potentialDuplicateIds) {
            try {
              const ids = JSON.parse(lead.potentialDuplicateIds) as string[];
              const filteredIds = ids.filter((id) => !secondaryLeadIds.includes(id));
              await tx.customerLead.update({
                where: { id: lead.id },
                data: {
                  potentialDuplicateIds: filteredIds.length > 0 ? JSON.stringify(filteredIds) : null,
                  isPotentialDuplicate: filteredIds.length > 0,
                },
              });
            } catch {
              // Invalid JSON, clear it
              await tx.customerLead.update({
                where: { id: lead.id },
                data: {
                  potentialDuplicateIds: null,
                  isPotentialDuplicate: false,
                },
              });
            }
          }
        }
      }

      return updatedPrimaryLead;
    });

    return {
      primaryLead: result,
      mergedCount: secondaryLeads.length,
    };
  }

  /**
   * Get lead by ID with redirect info if merged
   * 
   * **Feature: lead-duplicate-management**
   * **Requirements: 6.6**
   * 
   * @param id - Lead ID
   * @returns Lead with redirect info if merged
   * @throws LeadsServiceError if lead not found
   */
  async getLeadWithMergeInfo(id: string): Promise<{
    lead: CustomerLead;
    isMerged: boolean;
    mergedIntoId?: string;
  }> {
    const lead = await this.prisma.customerLead.findUnique({ where: { id } });

    if (!lead) {
      throw new LeadsServiceError('NOT_FOUND', 'Lead not found', 404);
    }

    return {
      lead,
      isMerged: !!lead.mergedIntoId,
      mergedIntoId: lead.mergedIntoId || undefined,
    };
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Get dashboard statistics for leads
   * Excludes merged leads from calculations (Requirements 7.1, 7.2)
   */
  async getStats(): Promise<LeadsStatsResult> {
    // Get all non-merged leads for stats
    const leads = await this.prisma.customerLead.findMany({
      where: {
        mergedIntoId: null, // Exclude merged leads
      },
      select: { status: true, source: true, createdAt: true, submissionCount: true },
    });

    // Daily leads for last 30 days
    const dailyLeadsMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyLeadsMap.set(dateStr, 0);
    }

    leads.forEach((lead) => {
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
    leads.forEach((lead) => {
      byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
    });

    // Source distribution
    const bySource: Record<string, number> = {};
    leads.forEach((lead) => {
      bySource[lead.source] = (bySource[lead.source] || 0) + 1;
    });

    // Conversion rate: CONVERTED / (total - CANCELLED)
    const totalNonCancelled = leads.filter((l) => l.status !== 'CANCELLED').length;
    const converted = byStatus['CONVERTED'] || 0;
    const conversionRate =
      totalNonCancelled > 0
        ? Math.round((converted / totalNonCancelled) * 100 * 100) / 100
        : 0;

    // Calculate duplicate submissions blocked (sum of submissionCount - 1)
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
    // Build where clause
    const where: Prisma.CustomerLeadWhereInput = {};

    if (params?.status) {
      where.status = params.status;
    }

    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      where.OR = [
        { name: { contains: searchLower } },
        { phone: { contains: searchLower } },
        { email: { contains: searchLower } },
      ];
    }

    const leads = await this.prisma.customerLead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Generate CSV
    const headers = ['name', 'phone', 'email', 'content', 'status', 'source', 'createdAt'];
    const csvRows = [headers.join(',')];

    leads.forEach((lead) => {
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
}
