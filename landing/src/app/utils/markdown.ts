import { defaultSchema } from 'rehype-sanitize';

/**
 * Custom sanitization schema for blog content
 * 
 * Security considerations:
 * - Only whitelist safe tags
 * - Only allow safe attributes (no style, no event handlers)
 * - Only allow safe protocols (http, https, mailto)
 * - Strip dangerous tags completely (script, iframe, embed, etc.)
 * 
 * @see https://github.com/rehypejs/rehype-sanitize
 */
export const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Text content
    'p', 'br', 'hr',
    // Links and media
    'a', 'img',
    // Lists
    'ul', 'ol', 'li',
    // Formatting
    'blockquote', 'code', 'pre', 'strong', 'em', 'b', 'i', 'u', 's', 'del', 'ins',
    // Tables
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
    // Other safe elements
    'div', 'span', 'figure', 'figcaption',
  ],
  attributes: {
    ...defaultSchema.attributes,
    // Links: allow href, title, target, rel (for noopener)
    a: ['href', 'title', 'target', 'rel'],
    // Images: allow src, alt, title, dimensions - NO style attribute
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    // Code: allow className for syntax highlighting
    code: ['className'],
    // Pre: allow className for syntax highlighting
    pre: ['className'],
    // Tables: allow basic attributes
    th: ['scope', 'colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
    // Global: only className allowed, NO style attribute
    '*': ['className', 'id'],
  },
  protocols: {
    // Only allow safe protocols for links
    href: ['http', 'https', 'mailto'],
    // Only allow safe protocols for images (relative URLs handled separately)
    src: ['http', 'https'],
  },
  // Completely remove these dangerous tags (not just strip attributes)
  strip: [
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
    'option',
    'noscript',
    'meta',
    'link',
    'base',
    'applet',
    'frame',
    'frameset',
  ],
};

export default sanitizeSchema;
