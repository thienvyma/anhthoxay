/**
 * Property-Based Tests for SectionEditor File Size Constraints
 *
 * **Feature: admin-code-refactor, Property 2 & 3: Form and Preview file size constraints**
 * Tests that form and preview files stay under their specified line limits
 * **Validates: Requirements 3.5, 4.4**
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Helper function to count lines in a file
 */
function countLines(filePath: string): number {
  const absolutePath = path.resolve(__dirname, filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }
  const content = fs.readFileSync(absolutePath, 'utf-8');
  return content.split('\n').length;
}

/**
 * Helper function to get all .tsx files in a directory
 */
function getTsxFiles(dirPath: string): string[] {
  const absolutePath = path.resolve(__dirname, dirPath);
  if (!fs.existsSync(absolutePath)) {
    return [];
  }

  return fs
    .readdirSync(absolutePath)
    .filter((file) => file.endsWith('.tsx') && file !== 'index.tsx');
}

/**
 * **Feature: admin-code-refactor, Property 2: Form file size constraints**
 * **Validates: Requirements 3.5**
 */
describe('Property 2: Form file size constraints', () => {
  const formsDir = './forms';
  const formFiles = getTsxFiles(formsDir);

  it('should have form files extracted', () => {
    expect(formFiles.length).toBeGreaterThan(0);
  });

  it('each form file should be under 200 lines', () => {
    const results: { file: string; lines: number; pass: boolean }[] = [];

    for (const file of formFiles) {
      const lines = countLines(path.join(formsDir, file));
      results.push({
        file,
        lines,
        pass: lines < 200,
      });
    }

    const failures = results.filter((r) => !r.pass);
    if (failures.length > 0) {
      console.log('Files exceeding 200 lines:');
      failures.forEach((f) => console.log(`  ${f.file}: ${f.lines} lines`));
    }

    expect(failures.length).toBe(0);
  });

  it('forms/index.tsx should export renderFormFields function', () => {
    const indexPath = path.resolve(__dirname, './forms/index.tsx');
    expect(fs.existsSync(indexPath)).toBe(true);

    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).toContain('renderFormFields');
  });

  it('should have shared form components', () => {
    const sharedDir = path.resolve(__dirname, './forms/shared');
    expect(fs.existsSync(sharedDir)).toBe(true);

    const expectedShared = [
      'InfoBanner.tsx',
      'ImageSection.tsx',
      'ArraySection.tsx',
      'CTASection.tsx',
      'ButtonSection.tsx',
    ];

    for (const component of expectedShared) {
      const componentPath = path.join(sharedDir, component);
      expect(fs.existsSync(componentPath)).toBe(true);
    }
  });
});

/**
 * **Feature: admin-code-refactor, Property 3: Preview file size constraints**
 * **Validates: Requirements 4.4**
 */
describe('Property 3: Preview file size constraints', () => {
  const previewsDir = './previews';
  const previewFiles = getTsxFiles(previewsDir);

  it('should have preview files extracted', () => {
    expect(previewFiles.length).toBeGreaterThan(0);
  });

  it('each preview file should be under 150 lines', () => {
    const results: { file: string; lines: number; pass: boolean }[] = [];

    for (const file of previewFiles) {
      const lines = countLines(path.join(previewsDir, file));
      results.push({
        file,
        lines,
        pass: lines < 150,
      });
    }

    const failures = results.filter((r) => !r.pass);
    if (failures.length > 0) {
      console.log('Files exceeding 150 lines:');
      failures.forEach((f) => console.log(`  ${f.file}: ${f.lines} lines`));
    }

    expect(failures.length).toBe(0);
  });

  it('previews/index.tsx should export renderPreview function', () => {
    const indexPath = path.resolve(__dirname, './previews/index.tsx');
    expect(fs.existsSync(indexPath)).toBe(true);

    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).toContain('renderPreview');
  });
});
