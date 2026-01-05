import type { Block } from './types';

/**
 * Parse content to determine if it's JSON blocks or markdown/html
 */
export function parseContent(content: string): { isBlocks: boolean; blocks: Block[] } {
  if (!content) return { isBlocks: false, blocks: [] };
  
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return { isBlocks: true, blocks: parsed };
    }
  } catch {
    // Not JSON, treat as markdown/html
  }
  
  return { isBlocks: false, blocks: [] };
}

/**
 * Get max width value from setting
 */
export function getMaxWidth(setting?: string): string {
  const maxWidthMap: Record<string, string> = {
    narrow: '700px',
    default: '900px',
    wide: '1100px',
    full: '100%',
  };
  return maxWidthMap[setting || 'wide'] || '1100px';
}

/**
 * Get padding value from setting
 */
export function getPadding(setting?: string): string {
  const paddingMap: Record<string, string> = {
    none: '24px',
    small: '32px 40px',
    normal: '48px 40px',
    large: '64px 48px',
  };
  return paddingMap[setting || 'normal'] || '48px 40px';
}

/**
 * Get vertical padding value from setting
 */
export function getVerticalPadding(setting?: string): string {
  const verticalPaddingMap: Record<string, string> = {
    small: '40px',
    medium: '80px',
    large: '120px',
  };
  return verticalPaddingMap[setting || 'medium'] || '80px';
}
