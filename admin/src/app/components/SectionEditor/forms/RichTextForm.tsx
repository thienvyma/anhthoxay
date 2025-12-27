/**
 * RichTextForm Component
 * Form for RICH_TEXT section type with Visual/Markdown toggle
 * Enhanced with layout options
 */

import { useState } from 'react';
import { tokens } from '@app/shared';
import { RichTextEditor } from '../../RichTextEditor';
import { VisualBlockEditor } from '../../VisualBlockEditor';
import { InfoBanner, FormSection, SelectInput, ImageSection, RangeInput } from './shared';
import type { DataRecord, UpdateFieldFn } from './shared';

interface RichTextFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
}

const MAX_WIDTHS = [
  { value: 'narrow', label: 'Hẹp (700px)' },
  { value: 'default', label: 'Mặc định (900px)' },
  { value: 'wide', label: 'Rộng (1100px) - Khuyến nghị' },
  { value: 'full', label: 'Toàn màn hình' },
];

const PADDINGS = [
  { value: 'none', label: 'Không có' },
  { value: 'small', label: 'Nhỏ' },
  { value: 'normal', label: 'Bình thường' },
  { value: 'large', label: 'Lớn' },
];

const LAYOUTS = [
  { value: 'default', label: 'Mặc định (Card)' },
  { value: 'centered', label: 'Căn giữa (Không card)' },
  { value: 'split-left', label: 'Ảnh trái + Nội dung phải' },
  { value: 'split-right', label: 'Nội dung trái + Ảnh phải' },
  { value: 'full-width', label: 'Toàn chiều rộng (Background)' },
];



const TEXT_ALIGNS = [
  { value: 'left', label: 'Trái' },
  { value: 'center', label: 'Giữa' },
  { value: 'right', label: 'Phải' },
];

const VERTICAL_PADDINGS = [
  { value: 'small', label: 'Nhỏ (40px)' },
  { value: 'medium', label: 'Trung bình (80px)' },
  { value: 'large', label: 'Lớn (120px)' },
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
      <FormSection icon="ri-layout-4-line" title="Kiểu bố cục">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
          {LAYOUTS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateField('layout', opt.value)}
              style={{
                padding: '12px 16px',
                background: layout === opt.value ? `${tokens.color.primary}20` : 'rgba(255,255,255,0.03)',
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
            {layout === 'default' && 'Nội dung trong card với background mờ, phù hợp cho văn bản dài.'}
            {layout === 'centered' && 'Nội dung căn giữa không có card, phù hợp cho tiêu đề và mô tả ngắn.'}
            {layout === 'split-left' && 'Ảnh bên trái, nội dung bên phải. Cần chọn ảnh bên dưới.'}
            {layout === 'split-right' && 'Nội dung bên trái, ảnh bên phải. Cần chọn ảnh bên dưới.'}
            {layout === 'full-width' && 'Nội dung trải rộng với background ảnh. Cần chọn ảnh bên dưới.'}
          </span>
        </div>
      </FormSection>

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
            <div style={{ marginTop: 16 }}>
              <style>{`
                .ratio-slider::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  appearance: none;
                  width: 20px;
                  height: 20px;
                  background: linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent});
                  border-radius: 50%;
                  cursor: grab;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  border: 2px solid white;
                  transition: transform 0.15s ease;
                }
                .ratio-slider::-webkit-slider-thumb:hover {
                  transform: scale(1.15);
                }
                .ratio-slider::-webkit-slider-thumb:active {
                  cursor: grabbing;
                  transform: scale(1.1);
                }
                .ratio-slider::-moz-range-thumb {
                  width: 20px;
                  height: 20px;
                  background: linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent});
                  border-radius: 50%;
                  cursor: grab;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  border: 2px solid white;
                }
              `}</style>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>
                  Tỉ lệ Ảnh : Nội dung
                </label>
                <span style={{ 
                  padding: '4px 10px', 
                  background: `${tokens.color.primary}20`, 
                  borderRadius: tokens.radius.sm,
                  color: tokens.color.primary, 
                  fontSize: 13, 
                  fontWeight: 600 
                }}>
                  {(data.imageRatio as number) || 40}% : {100 - ((data.imageRatio as number) || 40)}%
                </span>
              </div>
              
              {/* Custom slider with visual feedback */}
              <div style={{ position: 'relative', padding: '8px 0' }}>
                {/* Track background */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: 8,
                  transform: 'translateY(-50%)',
                  background: tokens.color.border,
                  borderRadius: 4,
                  overflow: 'hidden',
                }}>
                  {/* Filled portion */}
                  <div style={{
                    width: `${(data.imageRatio as number) || 40}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                    transition: 'width 0.1s ease',
                  }} />
                </div>
                
                {/* Actual range input */}
                <input
                  type="range"
                  min={15}
                  max={70}
                  step={1}
                  value={(data.imageRatio as number) || 40}
                  onChange={(e) => updateField('imageRatio', Number(e.target.value))}
                  className="ratio-slider"
                  style={{
                    width: '100%',
                    height: 24,
                    background: 'transparent',
                    cursor: 'pointer',
                    position: 'relative',
                    zIndex: 1,
                    WebkitAppearance: 'none',
                    appearance: 'none',
                  }}
                />
              </div>
              
              {/* Labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 11, color: tokens.color.muted }}>
                  <i className="ri-image-line" style={{ marginRight: 4 }} />
                  Ảnh nhỏ (15%)
                </span>
                <span style={{ fontSize: 11, color: tokens.color.muted }}>
                  Ảnh lớn (70%)
                  <i className="ri-image-line" style={{ marginLeft: 4 }} />
                </span>
              </div>
              
              <p style={{ marginTop: 8, fontSize: 12, color: tokens.color.muted }}>
                💡 Kéo thanh trượt để điều chỉnh tỉ lệ hiển thị giữa ảnh và nội dung
              </p>
            </div>
          )}
        </FormSection>
      )}

      {/* Editor Mode Toggle */}
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

      {/* Content Editor */}
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

      {/* Display Options */}
      <FormSection icon="ri-palette-line" title="Tùy chọn hiển thị">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <SelectInput 
            label="Căn chỉnh văn bản" 
            value={(data.textAlign as string) || 'left'} 
            options={TEXT_ALIGNS} 
            onChange={(v) => updateField('textAlign', v)} 
          />
          <SelectInput 
            label="Chiều rộng nội dung" 
            value={(data.maxWidth as string) || 'wide'} 
            options={MAX_WIDTHS} 
            onChange={(v) => updateField('maxWidth', v)} 
          />
          <SelectInput 
            label="Padding nội dung" 
            value={(data.padding as string) || 'normal'} 
            options={PADDINGS} 
            onChange={(v) => updateField('padding', v)} 
          />
          <SelectInput 
            label="Khoảng cách dọc" 
            value={(data.verticalPadding as string) || 'medium'} 
            options={VERTICAL_PADDINGS} 
            onChange={(v) => updateField('verticalPadding', v)} 
          />
        </div>
        
        {/* Decorations toggle */}
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={data.showDecorations !== false}
              onChange={(e) => updateField('showDecorations', e.target.checked)}
              style={{ width: 18, height: 18, accentColor: tokens.color.primary }}
            />
            <span style={{ color: tokens.color.text, fontSize: 14 }}>Hiển thị trang trí (đường kẻ, viền)</span>
          </label>
        </div>
      </FormSection>
    </div>
  );
}
