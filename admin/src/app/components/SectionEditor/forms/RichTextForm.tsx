/**
 * RichTextForm Component
 * Form for RICH_TEXT section type with Visual/Markdown toggle
 * Requirements: 3.2
 */

import { useState } from 'react';
import { tokens } from '@app/shared';
import { RichTextEditor } from '../../RichTextEditor';
import { VisualBlockEditor } from '../../VisualBlockEditor';
import { InfoBanner, FormSection, SelectInput } from './shared';
import type { DataRecord, UpdateFieldFn } from './shared';

interface RichTextFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
}

const MAX_WIDTHS = [
  { value: 'default', label: 'Mặc định (800px)' },
  { value: 'narrow', label: 'Hẹp (600px)' },
  { value: 'wide', label: 'Rộng (1000px)' },
  { value: 'full', label: 'Toàn màn hình' },
];

const PADDINGS = [
  { value: 'none', label: 'Không có' },
  { value: 'small', label: 'Nhỏ' },
  { value: 'normal', label: 'Bình thường' },
  { value: 'large', label: 'Lớn' },
];

export function RichTextForm({ data, updateField }: RichTextFormProps) {
  const [editorMode, setEditorMode] = useState<'visual' | 'markdown'>('visual');

  const isBlocksFormat = (() => {
    try {
      const parsed = JSON.parse(data.content || data.html || '');
      return Array.isArray(parsed);
    } catch {
      return false;
    }
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner icon="ri-magic-line" color="#a78bfa" title="Nội Dung Tùy Chỉnh" description="Tạo nội dung đẹp mắt với Visual Editor hoặc viết Markdown trực tiếp." />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.3)', borderRadius: tokens.radius.md }}>
        <i className="ri-tools-line" style={{ color: '#a78bfa', fontSize: 18 }} />
        <span style={{ color: tokens.color.text, fontSize: 14, fontWeight: 500, marginRight: 'auto' }}>Chế độ soạn thảo:</span>
        <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.2)', borderRadius: tokens.radius.md, padding: 4 }}>
          {(['visual', 'markdown'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setEditorMode(mode)}
              style={{
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 500,
                background: editorMode === mode ? tokens.color.primary : 'transparent',
                color: editorMode === mode ? '#111' : tokens.color.muted,
                border: 'none',
                borderRadius: tokens.radius.sm,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <i className={mode === 'visual' ? 'ri-drag-drop-line' : 'ri-markdown-line'} />
              {mode === 'visual' ? 'Visual' : 'Markdown'}
            </button>
          ))}
        </div>
      </div>

      {editorMode === 'visual' && (
        <VisualBlockEditor label="Nội dung (kéo thả để sắp xếp)" value={data.content || data.html || ''} onChange={(v) => updateField('content', v)} />
      )}

      {editorMode === 'markdown' && (
        <>
          {isBlocksFormat && (
            <div style={{ padding: 12, background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: tokens.radius.md, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ri-alert-line" style={{ color: '#F59E0B', fontSize: 18 }} />
              <span style={{ color: tokens.color.text, fontSize: 13 }}>Nội dung đang ở định dạng Visual Blocks. Chuyển sang Markdown sẽ mất cấu trúc blocks.</span>
            </div>
          )}
          <RichTextEditor label="Nội dung Markdown" value={isBlocksFormat ? '' : data.content || data.html || ''} onChange={(v) => updateField('content', v)} rows={15} />
        </>
      )}

      <FormSection icon="ri-palette-line" title="Tùy chọn hiển thị">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <SelectInput label="Chiều rộng tối đa" value={(data.maxWidth as string) || 'default'} options={MAX_WIDTHS} onChange={(v) => updateField('maxWidth', v)} />
          <SelectInput label="Padding" value={(data.padding as string) || 'normal'} options={PADDINGS} onChange={(v) => updateField('padding', v)} />
        </div>
      </FormSection>
    </div>
  );
}
