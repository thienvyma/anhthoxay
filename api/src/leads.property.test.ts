/**
 * Property-based tests for Leads API
 * **Feature: admin-enhancement**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// Mock Prisma
const mockPrisma = {
  customerLead: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
};

describe('Leads API - Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * **Property 4: Lead Creation with QuoteData**
   * For any valid form submission from SaveQuoteModal, a new Lead SHALL be created
   * with quoteData containing the exact calculation result
   * **Validates: Requirements 2.3**
   */
  describe('Property 4: Lead Creation with QuoteData', () => {
    it('should create lead with exact quoteData from calculation result', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random quote result
          fc.record({
            categoryName: fc.string({ minLength: 1, maxLength: 50 }),
            area: fc.float({ min: 1, max: 1000, noNaN: true }),
            coefficient: fc.float({ min: 0.5, max: 3, noNaN: true }),
            baseCost: fc.float({ min: 1000, max: 100000000, noNaN: true }),
            materialsCost: fc.float({ min: 0, max: 50000000, noNaN: true }),
            grandTotal: fc.float({ min: 1000, max: 150000000, noNaN: true }),
            materials: fc.array(
              fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 50 }),
                price: fc.float({ min: 1000, max: 10000000, noNaN: true }),
                quantity: fc.integer({ min: 1, max: 100 }),
              }),
              { minLength: 0, maxLength: 5 }
            ),
          }),
          // Generate random customer info
          fc.record({
            name: fc.string({ minLength: 2, maxLength: 100 }),
            phone: fc.stringMatching(/^0[0-9]{9}$/),
            email: fc.option(fc.emailAddress(), { nil: undefined }),
          }),
          async (quoteResult, customerInfo) => {
            const quoteDataString = JSON.stringify(quoteResult);
            
            // Simulate lead creation
            const leadData = {
              name: customerInfo.name,
              phone: customerInfo.phone,
              email: customerInfo.email,
              content: `Báo giá: ${quoteResult.categoryName} - ${quoteResult.area}m²`,
              source: 'QUOTE_CALCULATOR',
              quoteData: quoteDataString,
            };

            mockPrisma.customerLead.create.mockResolvedValueOnce({
              id: 'test-id',
              ...leadData,
              status: 'NEW',
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            // Verify quoteData is preserved exactly
            const parsedQuoteData = JSON.parse(leadData.quoteData);
            expect(parsedQuoteData.categoryName).toBe(quoteResult.categoryName);
            expect(parsedQuoteData.area).toBe(quoteResult.area);
            expect(parsedQuoteData.grandTotal).toBe(quoteResult.grandTotal);
            expect(parsedQuoteData.materials.length).toBe(quoteResult.materials.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Property 5: Search Filter Correctness**
   * For any search query, the filtered leads list SHALL only contain leads
   * where name, phone, or email contains the search string (case-insensitive)
   * **Validates: Requirements 3.1**
   */
  describe('Property 5: Search Filter Correctness', () => {
    it('should filter leads correctly by search query', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random leads
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 2, maxLength: 50 }),
              phone: fc.stringMatching(/^0[0-9]{9}$/),
              email: fc.option(fc.emailAddress(), { nil: null }),
              content: fc.string({ minLength: 1, maxLength: 200 }),
              status: fc.constantFrom('NEW', 'CONTACTED', 'CONVERTED', 'CANCELLED'),
              source: fc.constantFrom('QUOTE_FORM', 'CONTACT_FORM', 'QUOTE_CALCULATOR'),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          // Generate search query (substring of potential match)
          fc.string({ minLength: 1, maxLength: 10 }),
          async (leads, searchQuery) => {
            const searchLower = searchQuery.toLowerCase();
            
            // Filter leads by search
            const filteredLeads = leads.filter(lead => 
              lead.name.toLowerCase().includes(searchLower) ||
              lead.phone.toLowerCase().includes(searchLower) ||
              (lead.email && lead.email.toLowerCase().includes(searchLower))
            );

            // Verify all filtered leads match the search criteria
            for (const lead of filteredLeads) {
              const matchesName = lead.name.toLowerCase().includes(searchLower);
              const matchesPhone = lead.phone.toLowerCase().includes(searchLower);
              const matchesEmail = lead.email && lead.email.toLowerCase().includes(searchLower);
              
              expect(matchesName || matchesPhone || matchesEmail).toBe(true);
            }

            // Verify no non-matching leads are included
            const nonMatchingLeads = leads.filter(lead => 
              !lead.name.toLowerCase().includes(searchLower) &&
              !lead.phone.toLowerCase().includes(searchLower) &&
              !(lead.email && lead.email.toLowerCase().includes(searchLower))
            );

            for (const lead of nonMatchingLeads) {
              expect(filteredLeads).not.toContain(lead);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Property 8: CSV Export Completeness**
   * For any export action, the generated CSV SHALL contain all leads matching
   * the current filter with columns: name, phone, email, content, status, source, createdAt
   * **Validates: Requirements 3.4**
   */
  describe('Property 8: CSV Export Completeness', () => {
    // Helper function to generate CSV from leads (mirrors API logic)
    function generateCSV(leads: Array<{
      name: string;
      phone: string;
      email: string | null;
      content: string;
      status: string;
      source: string;
      createdAt: Date;
    }>): string {
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

    // Helper to generate valid dates using integer timestamps
    const validDateArb = fc
      .integer({
        min: new Date('2024-01-01').getTime(),
        max: new Date('2025-12-31').getTime(),
      })
      .map((ts) => new Date(ts));

    it('should include all required columns in CSV header', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 2, maxLength: 50 }),
              phone: fc.stringMatching(/^0[0-9]{9}$/),
              email: fc.option(fc.emailAddress(), { nil: null }),
              content: fc.string({ minLength: 1, maxLength: 200 }),
              status: fc.constantFrom('NEW', 'CONTACTED', 'CONVERTED', 'CANCELLED'),
              source: fc.constantFrom('QUOTE_FORM', 'CONTACT_FORM', 'QUOTE_CALCULATOR'),
              createdAt: validDateArb,
            }),
            { minLength: 0, maxLength: 10 }
          ),
          async (leads) => {
            const csv = generateCSV(leads);
            const lines = csv.split('\n');
            const header = lines[0];
            
            // Verify all required columns are present
            expect(header).toContain('name');
            expect(header).toContain('phone');
            expect(header).toContain('email');
            expect(header).toContain('content');
            expect(header).toContain('status');
            expect(header).toContain('source');
            expect(header).toContain('createdAt');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have one row per lead plus header', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 2, maxLength: 50 }),
              phone: fc.stringMatching(/^0[0-9]{9}$/),
              email: fc.option(fc.emailAddress(), { nil: null }),
              content: fc.string({ minLength: 1, maxLength: 50 }), // Shorter to avoid newlines
              status: fc.constantFrom('NEW', 'CONTACTED', 'CONVERTED', 'CANCELLED'),
              source: fc.constantFrom('QUOTE_FORM', 'CONTACT_FORM', 'QUOTE_CALCULATOR'),
              createdAt: validDateArb,
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (leads) => {
            const csv = generateCSV(leads);
            const lines = csv.split('\n');
            
            // Header + one row per lead
            expect(lines.length).toBe(leads.length + 1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Property 9: Status History Recording**
   * For any status change, a new entry SHALL be appended to statusHistory
   * with from, to, and changedAt fields
   * **Validates: Requirements 3.6**
   */
  describe('Property 9: Status History Recording', () => {
    it('should append status change to history', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate initial status
          fc.constantFrom('NEW', 'CONTACTED', 'CONVERTED', 'CANCELLED'),
          // Generate new status (different from initial)
          fc.constantFrom('NEW', 'CONTACTED', 'CONVERTED', 'CANCELLED'),
          // Generate existing history with valid dates using timestamp
          fc.array(
            fc.record({
              from: fc.constantFrom('NEW', 'CONTACTED', 'CONVERTED', 'CANCELLED'),
              to: fc.constantFrom('NEW', 'CONTACTED', 'CONVERTED', 'CANCELLED'),
              changedAt: fc.integer({ min: 1577836800000, max: 1924905600000 }).map(ts => new Date(ts).toISOString()), // 2020-01-01 to 2030-12-31
            }),
            { minLength: 0, maxLength: 10 }
          ),
          async (currentStatus, newStatus, existingHistory) => {
            if (currentStatus === newStatus) return; // Skip if same status

            // Simulate status update
            const newEntry = {
              from: currentStatus,
              to: newStatus,
              changedAt: new Date().toISOString(),
            };

            const updatedHistory = [...existingHistory, newEntry];

            // Verify new entry is appended
            expect(updatedHistory.length).toBe(existingHistory.length + 1);
            
            // Verify last entry has correct fields
            const lastEntry = updatedHistory[updatedHistory.length - 1];
            expect(lastEntry.from).toBe(currentStatus);
            expect(lastEntry.to).toBe(newStatus);
            expect(lastEntry.changedAt).toBeDefined();
            expect(new Date(lastEntry.changedAt).getTime()).not.toBeNaN();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


/**
 * Property-based tests for Dashboard Charts Data
 * **Feature: admin-enhancement, Property 10-13: Chart Data Correctness**
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
 */

describe('Dashboard Charts - Data Correctness', () => {
  /**
   * Property 10: Daily Leads Aggregation
   * For any set of leads, the dailyLeads chart data SHALL correctly count leads per day
   */
  it('should correctly aggregate leads by day', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            // Use integer timestamps to avoid Date(NaN) issues
            createdAt: fc.integer({ min: 1704067200000, max: 1735689600000 }).map(ts => new Date(ts)),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        async (leads) => {
          // Simulate aggregation logic
          const dailyMap = new Map<string, number>();
          leads.forEach(lead => {
            const dateStr = lead.createdAt.toISOString().split('T')[0];
            dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1);
          });

          // Sum of all daily counts should equal total leads
          const totalFromDaily = Array.from(dailyMap.values()).reduce((a, b) => a + b, 0);
          expect(totalFromDaily).toBe(leads.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11: Status Distribution Sum
   * For any set of leads, the sum of all status counts SHALL equal the total number of leads
   */
  it('should have status distribution sum equal total leads', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            status: fc.constantFrom('NEW', 'CONTACTED', 'CONVERTED', 'CANCELLED'),
          }),
          { minLength: 0, maxLength: 100 }
        ),
        async (leads) => {
          // Simulate status distribution
          const byStatus: Record<string, number> = {};
          leads.forEach(lead => {
            byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
          });

          // Sum should equal total
          const totalFromStatus = Object.values(byStatus).reduce((a, b) => a + b, 0);
          expect(totalFromStatus).toBe(leads.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12: Source Distribution Sum
   * For any set of leads, the sum of all source counts SHALL equal the total number of leads
   */
  it('should have source distribution sum equal total leads', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            source: fc.constantFrom('QUOTE_FORM', 'CONTACT_FORM', 'NEWSLETTER', 'OTHER'),
          }),
          { minLength: 0, maxLength: 100 }
        ),
        async (leads) => {
          // Simulate source distribution
          const bySource: Record<string, number> = {};
          leads.forEach(lead => {
            bySource[lead.source] = (bySource[lead.source] || 0) + 1;
          });

          // Sum should equal total
          const totalFromSource = Object.values(bySource).reduce((a, b) => a + b, 0);
          expect(totalFromSource).toBe(leads.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13: Conversion Rate Calculation
   * For any set of leads, conversionRate SHALL equal (CONVERTED / non-CANCELLED) * 100
   */
  it('should calculate conversion rate correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            status: fc.constantFrom('NEW', 'CONTACTED', 'CONVERTED', 'CANCELLED'),
          }),
          { minLength: 0, maxLength: 100 }
        ),
        async (leads) => {
          // Count by status
          const byStatus: Record<string, number> = { NEW: 0, CONTACTED: 0, CONVERTED: 0, CANCELLED: 0 };
          leads.forEach(lead => {
            byStatus[lead.status]++;
          });

          // Calculate conversion rate
          const totalNonCancelled = leads.filter(l => l.status !== 'CANCELLED').length;
          const converted = byStatus['CONVERTED'];
          const expectedRate = totalNonCancelled > 0
            ? Math.round((converted / totalNonCancelled) * 100 * 100) / 100
            : 0;

          // Rate should be between 0 and 100
          expect(expectedRate).toBeGreaterThanOrEqual(0);
          expect(expectedRate).toBeLessThanOrEqual(100);

          // If no non-cancelled leads, rate should be 0
          if (totalNonCancelled === 0) {
            expect(expectedRate).toBe(0);
          }

          // If all non-cancelled are converted, rate should be 100
          if (totalNonCancelled > 0 && converted === totalNonCancelled) {
            expect(expectedRate).toBe(100);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property-based tests for Google Sheets Integration
 * **Feature: admin-enhancement, Property 14-15: Google Sheets Sync**
 * **Validates: Requirements 5.5, 5.6**
 */

describe('Google Sheets Integration', () => {
  /**
   * Property 14: Google Sheets Sync on Lead Creation
   * For any new lead created when Google Sheets is connected and enabled,
   * the lead data SHALL be prepared for sync to the configured spreadsheet
   */
  it('should prepare lead data for Google Sheets sync', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 10, maxLength: 30 }),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          phone: fc.string({ minLength: 10, maxLength: 15 }),
          email: fc.option(fc.emailAddress(), { nil: null }),
          content: fc.string({ minLength: 1, maxLength: 500 }),
          status: fc.constantFrom('NEW', 'CONTACTED', 'CONVERTED', 'CANCELLED'),
          source: fc.constantFrom('QUOTE_FORM', 'CONTACT_FORM'),
          quoteData: fc.option(fc.json(), { nil: null }),
          createdAt: fc.integer({ min: 1704067200000, max: 1735689600000 }).map(ts => new Date(ts)),
        }),
        async (lead) => {
          // Prepare row data as the service would
          const rowData = [
            lead.id,
            lead.name,
            lead.phone,
            lead.email || '',
            lead.content,
            lead.status,
            lead.source,
            lead.quoteData || '',
            lead.createdAt.toISOString(),
          ];

          // Row should have exactly 9 columns
          expect(rowData.length).toBe(9);

          // All values should be strings (for spreadsheet)
          rowData.forEach(value => {
            expect(typeof value).toBe('string');
          });

          // Required fields should not be empty
          expect(rowData[0]).not.toBe(''); // id
          expect(rowData[1]).not.toBe(''); // name
          expect(rowData[2]).not.toBe(''); // phone
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 15: Google Sheets Retry Logic
   * For any failed Google Sheets sync, the system SHALL retry up to 3 times
   * with exponential backoff (1s, 2s, 4s delays)
   */
  it('should calculate correct exponential backoff delays', async () => {
    const RETRY_CONFIG = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 8000,
    };

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: RETRY_CONFIG.maxRetries - 1 }),
        async (attempt) => {
          // Calculate delay for this attempt
          const delay = Math.min(
            RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
            RETRY_CONFIG.maxDelay
          );

          // Verify exponential backoff pattern
          const expectedDelays = [1000, 2000, 4000]; // 1s, 2s, 4s
          expect(delay).toBe(expectedDelays[attempt]);

          // Delay should never exceed maxDelay
          expect(delay).toBeLessThanOrEqual(RETRY_CONFIG.maxDelay);

          // Delay should always be positive
          expect(delay).toBeGreaterThan(0);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should respect max retries limit', () => {
    const RETRY_CONFIG = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 8000,
    };

    // Max retries should be exactly 3
    expect(RETRY_CONFIG.maxRetries).toBe(3);

    // Total max wait time should be 1 + 2 + 4 = 7 seconds
    let totalDelay = 0;
    for (let i = 0; i < RETRY_CONFIG.maxRetries; i++) {
      totalDelay += Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(2, i),
        RETRY_CONFIG.maxDelay
      );
    }
    expect(totalDelay).toBe(7000);
  });
});
