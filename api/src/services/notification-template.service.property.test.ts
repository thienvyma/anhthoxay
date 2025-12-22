/**
 * Property-Based Tests for Notification Template Service
 *
 * **Feature: bidding-phase4-communication**
 * **Property 11: Template Variable Replacement**
 */

import * as fc from 'fast-check';
import { describe, it, expect } from 'vitest';

// ============================================
// Business Logic (isolated for testing)
// ============================================

/**
 * Replace template variables with actual values
 * Requirements: 17.3 - Replace variables with actual values
 *
 * @param template - Template string with {{variable}} placeholders
 * @param variables - Variables to replace
 * @returns String with variables replaced
 */
function replaceVariables(
  template: string,
  variables: Record<string, string | number | boolean>
): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    // Replace {{variable}} pattern
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    // Escape $ in replacement string to prevent special replacement patterns
    // In JavaScript's String.replace(), $$ becomes $, $& inserts matched substring, etc.
    const safeValue = String(value).replace(/\$/g, '$$$$');
    result = result.replace(pattern, safeValue);
  }

  return result;
}

/**
 * Extract all variable placeholders from a template
 * @param template - Template string with {{variable}} placeholders
 * @returns Array of variable names found in template
 */
function extractVariables(template: string): string[] {
  const pattern = /\{\{(\w+)\}\}/g;
  const matches: string[] = [];
  let match;
  while ((match = pattern.exec(template)) !== null) {
    if (!matches.includes(match[1])) {
      matches.push(match[1]);
    }
  }
  return matches;
}

/**
 * Check if all variables in template are replaced
 * @param rendered - Rendered template string
 * @returns true if no unreplaced variables remain
 */
function hasNoUnreplacedVariables(rendered: string): boolean {
  const pattern = /\{\{\w+\}\}/;
  return !pattern.test(rendered);
}

// ============================================
// Generators
// ============================================

// Generate valid variable names (alphanumeric, starting with letter)
const variableName = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9_]{0,19}$/);

// Generate variable values (string, number, or boolean)
const variableValue = fc.oneof(
  fc.string({ minLength: 0, maxLength: 100 }),
  fc.integer({ min: -1000000, max: 1000000 }),
  fc.boolean()
);

// Generate a template with placeholders
const templateWithVariables = fc.tuple(
  fc.array(variableName, { minLength: 1, maxLength: 5 }),
  fc.string({ minLength: 0, maxLength: 200 })
).map(([vars, text]) => {
  // Create a template by inserting variables into text
  const uniqueVars = [...new Set(vars)];
  let template = text;
  for (const v of uniqueVars) {
    template += ` {{${v}}}`;
  }
  return { template, variables: uniqueVars };
});

// Generate variables record from variable names
const variablesRecord = (varNames: string[]) =>
  fc.record(
    Object.fromEntries(varNames.map((name) => [name, variableValue]))
  ) as fc.Arbitrary<Record<string, string | number | boolean>>;

// ============================================
// PROPERTY 11: Template Variable Replacement
// Requirements: 17.3
// ============================================

describe('Property 11: Template Variable Replacement', () => {
  /**
   * **Feature: bidding-phase4-communication, Property 11: Template Variable Replacement**
   * **Validates: Requirements 17.3**
   */

  it('should replace all provided variables with their values', () => {
    fc.assert(
      fc.property(
        templateWithVariables.chain(({ template, variables }) =>
          variablesRecord(variables).map((vars) => ({
            template,
            variableNames: variables,
            variableValues: vars,
          }))
        ),
        ({ template, variableNames, variableValues }) => {
          const rendered = replaceVariables(template, variableValues);

          // All provided variables should be replaced
          for (const varName of variableNames) {
            const placeholder = `{{${varName}}}`;
            const expectedValue = String(variableValues[varName]);

            // The placeholder should not exist in rendered output
            expect(rendered).not.toContain(placeholder);

            // The value should exist in rendered output
            expect(rendered).toContain(expectedValue);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should leave template unchanged when no variables provided', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 500 }).filter(
          (s) => !s.includes('{{') && !s.includes('}}')
        ),
        (template) => {
          const rendered = replaceVariables(template, {});
          return rendered === template;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should replace multiple occurrences of the same variable', () => {
    fc.assert(
      fc.property(
        variableName,
        // Use non-empty, non-whitespace values to properly count occurrences
        // Filter out separator character to avoid counting issues
        fc.oneof(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0 && !s.includes('|')),
          fc.integer({ min: -1000000, max: 1000000 }),
          fc.boolean()
        ),
        fc.integer({ min: 2, max: 5 }),
        (varName, varValue, count) => {
          // Create template with multiple occurrences using a non-space separator
          const template = Array(count).fill(`{{${varName}}}`).join('|');
          const variables = { [varName]: varValue };

          const rendered = replaceVariables(template, variables);
          const expectedValue = String(varValue);

          // Count occurrences of the value in rendered output
          const valueOccurrences = rendered.split(expectedValue).length - 1;

          // Should have replaced all occurrences
          return (
            valueOccurrences === count &&
            !rendered.includes(`{{${varName}}}`)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve non-variable text in template', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(
          (s) => !s.includes('{{') && !s.includes('}}')
        ),
        variableName,
        variableValue,
        (staticText, varName, varValue) => {
          const template = `${staticText} {{${varName}}} ${staticText}`;
          const variables = { [varName]: varValue };

          const rendered = replaceVariables(template, variables);

          // Static text should be preserved
          const expectedValue = String(varValue);
          const expected = `${staticText} ${expectedValue} ${staticText}`;

          return rendered === expected;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty variable values', () => {
    fc.assert(
      fc.property(variableName, (varName) => {
        const template = `Hello {{${varName}}}!`;
        const variables = { [varName]: '' };

        const rendered = replaceVariables(template, variables);

        return rendered === 'Hello !' && !rendered.includes(`{{${varName}}}`);
      }),
      { numRuns: 100 }
    );
  });

  it('should convert number values to strings', () => {
    fc.assert(
      fc.property(
        variableName,
        fc.integer({ min: -1000000, max: 1000000 }),
        (varName, numValue) => {
          const template = `Value: {{${varName}}}`;
          const variables = { [varName]: numValue };

          const rendered = replaceVariables(template, variables);

          return (
            rendered === `Value: ${numValue}` &&
            !rendered.includes(`{{${varName}}}`)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should convert boolean values to strings', () => {
    fc.assert(
      fc.property(variableName, fc.boolean(), (varName, boolValue) => {
        const template = `Status: {{${varName}}}`;
        const variables = { [varName]: boolValue };

        const rendered = replaceVariables(template, variables);

        return (
          rendered === `Status: ${boolValue}` &&
          !rendered.includes(`{{${varName}}}`)
        );
      }),
      { numRuns: 100 }
    );
  });

  it('should leave unreplaced variables when not provided', () => {
    fc.assert(
      fc.property(
        variableName,
        variableName, // Different variable
        variableValue,
        (varName1, varName2, value) => {
          // Ensure different variable names
          if (varName1 === varName2) return true;

          const template = `{{${varName1}}} and {{${varName2}}}`;
          const variables = { [varName1]: value };

          const rendered = replaceVariables(template, variables);

          // varName1 should be replaced, varName2 should remain
          return (
            !rendered.includes(`{{${varName1}}}`) &&
            rendered.includes(`{{${varName2}}}`) &&
            rendered.includes(String(value))
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle Vietnamese content correctly', () => {
    fc.assert(
      fc.property(variableName, variableValue, (varName, value) => {
        // Vietnamese template content
        const template = `Xin chào {{${varName}}}, cảm ơn bạn đã sử dụng dịch vụ!`;
        const variables = { [varName]: value };

        const rendered = replaceVariables(template, variables);

        // Should contain Vietnamese text and replaced value
        return (
          rendered.includes('Xin chào') &&
          rendered.includes('cảm ơn bạn') &&
          rendered.includes(String(value)) &&
          !rendered.includes(`{{${varName}}}`)
        );
      }),
      { numRuns: 100 }
    );
  });

  it('should handle HTML content in templates', () => {
    fc.assert(
      fc.property(variableName, variableValue, (varName, value) => {
        const template = `<p>Hello <strong>{{${varName}}}</strong></p>`;
        const variables = { [varName]: value };

        const rendered = replaceVariables(template, variables);

        // HTML structure should be preserved
        return (
          rendered.includes('<p>') &&
          rendered.includes('</p>') &&
          rendered.includes('<strong>') &&
          rendered.includes('</strong>') &&
          rendered.includes(String(value)) &&
          !rendered.includes(`{{${varName}}}`)
        );
      }),
      { numRuns: 100 }
    );
  });

  it('should extract all variables from template correctly', () => {
    fc.assert(
      fc.property(
        fc.array(variableName, { minLength: 1, maxLength: 5 }),
        (varNames) => {
          const uniqueVars = [...new Set(varNames)];
          const template = uniqueVars.map((v) => `{{${v}}}`).join(' ');

          const extracted = extractVariables(template);

          // All unique variables should be extracted
          return (
            extracted.length === uniqueVars.length &&
            uniqueVars.every((v) => extracted.includes(v))
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should result in no unreplaced variables when all are provided', () => {
    fc.assert(
      fc.property(
        templateWithVariables.chain(({ template, variables }) =>
          variablesRecord(variables).map((vars) => ({
            template,
            variableNames: variables,
            variableValues: vars,
          }))
        ),
        ({ template, variableValues }) => {
          const rendered = replaceVariables(template, variableValues);
          return hasNoUnreplacedVariables(rendered);
        }
      ),
      { numRuns: 100 }
    );
  });
});
