/**
 * DisplayOptions Component
 * Display options section for RichTextForm
 * Requirements: 4.3
 */

import { tokens } from '@app/shared';
import { FormSection, SelectInput } from '../shared';
import type { DataRecord, UpdateFieldFn } from '../shared';

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

interface DisplayOptionsProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
}

export function DisplayOptions({ data, updateField }: DisplayOptionsProps) {
  return (
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
  );
}
