import type { Block } from './types';

export const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

// Convert markdown to blocks
export function markdownToBlocks(md: string): Block[] {
  const lines = md.split('\n');
  const result: Block[] = [];
  let currentParagraph = '';

  for (const line of lines) {
    if (line.startsWith('# ')) {
      if (currentParagraph) {
        result.push({ id: generateId(), type: 'paragraph', data: { text: currentParagraph.trim() } });
        currentParagraph = '';
      }
      result.push({ id: generateId(), type: 'heading', data: { text: line.slice(2), level: 1 } });
    } else if (line.startsWith('## ')) {
      if (currentParagraph) {
        result.push({ id: generateId(), type: 'paragraph', data: { text: currentParagraph.trim() } });
        currentParagraph = '';
      }
      result.push({ id: generateId(), type: 'heading', data: { text: line.slice(3), level: 2 } });
    } else if (line.startsWith('### ')) {
      if (currentParagraph) {
        result.push({ id: generateId(), type: 'paragraph', data: { text: currentParagraph.trim() } });
        currentParagraph = '';
      }
      result.push({ id: generateId(), type: 'heading', data: { text: line.slice(4), level: 3 } });
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (currentParagraph) {
        result.push({ id: generateId(), type: 'paragraph', data: { text: currentParagraph.trim() } });
        currentParagraph = '';
      }
      result.push({ id: generateId(), type: 'list', data: { items: [line.slice(2)], ordered: false } });
    } else if (line.startsWith('> ')) {
      if (currentParagraph) {
        result.push({ id: generateId(), type: 'paragraph', data: { text: currentParagraph.trim() } });
        currentParagraph = '';
      }
      result.push({ id: generateId(), type: 'quote', data: { text: line.slice(2), author: '' } });
    } else if (line.trim() === '---') {
      if (currentParagraph) {
        result.push({ id: generateId(), type: 'paragraph', data: { text: currentParagraph.trim() } });
        currentParagraph = '';
      }
      result.push({ id: generateId(), type: 'divider', data: { style: 'solid' } });
    } else if (line.trim()) {
      currentParagraph += (currentParagraph ? '\n' : '') + line;
    } else if (currentParagraph) {
      result.push({ id: generateId(), type: 'paragraph', data: { text: currentParagraph.trim() } });
      currentParagraph = '';
    }
  }

  if (currentParagraph) {
    result.push({ id: generateId(), type: 'paragraph', data: { text: currentParagraph.trim() } });
  }

  return result.length > 0 ? result : [{ id: generateId(), type: 'paragraph', data: { text: '' } }];
}

// Parse value (JSON blocks or convert from markdown)
export function parseValue(val: string): Block[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    return markdownToBlocks(val);
  }
  return [];
}
