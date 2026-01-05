/**
 * RichTextForm Component
 * Form for RICH_TEXT section type with Visual/Markdown toggle
 * Enhanced with layout options
 */

import { useState } from 'react';
import { tokens } from '../../../../theme';
import { RichTextEditor } from '../../RichTextEditor';
import { VisualBlockEditor } from '../../VisualBlockEditor';
import { InfoBanner, FormSection, ImageSection, RangeInput } from './shared';
import type { DataRecord, UpdateFieldFn } from './shared';
import { 
  LayoutSelector, 
  ImageRatioSlider, 
  EditorModeToggle, 
  DisplayOptions 
} from './richtext';

interface RichTextFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
}

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

  const layout = (data.layout as string) || 'default';
  const needsImage = layout === 'split-left' || layout === 'split-right' || layout === 'full-width';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner 
        icon="ri-magic-line" 
        color="#a78bfa" 
        title="Nội Dung Tùy Chỉnh" 
        description="Tạo nội dung đẹp mắt với nhiều layout khác nhau. Chọn layout phù hợp với nội dung của bạn." 
      />

      {/* Layout Selection */}
      <LayoutSelector 
        layout={layout} 
        onChange={(v) => updateField('layout', v)} 
      />

      {/* Image for split/full-width layouts */}
      {needsImage && (
        <FormSection icon="ri-image-line" title="Ảnh nền / Ảnh minh họa">
          <ImageSection
            label="Chọn ảnh"
            value={data.backgroundImage}
            onChange={(url: string) => updateField('backgroundImage', url)}
          />
          
          {layout === 'full-width' && (
            <RangeInput
              label="Độ tối overlay"
              value={(data.backgroundOverlay as number) ?? 70}
              onChange={(v) => updateField('backgroundOverlay', v)}
            />
          )}
          
          {/* Split ratio slider for split layouts */}
          {(layout === 'split-left' || layout === 'split-right') && (
            <ImageRatioSlider
              value={(data.imageRatio as number) || 40}
              onChange={(v) => updateField('imageRatio', v)}
            />
          )}
        </FormSection>
      )}

      {/* Editor Mode Toggle */}
      <EditorModeToggle mode={editorMode} onChange={setEditorMode} />

      {/* Content Editor */}
      {editorMode === 'visual' && (
        <VisualBlockEditor 
          label="Nội dung (kéo thả để sắp xếp)" 
          value={data.content || data.html || ''} 
          onChange={(v) => updateField('content', v)} 
        />
      )}

      {editorMode === 'markdown' && (
        <>
          {isBlocksFormat && (
            <div style={{ 
              padding: 12, 
              background: 'rgba(245, 158, 11, 0.1)', 
              border: '1px solid rgba(245, 158, 11, 0.3)', 
              borderRadius: tokens.radius.md, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8 
            }}>
              <i className="ri-alert-line" style={{ color: '#F59E0B', fontSize: 18 }} />
              <span style={{ color: tokens.color.text, fontSize: 13 }}>
                Nội dung đang ở định dạng Visual Blocks. Chuyển sang Markdown sẽ mất cấu trúc blocks.
              </span>
            </div>
          )}
          <RichTextEditor 
            label="Nội dung Markdown" 
            value={isBlocksFormat ? '' : data.content || data.html || ''} 
            onChange={(v) => updateField('content', v)} 
            rows={15} 
          />
        </>
      )}

      {/* Display Options */}
      <DisplayOptions data={data} updateField={updateField} />
    </div>
  );
}
