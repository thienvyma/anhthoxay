/**
 * Property Test: Service-Test File Pairing
 * **Feature: codebase-hardening, Property 7: Property Test Coverage**
 * **Validates: Requirements 7.1**
 * 
 * This test verifies that service files with business logic have corresponding
 * property test files to ensure correctness is verified.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// PROPERTY 7: Property Test Coverage
// **Feature: codebase-hardening, Property 7: Property Test Coverage**
// **Validates: Requirements 7.1**
// ============================================

/**
 * Services that are expected to have property tests (core business logic services)
 * These are services from Bidding Phase 1-6 that contain critical business logic
 * 
 * NOTE: Some services have been refactored into folders (chat/, review/, match/, scheduled-notification/)
 * These refactored services are tested via their original test files which import from the folder's index.ts
 */
const CORE_BUSINESS_SERVICES = [
  // Phase 2: Core Bidding
  'project.service.ts',
  'bid.service.ts',
  // Phase 3: Matching & Payment
  'escrow.service.ts',
  'fee.service.ts',
  'notification.service.ts',
  // Phase 5: Review & Ranking
  'ranking.service.ts',
  'badge.service.ts',
  'review-reminder.service.ts',
  // Auth - REFACTORED to auth/ folder (removed from flat list)
  // 'auth.service.ts', // Now in REFACTORED_SERVICES
  // Phase 4: Communication (notification-channel, notification-template)
  'notification-channel.service.ts',
  'notification-template.service.ts',
];

/**
 * Services that have been refactored into folders
 * These have property test files at root level that import from folder's index.ts
 */
const REFACTORED_SERVICES = [
  { folder: 'chat', testFile: 'chat.service.property.test.ts' },
  { folder: 'match', testFile: 'match.service.property.test.ts' },
  { folder: 'scheduled-notification', testFile: 'scheduled-notification.service.property.test.ts' },
];

/**
 * Services with tests in subfolders (not following standard naming)
 * These have multiple test files inside their folder
 */
const SERVICES_WITH_SUBFOLDER_TESTS = [
  { service: 'auth.service.ts', folder: 'auth', testFiles: ['login.property.test.ts', 'token.property.test.ts', 'session.property.test.ts'] },
  { service: 'review', folder: 'review', testFiles: ['crud.property.test.ts', 'response.property.test.ts', 'stats.property.test.ts'] },
];

/**
 * Services that are utility/helper services and don't require property tests
 * These typically don't contain complex business logic that needs property-based verification
 * 
 * NOTE: chat.service.ts, review.service.ts, match.service.ts, scheduled-notification.service.ts
 * have been refactored into folders and are no longer in this list
 * 
 * NOTE: auth.service.ts has property tests in auth/ folder (login, token, session tests)
 */
const UTILITY_SERVICES = [
  'activity.service.ts',
  'auth.service.ts', // Tests are in auth/ folder (login, token, session property tests)
  'badge-job.service.ts',
  'bidding-settings.service.ts',
  'contractor.service.ts',
  'dispute.service.ts',
  'google-sheets.service.ts',
  'leads.service.ts',
  'media.service.ts',
  'milestone.service.ts',
  'pages.service.ts',
  'pricing.service.ts',
  'quote.service.ts',
  'ranking-job.service.ts',
  'region.service.ts',
  'report.service.ts',
  'saved-project.service.ts',
  'service-fee.service.ts',
  'unsubscribe.service.ts',
  'users.service.ts',
];

/**
 * Get all service files from the services directory (flat files only, not folders)
 */
function getServiceFiles(): string[] {
  const servicesDir = path.join(__dirname);
  const files = fs.readdirSync(servicesDir);
  return files.filter(f => {
    const fullPath = path.join(servicesDir, f);
    const isFile = fs.statSync(fullPath).isFile();
    return isFile && 
      f.endsWith('.service.ts') && 
      !f.includes('.property.test.') &&
      !f.includes('.test.');
  });
}

/**
 * Get all property test files from the services directory
 * Excludes meta-test files that test the testing infrastructure itself
 */
function getPropertyTestFiles(): string[] {
  const servicesDir = path.join(__dirname);
  const files = fs.readdirSync(servicesDir);
  return files.filter(f => 
    f.endsWith('.property.test.ts') && 
    // Exclude meta-test files (tests about tests)
    !f.includes('service-test-pairing')
  );
}

/**
 * Check if a service file has a corresponding property test file
 */
function hasPropertyTest(serviceFile: string): boolean {
  const testFile = serviceFile.replace('.service.ts', '.service.property.test.ts');
  const servicesDir = path.join(__dirname);
  return fs.existsSync(path.join(servicesDir, testFile));
}

/**
 * Get the expected property test file name for a service
 */
function getExpectedTestFileName(serviceFile: string): string {
  return serviceFile.replace('.service.ts', '.service.property.test.ts');
}

describe('Property 7: Property Test Coverage', () => {
  describe('Core Business Services Property Test Pairing', () => {
    it('*For any* core business service file, there should be a corresponding .property.test.ts file', () => {
      const serviceFiles = getServiceFiles();
      const coreServices = serviceFiles.filter(f => CORE_BUSINESS_SERVICES.includes(f));
      
      const missingTests: string[] = [];
      
      for (const service of coreServices) {
        if (!hasPropertyTest(service)) {
          missingTests.push(service);
        }
      }
      
      expect(missingTests).toEqual([]);
    });

    it('*For any* core business service, the property test file should follow naming convention', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...CORE_BUSINESS_SERVICES),
          (serviceFile) => {
            const expectedTestFile = getExpectedTestFileName(serviceFile);
            // Test file name should follow pattern: {name}.service.property.test.ts
            expect(expectedTestFile).toMatch(/^[a-z-]+\.service\.property\.test\.ts$/);
            return true;
          }
        ),
        { numRuns: CORE_BUSINESS_SERVICES.length }
      );
    });

    it('all core business services should be accounted for in the test', () => {
      const serviceFiles = getServiceFiles();
      const coreServices = serviceFiles.filter(f => CORE_BUSINESS_SERVICES.includes(f));
      
      // All expected core services should exist
      expect(coreServices.length).toBeGreaterThan(0);
      
      // Each core service should have a property test
      for (const service of coreServices) {
        expect(hasPropertyTest(service)).toBe(true);
      }
    });
  });

  describe('Property Test File Structure', () => {
    it('*For any* property test file, it should be co-located with its service file', () => {
      const propertyTestFiles = getPropertyTestFiles();
      const servicesDir = path.join(__dirname);
      
      // Get list of refactored service test files
      const refactoredTestFiles = REFACTORED_SERVICES.map(s => s.testFile);
      
      for (const testFile of propertyTestFiles) {
        // Skip refactored services - they have folders instead of single files
        if (refactoredTestFiles.includes(testFile)) {
          // Verify the folder exists instead
          const folderName = REFACTORED_SERVICES.find(s => s.testFile === testFile)?.folder;
          if (folderName) {
            const folderExists = fs.existsSync(path.join(servicesDir, folderName));
            expect(folderExists).toBe(true);
          }
          continue;
        }
        
        const serviceFile = testFile.replace('.property.test.ts', '.ts');
        const serviceExists = fs.existsSync(path.join(servicesDir, serviceFile));
        
        expect(serviceExists).toBe(true);
      }
    });

    it('*For any* property test file, it should follow the naming convention *.service.property.test.ts', () => {
      const propertyTestFiles = getPropertyTestFiles();
      
      fc.assert(
        fc.property(
          fc.constantFrom(...propertyTestFiles),
          (testFile) => {
            expect(testFile).toMatch(/^[a-z-]+\.service\.property\.test\.ts$/);
            return true;
          }
        ),
        { numRuns: Math.max(1, propertyTestFiles.length) }
      );
    });
  });

  describe('Service Classification', () => {
    it('*For any* service file, it should be classified as either core or utility', () => {
      const serviceFiles = getServiceFiles();
      const allClassified = [...CORE_BUSINESS_SERVICES, ...UTILITY_SERVICES];
      
      const unclassified = serviceFiles.filter(f => !allClassified.includes(f));
      
      // All service files should be classified
      // If this fails, a new service was added and needs to be classified
      expect(unclassified).toEqual([]);
    });

    it('core and utility service lists should not overlap', () => {
      const overlap = CORE_BUSINESS_SERVICES.filter(s => UTILITY_SERVICES.includes(s));
      expect(overlap).toEqual([]);
    });

    it('*For any* utility service, property test is optional but not required', () => {
      // This test documents that utility services don't require property tests
      // but they may have them if needed
      const utilityServices = getServiceFiles().filter(f => UTILITY_SERVICES.includes(f));
      
      // Just verify the classification exists
      expect(utilityServices.length).toBeGreaterThan(0);
    });
  });

  describe('Coverage Statistics', () => {
    it('should report property test coverage for core services', () => {
      const serviceFiles = getServiceFiles();
      const coreServices = serviceFiles.filter(f => CORE_BUSINESS_SERVICES.includes(f));
      const testedServices = coreServices.filter(f => hasPropertyTest(f));
      
      const coverage = (testedServices.length / coreServices.length) * 100;
      
      // Coverage should be 100% for core services
      expect(coverage).toBe(100);
    });

    it('should have at least 10 core business services with property tests', () => {
      const serviceFiles = getServiceFiles();
      const coreServices = serviceFiles.filter(f => CORE_BUSINESS_SERVICES.includes(f));
      const testedServices = coreServices.filter(f => hasPropertyTest(f));
      
      // We expect at least 10 core services to have property tests
      // (10 flat services in CORE_BUSINESS_SERVICES)
      expect(testedServices.length).toBeGreaterThanOrEqual(10);
    });

    it('should have property tests for all refactored services', () => {
      const servicesDir = path.join(__dirname);
      
      for (const refactored of REFACTORED_SERVICES) {
        // Check folder exists
        const folderExists = fs.existsSync(path.join(servicesDir, refactored.folder));
        expect(folderExists).toBe(true);
        
        // Check test file exists
        const testExists = fs.existsSync(path.join(servicesDir, refactored.testFile));
        expect(testExists).toBe(true);
      }
    });

    it('should have property tests for services with subfolder tests', () => {
      const servicesDir = path.join(__dirname);
      
      for (const service of SERVICES_WITH_SUBFOLDER_TESTS) {
        // Check folder exists
        const folderExists = fs.existsSync(path.join(servicesDir, service.folder));
        expect(folderExists).toBe(true);
        
        // Check at least one test file exists
        const hasTests = service.testFiles.some(testFile => 
          fs.existsSync(path.join(servicesDir, service.folder, testFile))
        );
        expect(hasTests).toBe(true);
      }
    });

    it('total core services with property tests should be at least 15', () => {
      const serviceFiles = getServiceFiles();
      const coreServices = serviceFiles.filter(f => CORE_BUSINESS_SERVICES.includes(f));
      const testedServices = coreServices.filter(f => hasPropertyTest(f));
      
      // Total = flat services (10) + refactored services (4) + subfolder tests (1) = 15
      const totalTested = testedServices.length + REFACTORED_SERVICES.length + SERVICES_WITH_SUBFOLDER_TESTS.length;
      
      expect(totalTested).toBeGreaterThanOrEqual(15);
    });
  });

  describe('Property Test Content Validation', () => {
    it('*For any* property test file, it should contain at least one describe block', () => {
      const propertyTestFiles = getPropertyTestFiles();
      const servicesDir = path.join(__dirname);
      
      for (const testFile of propertyTestFiles) {
        const content = fs.readFileSync(path.join(servicesDir, testFile), 'utf-8');
        expect(content).toContain('describe(');
      }
    });

    it('*For any* property test file, it should import fast-check for property-based testing', () => {
      const propertyTestFiles = getPropertyTestFiles();
      const servicesDir = path.join(__dirname);
      
      for (const testFile of propertyTestFiles) {
        const content = fs.readFileSync(path.join(servicesDir, testFile), 'utf-8');
        // Should import fast-check (either as fc or fast-check)
        const hasFastCheck = content.includes("from 'fast-check'") || 
                            content.includes('from "fast-check"') ||
                            content.includes("import * as fc");
        expect(hasFastCheck).toBe(true);
      }
    });

    it('*For any* property test file, it should contain property annotations', () => {
      const propertyTestFiles = getPropertyTestFiles();
      const servicesDir = path.join(__dirname);
      
      for (const testFile of propertyTestFiles) {
        const content = fs.readFileSync(path.join(servicesDir, testFile), 'utf-8');
        // Should contain property documentation (Property X or *For any*)
        const hasPropertyAnnotation = content.includes('Property') || 
                                      content.includes('*For any*') ||
                                      content.includes('Validates:');
        expect(hasPropertyAnnotation).toBe(true);
      }
    });
  });
});
