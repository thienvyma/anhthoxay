import DOMPurify, { Config } from 'dompurify';
import type { BlockProps } from '../types';

// Configure DOMPurify for paragraph content
const DOMPURIFY_CONFIG: Config = {
  ALLOWED_TAGS: ['br', 'strong', 'em', 'b', 'i', 'u', 'a', 'span'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class'],
};

export function ParagraphBlock({ block, textAlign, isDark }: BlockProps) {
  const { data: blockData } = block;
  const blockAlign = (blockData.align as string) || textAlign;
  const backgroundColor = blockData.backgroundColor as string | undefined;
  const defaultTextColor = isDark ? 'rgba(255,255,255,0.85)' : '#374151';
  const textColor = (blockData.textColor as string) || defaultTextColor;

  const sanitizedHtml = DOMPurify.sanitize(
    (blockData.text as string) || '',
    DOMPURIFY_CONFIG
  );

  return (
    <p
      key={block.id}
      style={{
        marginBottom: isDark ? 8 : 12,
        color: textColor,
        backgroundColor: backgroundColor || undefined,
        padding: backgroundColor ? '12px 16px' : undefined,
        borderRadius: backgroundColor ? 8 : undefined,
        textAlign: blockAlign as 'left' | 'center' | 'right',
      }}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
