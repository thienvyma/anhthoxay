import DOMPurify, { Config } from 'dompurify';
import type { Block } from '../types';

// Configure DOMPurify for paragraph content
const DOMPURIFY_CONFIG: Config = {
  ALLOWED_TAGS: ['br', 'strong', 'em', 'b', 'i', 'u', 'a', 'span'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class'],
};

interface ParagraphBlockProps {
  block: Block;
  textAlign: string;
}

export function ParagraphBlock({ block, textAlign }: ParagraphBlockProps) {
  const { data } = block;
  const blockAlign = (data.align as string) || textAlign;
  const paragraphText = (data.text as string) || '';
  const paragraphAlign = (blockAlign as 'left' | 'center' | 'right') || 'left';
  const backgroundColor = data.backgroundColor as string | undefined;
  const textColor = data.textColor as string | undefined;

  const sanitizedHtml = DOMPurify.sanitize(paragraphText, DOMPURIFY_CONFIG);
  
  return (
    <p 
      key={block.id} 
      style={{ 
        textAlign: paragraphAlign,
        backgroundColor: backgroundColor || undefined,
        color: textColor || undefined,
        padding: backgroundColor ? '16px 20px' : undefined,
        borderRadius: backgroundColor ? 8 : undefined,
        margin: backgroundColor ? '20px 0' : undefined,
      }}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
