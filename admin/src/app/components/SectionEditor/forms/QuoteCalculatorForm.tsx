/**
 * QuoteCalculatorForm Component
 * Form for QUOTE_CALCULATOR section type
 * Requirements: 3.2
 */

import { tokens } from '@app/shared';
import { Input, TextArea } from '../../Input';
import { IconPicker } from '../../IconPicker';
import { InfoBanner, FormSection, SelectInput } from './shared';
import type { DataRecord, UpdateFieldFn } from './shared';

interface QuoteCalculatorFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
}

const DEFAULT_TABS = [
  { value: 'calculator', label: 'Dự Toán Nhanh' },
  { value: 'consultation', label: 'Đăng Ký Tư Vấn' },
];

export function QuoteCalculatorForm({ data, updateField }: QuoteCalculatorFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner
        icon="ri-calculator-line"
        color="#F59E0B"
        title="Dự Toán & Tư Vấn"
        description="Section 2 tab: Dự toán nhanh + Đăng ký tư vấn. Dữ liệu hạng mục, vật dụng, đơn giá được lấy từ hệ thống."
      />

      <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: tokens.radius.md, padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <i className="ri-link" style={{ fontSize: 20, color: '#10B981', marginTop: 2 }} />
        <div>
          <p style={{ color: tokens.color.text, fontSize: 14, margin: 0, fontWeight: 500, marginBottom: 4 }}>Tab Đăng Ký Tư Vấn sử dụng QUOTE_FORM chung</p>
          <p style={{ color: tokens.color.muted, fontSize: 13, margin: 0, lineHeight: 1.5 }}>Nội dung form đăng ký tư vấn được đồng bộ từ section QUOTE_FORM.</p>
        </div>
      </div>

      <Input label="Tiêu đề" value={data.title || ''} onChange={(v) => updateField('title', v)} placeholder="Báo Giá & Dự Toán" fullWidth />
      <TextArea label="Mô tả" value={data.subtitle || ''} onChange={(v) => updateField('subtitle', v)} placeholder="Tính toán chi phí cải tạo nhà nhanh chóng và chính xác" fullWidth />

      <FormSection icon="ri-layout-column-line" iconColor="#F59E0B" title="Cấu hình Tab" bgColor="rgba(245, 158, 11, 0.05)" borderColor="rgba(245, 158, 11, 0.2)">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: tokens.radius.md, padding: 12, border: `1px solid ${tokens.color.border}` }}>
            <h5 style={{ color: tokens.color.text, fontSize: 13, fontWeight: 600, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ri-calculator-line" style={{ color: '#F59E0B' }} /> Tab Dự Toán
            </h5>
            <Input label="Nhãn tab" value={data.calculatorTab?.label || ''} onChange={(v) => updateField('calculatorTab.label', v)} placeholder="Dự Toán Nhanh" fullWidth />
            <div style={{ marginTop: 8 }}><IconPicker label="Icon" value={data.calculatorTab?.icon || ''} onChange={(v) => updateField('calculatorTab.icon', v)} /></div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: tokens.radius.md, padding: 12, border: `1px solid ${tokens.color.border}` }}>
            <h5 style={{ color: tokens.color.text, fontSize: 13, fontWeight: 600, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ri-phone-line" style={{ color: '#10B981' }} /> Tab Tư Vấn
            </h5>
            <Input label="Nhãn tab" value={data.consultationTab?.label || ''} onChange={(v) => updateField('consultationTab.label', v)} placeholder="Đăng Ký Tư Vấn" fullWidth />
            <div style={{ marginTop: 8 }}><IconPicker label="Icon" value={data.consultationTab?.icon || ''} onChange={(v) => updateField('consultationTab.icon', v)} /></div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <SelectInput label="Tab mặc định" value={(data.defaultTab as string) || 'calculator'} options={DEFAULT_TABS} onChange={(v) => updateField('defaultTab', v)} />
        </div>
      </FormSection>

      <FormSection icon="ri-settings-3-line" iconColor="#3B82F6" title="Tùy chọn" bgColor="rgba(59, 130, 246, 0.05)" borderColor="rgba(59, 130, 246, 0.2)">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 8 }}>
          <input type="checkbox" checked={data.showMaterials !== false} onChange={(e) => updateField('showMaterials', e.target.checked)} />
          <span style={{ color: tokens.color.text, fontSize: 13 }}>Hiển thị bước chọn vật dụng (nếu hạng mục cho phép)</span>
        </label>
        <div style={{ marginTop: 12 }}>
          <Input label="Chiều rộng tối đa (px)" type="number" value={data.maxWidth || 900} onChange={(v) => updateField('maxWidth', parseInt(v) || 900)} fullWidth />
        </div>
      </FormSection>

      <FormSection icon="ri-information-line" iconColor="#EF4444" title="Ghi chú kết quả" bgColor="rgba(239, 68, 68, 0.05)" borderColor="rgba(239, 68, 68, 0.2)">
        <TextArea label="Nội dung ghi chú" value={data.disclaimerText || '* Giá trên chỉ mang tính tham khảo. Liên hệ để được báo giá chính xác.'} onChange={(v) => updateField('disclaimerText', v)} fullWidth />
        <p style={{ color: tokens.color.muted, fontSize: 12, margin: '8px 0 0', lineHeight: 1.4 }}>Nội dung này hiển thị bên dưới kết quả dự toán trên landing page.</p>
      </FormSection>
    </div>
  );
}
