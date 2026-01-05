import type { BlockTemplate, BlockType } from './types';

// Block templates
export const BLOCK_TEMPLATES: BlockTemplate[] = [
  { type: 'heading', icon: 'ri-heading', label: 'Tiêu đề', description: 'Heading lớn hoặc nhỏ' },
  { type: 'paragraph', icon: 'ri-text', label: 'Đoạn văn', description: 'Văn bản thông thường' },
  { type: 'list', icon: 'ri-list-unordered', label: 'Danh sách', description: 'Bullet hoặc số' },
  { type: 'quote', icon: 'ri-double-quotes-l', label: 'Trích dẫn', description: 'Quote nổi bật' },
  { type: 'image', icon: 'ri-image-line', label: 'Hình ảnh', description: 'Ảnh với caption' },
  { type: 'callout', icon: 'ri-information-line', label: 'Callout', description: 'Hộp thông báo' },
  { type: 'divider', icon: 'ri-separator', label: 'Đường kẻ', description: 'Phân cách nội dung' },
  { type: 'columns', icon: 'ri-layout-column-line', label: '2 Cột', description: 'Chia 2 cột text' },
];

// Default data for each block type
export function getDefaultBlockData(type: BlockType): Record<string, unknown> {
  switch (type) {
    case 'heading':
      return { text: 'Tiêu đề mới', level: 2 };
    case 'paragraph':
      return { text: 'Nhập nội dung văn bản tại đây...' };
    case 'list':
      return { items: ['Mục 1', 'Mục 2', 'Mục 3'], ordered: false };
    case 'quote':
      return { text: 'Trích dẫn nổi bật...', author: '' };
    case 'image':
      return { url: '', alt: '', caption: '' };
    case 'callout':
      return { text: 'Thông tin quan trọng...', type: 'info', icon: 'ri-information-line' };
    case 'divider':
      return { style: 'solid' };
    case 'columns':
      return { left: 'Nội dung cột trái...', right: 'Nội dung cột phải...' };
    default:
      return {};
  }
}
