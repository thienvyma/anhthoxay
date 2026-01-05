/**
 * LayoutSelector Component
 * Layout selection UI for RichTextForm
 * Requirements: 4.2
 */

import { tokens } from '../../../../../theme';
import { FormSection } from '../shared';

const LAYOUTS = [
  { value: 'default', label: 'Mặc định (Card)' },
  { value: 'centered', label: 'Căn giữa (Không card)' },
  { value: 'split-left', label: 'Ảnh trái + Nội dung phải' },
  { value: 'split-right', label: 'Nội dung trái + Ảnh phải' },
  { value: 'full-width', label: 'Toàn chiều rộng (Background)' },
];

const LAYOUT_HINTS: Record<string, string> = {
  'default': 'Nội dung trong card với background mờ, phù hợp cho văn bản dài.',
  'centered': 'Nội dung căn giữa không có card, phù hợp cho tiêu đề và mô tả ngắn.',
  'split-left': 'Ảnh bên trái, nội dung bên phải. Cần chọn ảnh bên dưới.',
  'split-right': 'Nội dung bên trái, ảnh bên phải. Cần chọn ảnh bên dưới.',
  'full-width': 'Nội dung trải rộng với background ảnh. Cần chọn ảnh bên dưới.',
};

interface LayoutSelectorProps {
  layout: string;
  onChange: (layout: string) => void;
}

export function LayoutSelector({ layout, onChange }: LayoutSelectorProps) {
  return (
    <FormSection icon="ri-layout-4-line" title="Kiểu bố cục">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
        {LAYOUTS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              padding: '12px 16px',
              background: layout === opt.value ? `${tokens.color.primary}20` : tokens.color.surfaceAlt,
              border: `1px solid ${layout === opt.value ? tokens.color.primary : tokens.color.border}`,
              borderRadius: tokens.radius.md,
              color: layout === opt.value ? tokens.color.primary : tokens.color.text,
              fontSize: 13,
              fontWeight: layout === opt.value ? 600 : 400,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      
      {/* Layout preview hint */}
      <div style={{ 
        marginTop: 12, 
        padding: 12, 
        background: 'rgba(59, 130, 246, 0.1)', 
        border: '1px solid rgba(59, 130, 246, 0.3)', 
        borderRadius: tokens.radius.md,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <i className="ri-lightbulb-line" style={{ color: '#3B82F6', fontSize: 16 }} />
        <span style={{ color: tokens.color.muted, fontSize: 13 }}>
          {LAYOUT_HINTS[layout] || ''}
        </span>
      </div>
    </FormSection>
  );
}
