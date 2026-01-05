import { tokens } from '@app/shared';

/**
 * Get CSS styles for RichTextSection
 */
export function getStyles(): string {
  return `
    .rich-text-content h1,
    .rich-text-content h2,
    .rich-text-content h3,
    .rich-text-content h4 {
      font-family: 'Playfair Display', serif;
      color: ${tokens.color.primary};
      font-weight: 700;
      margin-top: 32px;
      margin-bottom: 16px;
      line-height: 1.3;
    }

    .rich-text-content h1 { font-size: clamp(32px, 5vw, 42px); }
    .rich-text-content h2 { font-size: clamp(26px, 4vw, 32px); }
    .rich-text-content h3 { font-size: clamp(20px, 3vw, 24px); }
    .rich-text-content h4 { font-size: 18px; }

    .rich-text-content h1:first-child,
    .rich-text-content h2:first-child,
    .rich-text-content h3:first-child,
    .rich-text-content h4:first-child {
      margin-top: 0;
    }

    .rich-text-content p {
      margin-bottom: 20px;
      line-height: 1.8;
    }

    .rich-text-content p:last-child {
      margin-bottom: 0;
    }

    .rich-text-centered h1,
    .rich-text-centered h2,
    .rich-text-centered h3,
    .rich-text-centered h4,
    .rich-text-centered p {
      text-align: center;
    }

    .rich-text-content ul,
    .rich-text-content ol {
      margin: 20px 0;
      padding-left: 24px;
    }

    .rich-text-content li {
      margin-bottom: 12px;
      line-height: 1.7;
    }

    .rich-text-content li strong {
      color: ${tokens.color.primary};
      font-weight: 600;
    }

    .rich-text-content a {
      color: ${tokens.color.primary};
      text-decoration: none;
      border-bottom: 1px solid rgba(245, 211, 147, 0.3);
      transition: all 0.3s ease;
    }

    .rich-text-content a:hover {
      border-bottom-color: ${tokens.color.primary};
    }

    .rich-text-content blockquote {
      padding-left: 0;
      margin: 24px 0;
      font-style: italic;
      color: rgba(255,255,255,0.7);
    }

    .rich-text-content blockquote footer {
      margin-top: 12px;
      font-size: 14px;
      color: rgba(255,255,255,0.5);
      font-style: normal;
    }

    .rich-text-content code {
      background: rgba(0,0,0,0.3);
      padding: 2px 8px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      color: ${tokens.color.primary};
    }

    .rich-text-content pre {
      background: rgba(0,0,0,0.5);
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 24px 0;
    }

    .rich-text-content pre code {
      background: none;
      padding: 0;
    }

    .rich-text-content img {
      max-width: 100%;
      height: auto;
    }

    .rich-text-content figure {
      margin: 32px 0;
    }

    .rich-text-content figure img {
      width: 100%;
      height: auto;
      display: block;
    }

    .rich-text-content figcaption {
      text-align: center;
      font-size: 14px;
      color: rgba(255,255,255,0.6);
      margin-top: 12px;
    }

    .rich-text-content hr {
      border: none;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(245, 211, 147, 0.3), transparent);
      margin: 40px 0;
    }

    @media (max-width: 768px) {
      .rich-text-content h1 { font-size: 28px; }
      .rich-text-content h2 { font-size: 24px; }
      .rich-text-content h3 { font-size: 20px; }
      .rich-text-content h4 { font-size: 16px; }
      
      .rich-text-split-grid {
        grid-template-columns: 1fr !important;
      }
    }
  `;
}
