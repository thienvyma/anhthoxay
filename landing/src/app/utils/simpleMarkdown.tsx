/**
 * Lightweight markdown-to-HTML parser for simple content
 * Supports: bold, italic, links, headings, lists, line breaks
 * ~2KB vs react-markdown's 80KB!
 */

interface ParseOptions {
  sanitize?: boolean;
}

export function parseSimpleMarkdown(markdown: string, options: ParseOptions = {}): string {
  if (!markdown) return '';
  
  let html = markdown;
  
  // Escape HTML if sanitize enabled
  if (options.sanitize) {
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  // Headers (must come before bold/italic to avoid conflicts)
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Bold: **text** or __text__
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  
  // Italic: *text* or _text_
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');
  
  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Lists: - item or * item
  html = html.replace(/^[*-] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  
  // Line breaks: double newline = paragraph
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';
  
  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>\s*<\/p>/g, '');
  
  // Clean up nested tags
  html = html.replace(/<p>(<h[1-6]>)/g, '$1');
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)<\/p>/g, '$1');
  
  return html;
}

/**
 * Component for rendering simple markdown
 * Drop-in replacement for <ReactMarkdown> for simple content
 */
export function SimpleMarkdown({ children }: { children: string }) {
  const html = parseSimpleMarkdown(children, { sanitize: true });
  
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: html }}
      style={{
        // Preserve markdown-like styling
        lineHeight: 1.7,
      }}
    />
  );
}

