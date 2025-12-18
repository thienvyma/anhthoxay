/**
 * Leads Service Module
 *
 * Handles business logic for customer leads including CRUD operations,
 * statistics calculation, and CSV export. Separates data access and
 * business logic from HTTP handling.
 *
 * **Feature: api-refactoring**
 * **Requirements: 2.1, 2.2, 2.3**
 */

import { PrismaClient, Prisma, CustomerLead } from '@prisma/client';

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
  source: 'QUOTE_FORM' | 'CONTACT_FORM';
  quoteData?: string;
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
 */
export interface LeadsQueryParams {
  search?: string;
  status?: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CANCELLED';
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
// LEADS SERVICE CLASS
// ============================================

export class LeadsService {
  constructor(private prisma: PrismaClient) {}

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Create a new customer lead
   */
  async createLead(input: CreateLeadInput): Promise<CustomerLead> {
    return this.prisma.customerLead.create({
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        content: input.content,
        source: input.source,
        quoteData: input.quoteData,
      },
    });
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
   * Get leads with search, filter, and pagination
   */
  async getLeads(params: LeadsQueryParams): Promise<PaginatedLeadsResult> {
    const { search, status, page, limit } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.CustomerLeadWhereInput = {};

    if (status) {
      where.status = status;
    }

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
  // STATISTICS
  // ============================================

  /**
   * Get dashboard statistics for leads
   */
  async getStats(): Promise<LeadsStatsResult> {
    // Get all leads for stats
    const leads = await this.prisma.customerLead.findMany({
      select: { status: true, source: true, createdAt: true },
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

    return {
      dailyLeads,
      byStatus,
      bySource,
      conversionRate,
      totalLeads: leads.length,
      newLeads: byStatus['NEW'] || 0,
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
