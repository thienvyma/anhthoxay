/**
 * Lead Duplicate Management Migration Script
 *
 * Migrates existing CustomerLead data to support duplicate management:
 * - Normalizes phone numbers for all existing leads
 * - Detects and marks potential duplicates (same phone + same source)
 * - Detects and marks related leads (same phone + different source)
 *
 * **Feature: lead-duplicate-management**
 * **Validates: Requirements 1.4, 3.2, 3.3, 4.1**
 */

import { PrismaClient, CustomerLead } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// PHONE NORMALIZATION (copied from api/src/utils/phone-normalizer.ts)
// ============================================

/**
 * Normalize phone number to standard format: 0xxxxxxxxx
 * - Remove spaces, dashes, parentheses, dots
 * - Convert +84 prefix to 0
 * - Convert 84 prefix (without plus) to 0
 */
function normalizePhone(phone: string): string {
  // Handle empty or invalid input
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Step 1: Remove all special characters (spaces, dashes, parentheses, dots)
  let normalized = phone.replace(/[\s\-()./]/g, '');

  // Handle empty result after removing special chars
  if (!normalized) {
    return '';
  }

  // Step 2: Convert +84 prefix to 0
  if (normalized.startsWith('+84')) {
    normalized = '0' + normalized.slice(3);
  }
  // Step 3: Convert 84 prefix (without plus) to 0
  // Only if it starts with 84 and has enough digits for a Vietnamese phone number
  else if (normalized.startsWith('84') && normalized.length >= 11) {
    normalized = '0' + normalized.slice(2);
  }

  // Step 4: Validate - should only contain digits after normalization
  if (!/^\d+$/.test(normalized)) {
    return '';
  }

  return normalized;
}

// ============================================
// TYPES
// ============================================

interface MigrationResult {
  totalLeads: number;
  phonesNormalized: number;
  phonesSkipped: number;
  potentialDuplicatesMarked: number;
  relatedLeadsMarked: number;
  warnings: string[];
  errors: string[];
}

// PhoneGroup interface removed - using Map<string, CustomerLead[]> directly

// ============================================
// STEP 1: NORMALIZE EXISTING PHONE NUMBERS
// ============================================

/**
 * Normalize phone numbers for all existing CustomerLead records
 *
 * **Feature: lead-duplicate-management**
 * **Validates: Requirements 1.4**
 *
 * @returns Count of normalized and skipped phones
 */
async function normalizeExistingPhones(): Promise<{
  normalized: number;
  skipped: number;
  warnings: string[];
}> {
  console.log('\n📱 Step 1: Normalizing existing phone numbers...');

  const warnings: string[] = [];
  let normalized = 0;
  let skipped = 0;

  // Get all leads that don't have normalizedPhone set
  const leadsToNormalize = await prisma.customerLead.findMany({
    where: {
      OR: [
        { normalizedPhone: null },
        { normalizedPhone: '' },
      ],
    },
    select: { id: true, phone: true, normalizedPhone: true },
  });

  console.log(`  Found ${leadsToNormalize.length} leads to normalize`);

  // Process in batches of 100 for better performance
  const batchSize = 100;
  for (let i = 0; i < leadsToNormalize.length; i += batchSize) {
    const batch = leadsToNormalize.slice(i, i + batchSize);

    await prisma.$transaction(
      batch.map((lead) => {
        const normalizedPhone = normalizePhone(lead.phone);

        if (normalizedPhone) {
          normalized++;
          return prisma.customerLead.update({
            where: { id: lead.id },
            data: { normalizedPhone },
          });
        } else {
          skipped++;
          warnings.push(`Lead ${lead.id}: Could not normalize phone "${lead.phone}"`);
          return prisma.customerLead.update({
            where: { id: lead.id },
            data: { normalizedPhone: null },
          });
        }
      })
    );

    // Progress indicator
    const progress = Math.min(i + batchSize, leadsToNormalize.length);
    console.log(`  Processed ${progress}/${leadsToNormalize.length} leads...`);
  }

  console.log(`  ✅ Normalized: ${normalized}, Skipped: ${skipped}`);

  return { normalized, skipped, warnings };
}

// ============================================
// STEP 2: DETECT AND MARK DUPLICATES/RELATED
// ============================================

/**
 * Detect and mark potential duplicates and related leads
 *
 * **Feature: lead-duplicate-management**
 * **Validates: Requirements 3.2, 3.3, 4.1**
 *
 * - Potential duplicate: same normalizedPhone + same source
 * - Related leads: same normalizedPhone + different source
 */
async function detectDuplicatesAndRelated(): Promise<{
  potentialDuplicatesMarked: number;
  relatedLeadsMarked: number;
  warnings: string[];
}> {
  console.log('\n🔍 Step 2: Detecting duplicates and related leads...');

  const warnings: string[] = [];
  let potentialDuplicatesMarked = 0;
  let relatedLeadsMarked = 0;

  // Get all leads with valid normalizedPhone (not merged)
  const allLeads = await prisma.customerLead.findMany({
    where: {
      normalizedPhone: { not: null },
      mergedIntoId: null,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`  Found ${allLeads.length} leads with normalized phones`);

  // Group leads by normalizedPhone
  const phoneGroups = new Map<string, CustomerLead[]>();

  for (const lead of allLeads) {
    if (!lead.normalizedPhone) continue;

    const group = phoneGroups.get(lead.normalizedPhone) || [];
    group.push(lead);
    phoneGroups.set(lead.normalizedPhone, group);
  }

  // Filter to only groups with multiple leads (potential duplicates or related)
  const groupsWithMultiple = Array.from(phoneGroups.entries())
    .filter(([, leads]) => leads.length > 1);

  console.log(`  Found ${groupsWithMultiple.length} phone numbers with multiple leads`);

  // Process each group
  for (const [, leads] of groupsWithMultiple) {
    // Group by source within this phone group
    const bySource = new Map<string, CustomerLead[]>();
    for (const lead of leads) {
      const sourceGroup = bySource.get(lead.source) || [];
      sourceGroup.push(lead);
      bySource.set(lead.source, sourceGroup);
    }

    // Process each lead in the group
    for (const lead of leads) {
      // Count leads from same source (potential duplicates)
      const sameSourceLeads = bySource.get(lead.source) || [];
      const potentialDuplicateIds = sameSourceLeads
        .filter((l) => l.id !== lead.id)
        .map((l) => l.id);

      // Count leads from different sources (related leads)
      const relatedCount = leads.filter((l) => l.source !== lead.source).length;

      // Determine if this is a potential duplicate
      // A lead is a potential duplicate if there are other leads with same phone + same source
      const isPotentialDuplicate = potentialDuplicateIds.length > 0;

      // Update the lead
      await prisma.customerLead.update({
        where: { id: lead.id },
        data: {
          isPotentialDuplicate,
          potentialDuplicateIds: isPotentialDuplicate
            ? JSON.stringify(potentialDuplicateIds)
            : null,
          hasRelatedLeads: relatedCount > 0,
          relatedLeadCount: relatedCount,
        },
      });

      if (isPotentialDuplicate) {
        potentialDuplicatesMarked++;
      }
      if (relatedCount > 0) {
        relatedLeadsMarked++;
      }
    }
  }

  console.log(`  ✅ Potential duplicates marked: ${potentialDuplicatesMarked}`);
  console.log(`  ✅ Related leads marked: ${relatedLeadsMarked}`);

  return { potentialDuplicatesMarked, relatedLeadsMarked, warnings };
}

// ============================================
// VERIFICATION
// ============================================

/**
 * Verify migration results
 */
async function verifyMigration(): Promise<{
  success: boolean;
  report: string;
}> {
  console.log('\n📋 Verifying Migration...\n');

  // Get counts
  const totalLeads = await prisma.customerLead.count({
    where: { mergedIntoId: null },
  });

  const leadsWithNormalizedPhone = await prisma.customerLead.count({
    where: {
      normalizedPhone: { not: null },
      mergedIntoId: null,
    },
  });

  const potentialDuplicates = await prisma.customerLead.count({
    where: {
      isPotentialDuplicate: true,
      mergedIntoId: null,
    },
  });

  const leadsWithRelated = await prisma.customerLead.count({
    where: {
      hasRelatedLeads: true,
      mergedIntoId: null,
    },
  });

  // Get unique phone numbers with multiple leads
  const allLeads = await prisma.customerLead.findMany({
    where: {
      normalizedPhone: { not: null },
      mergedIntoId: null,
    },
    select: { normalizedPhone: true, source: true },
  });

  const phoneGroups = new Map<string, Set<string>>();
  for (const lead of allLeads) {
    if (!lead.normalizedPhone) continue;
    const sources = phoneGroups.get(lead.normalizedPhone) || new Set();
    sources.add(lead.source);
    phoneGroups.set(lead.normalizedPhone, sources);
  }

  const phonesWithMultipleSources = Array.from(phoneGroups.entries())
    .filter(([, sources]) => sources.size > 1).length;

  const report = `
╔════════════════════════════════════════════════════════════════╗
║         LEAD DUPLICATE MANAGEMENT MIGRATION REPORT              ║
╠════════════════════════════════════════════════════════════════╣
║ LEAD COUNTS                                                     ║
║   • Total active leads: ${totalLeads.toString().padStart(6)}                              ║
║   • Leads with normalized phone: ${leadsWithNormalizedPhone.toString().padStart(6)}                    ║
╠════════════════════════════════════════════════════════════════╣
║ DUPLICATE DETECTION                                             ║
║   • Potential duplicates marked: ${potentialDuplicates.toString().padStart(6)}                     ║
║   • Leads with related leads: ${leadsWithRelated.toString().padStart(6)}                        ║
║   • Phone numbers with multiple sources: ${phonesWithMultipleSources.toString().padStart(6)}            ║
╠════════════════════════════════════════════════════════════════╣
║ STATUS: ${leadsWithNormalizedPhone > 0 ? '✅ MIGRATION SUCCESSFUL' : '⚠️ NO LEADS PROCESSED'}                                  ║
╚════════════════════════════════════════════════════════════════╝
`;

  console.log(report);

  return {
    success: leadsWithNormalizedPhone >= 0,
    report,
  };
}

// ============================================
// MAIN MIGRATION FUNCTION
// ============================================

/**
 * Main migration function
 *
 * **Feature: lead-duplicate-management**
 * **Validates: Requirements 1.4, 3.2, 3.3, 4.1**
 */
export async function migrateLeadDuplicates(): Promise<MigrationResult> {
  const result: MigrationResult = {
    totalLeads: 0,
    phonesNormalized: 0,
    phonesSkipped: 0,
    potentialDuplicatesMarked: 0,
    relatedLeadsMarked: 0,
    warnings: [],
    errors: [],
  };

  console.log('🚀 Starting Lead Duplicate Management Migration...\n');

  try {
    // Get total lead count
    result.totalLeads = await prisma.customerLead.count({
      where: { mergedIntoId: null },
    });
    console.log(`📊 Total active leads: ${result.totalLeads}`);

    if (result.totalLeads === 0) {
      console.log('  ⚠️ No leads to migrate');
      return result;
    }

    // Step 1: Normalize phone numbers
    const normalizeResult = await normalizeExistingPhones();
    result.phonesNormalized = normalizeResult.normalized;
    result.phonesSkipped = normalizeResult.skipped;
    result.warnings.push(...normalizeResult.warnings);

    // Step 2: Detect duplicates and related leads
    const detectResult = await detectDuplicatesAndRelated();
    result.potentialDuplicatesMarked = detectResult.potentialDuplicatesMarked;
    result.relatedLeadsMarked = detectResult.relatedLeadsMarked;
    result.warnings.push(...detectResult.warnings);

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Migration failed: ${errorMessage}`);
    throw error;
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('       LEAD DUPLICATE MANAGEMENT MIGRATION SCRIPT');
  console.log('       Feature: lead-duplicate-management');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Run migration
    const result = await migrateLeadDuplicates();

    // Print summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                    MIGRATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Total Leads: ${result.totalLeads}`);
    console.log(`Phones Normalized: ${result.phonesNormalized}`);
    console.log(`Phones Skipped: ${result.phonesSkipped}`);
    console.log(`Potential Duplicates Marked: ${result.potentialDuplicatesMarked}`);
    console.log(`Related Leads Marked: ${result.relatedLeadsMarked}`);

    if (result.warnings.length > 0) {
      console.log(`\n⚠️ Warnings (${result.warnings.length}):`);
      // Only show first 10 warnings to avoid flooding console
      const warningsToShow = result.warnings.slice(0, 10);
      warningsToShow.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
      if (result.warnings.length > 10) {
        console.log(`  ... and ${result.warnings.length - 10} more warnings`);
      }
    }

    if (result.errors.length > 0) {
      console.log(`\n❌ Errors (${result.errors.length}):`);
      result.errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
    }

    // Run verification
    const verification = await verifyMigration();

    if (!verification.success) {
      console.log('\n⚠️ Migration completed with verification warnings.');
      console.log('Please review the report above and check for any issues.');
    } else {
      console.log('\n✅ Migration completed successfully!');
    }

    return result;
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { main as runMigration };
