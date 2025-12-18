/**
 * Property-Based Tests for Markdown Sanitization
 * **Feature: codebase-hardening, Property 2 & 3: Markdown Sanitization**
 * **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**
 */

import * as fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { sanitizeSchema } from './markdown';

// Helper function to sanitize HTML
async function sanitizeHtml(html: string): Promise<string> {
  const result = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeStringify)
    .process(html);
  return String(result);
}

// ============================================
// PROPERTY 2: Markdown Sanitization Removes Dangerous Content
// Requirements: 3.2, 3.3, 3.4, 3.5, 3.7
// ============================================

describe('Property 2: Markdown Sanitization Removes Dangerous Content', () => {
  // Dangerous tags that should be completely removed
  const DANGEROUS_TAGS = [
    'script',
    'style',
    'iframe',
    'embed',
    'object',
    'form',
    'input',
    'button',
    'textarea',
    'select',
  ];

  // Dangerous attributes that should be removed
  const DANGEROUS_ATTRS = [
    'onclick',
    'onerror',
    'onload',
    'onmouseover',
    'onfocus',
    'onblur',
  ];

  it('should remove all script tags', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 100 }),
        async (content) => {
          const html = `<script>${content}</script>`;
          const sanitized = await sanitizeHtml(html);
          
          // Should not contain script tag
          expect(sanitized).not.toContain('<script');
          expect(sanitized).not.toContain('</script>');
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should remove all dangerous tags', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...DANGEROUS_TAGS),
        fc.string({ minLength: 0, maxLength: 50 }),
        async (tag, content) => {
          const html = `<${tag}>${content}</${tag}>`;
          const sanitized = await sanitizeHtml(html);
          
          // Should not contain the dangerous tag
          expect(sanitized.toLowerCase()).not.toContain(`<${tag}`);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should remove event handler attributes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...DANGEROUS_ATTRS),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (attr, value) => {
          const html = `<div ${attr}="${value}">content</div>`;
          const sanitized = await sanitizeHtml(html);
          
          // Should not contain the event handler
          expect(sanitized.toLowerCase()).not.toContain(attr.toLowerCase());
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should remove javascript: URLs from href', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 50 }),
        async (code) => {
          const html = `<a href="javascript:${code}">link</a>`;
          const sanitized = await sanitizeHtml(html);
          
          // Should not contain javascript: protocol
          expect(sanitized.toLowerCase()).not.toContain('javascript:');
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should remove style attributes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (styleValue) => {
          const html = `<div style="${styleValue}">content</div>`;
          const sanitized = await sanitizeHtml(html);
          
          // Should not contain style attribute
          expect(sanitized).not.toContain('style=');
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should remove nested dangerous content', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 30 }),
        async (content) => {
          const html = `<div><p><script>${content}</script></p></div>`;
          const sanitized = await sanitizeHtml(html);
          
          expect(sanitized).not.toContain('<script');
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ============================================
// PROPERTY 3: Markdown Sanitization Preserves Safe Content
// Requirements: 3.6
// ============================================

describe('Property 3: Markdown Sanitization Preserves Safe Content', () => {
  // Generate safe alphanumeric content (no special chars that get encoded)
  const safeContent = fc.stringMatching(/^[a-zA-Z0-9 ]+$/, { minLength: 1, maxLength: 50 });

  it('should preserve safe heading tags', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('h1', 'h2', 'h3', 'h4', 'h5', 'h6'),
        safeContent,
        async (tag, content) => {
          const html = `<${tag}>${content}</${tag}>`;
          const sanitized = await sanitizeHtml(html);
          
          // Should contain the tag structure
          expect(sanitized).toContain(`<${tag}>`);
          expect(sanitized).toContain(`</${tag}>`);
          // Should preserve alphanumeric content
          expect(sanitized).toContain(content);
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve paragraph and text formatting tags', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('p', 'strong', 'em', 'code'),
        safeContent,
        async (tag, content) => {
          const html = `<${tag}>${content}</${tag}>`;
          const sanitized = await sanitizeHtml(html);
          
          expect(sanitized).toContain(`<${tag}>`);
          expect(sanitized).toContain(content);
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve safe links with http/https', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('http', 'https'),
        fc.webUrl(),
        safeContent,
        async (protocol, url, text) => {
          const safeUrl = url.replace(/^https?:/, `${protocol}:`);
          const html = `<a href="${safeUrl}">${text}</a>`;
          const sanitized = await sanitizeHtml(html);
          
          // Should preserve the link structure
          expect(sanitized).toContain('<a');
          expect(sanitized).toContain('href=');
          expect(sanitized).toContain(text);
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve images with safe src', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl(),
        fc.stringMatching(/^[a-zA-Z0-9 ]+$/, { minLength: 1, maxLength: 30 }),
        async (url, alt) => {
          const html = `<img src="${url}" alt="${alt}">`;
          const sanitized = await sanitizeHtml(html);
          
          // Should preserve the image structure
          expect(sanitized).toContain('<img');
          expect(sanitized).toContain('src=');
          expect(sanitized).toContain(`alt="${alt}"`);
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve list structures', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('ul', 'ol'),
        fc.array(safeContent, { minLength: 1, maxLength: 5 }),
        async (listType, items) => {
          const listItems = items.map(item => `<li>${item}</li>`).join('');
          const html = `<${listType}>${listItems}</${listType}>`;
          const sanitized = await sanitizeHtml(html);
          
          // Should preserve list structure
          expect(sanitized).toContain(`<${listType}>`);
          expect(sanitized).toContain('<li>');
          items.forEach(item => {
            expect(sanitized).toContain(item);
          });
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve blockquotes', async () => {
    await fc.assert(
      fc.asyncProperty(
        safeContent,
        async (content) => {
          const html = `<blockquote>${content}</blockquote>`;
          const sanitized = await sanitizeHtml(html);
          
          expect(sanitized).toContain('<blockquote>');
          expect(sanitized).toContain(content);
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve code blocks with className', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('language-javascript', 'language-typescript', 'language-python'),
        safeContent,
        async (className, code) => {
          const html = `<pre><code class="${className}">${code}</code></pre>`;
          const sanitized = await sanitizeHtml(html);
          
          expect(sanitized).toContain('<pre>');
          expect(sanitized).toContain('<code');
          expect(sanitized).toContain(code);
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
