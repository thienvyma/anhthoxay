/**
 * MarketplaceForm Component
 * Form for MARKETPLACE section type
 * Requirements: 3.2
 */

import { tokens } from '@app/shared';
import { Input, TextArea } from '../../Input';
import { InfoBanner } from './shared';
import type { DataRecord, UpdateFieldFn } from './shared';

interface MarketplaceFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
}

export function MarketplaceForm({ data, updateField }: MarketplaceFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner
        icon="ri-store-2-line"
        color="#06b6d4"
        title="Sàn Giao Dịch"
        description="Hiển thị danh sách công trình đang tìm nhà thầu (OPEN status) để thu hút nhà thầu và chủ nhà tham gia nền tảng."
      />

      {/* Header */}
      <div
        style={{
          background: 'rgba(6, 182, 212, 0.05)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          borderRadius: tokens.radius.md,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <i className="ri-text" style={{ fontSize: 18, color: '#06b6d4' }} />
          <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>
            Tiêu đề & Mô tả
          </label>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            label="Tiêu đề"
            value={data.title || ''}
            onChange={(v) => updateField('title', v)}
            placeholder="Công trình đang tìm nhà thầu"
            fullWidth
          />
          <TextArea
            label="Mô tả"
            value={data.subtitle || ''}
            onChange={(v) => updateField('subtitle', v)}
            placeholder="Khám phá các dự án xây dựng đang chờ báo giá từ nhà thầu uy tín"
            rows={2}
            fullWidth
          />
        </div>
      </div>

      {/* Display Options */}
      <div
        style={{
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: tokens.radius.md,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <i className="ri-settings-3-line" style={{ fontSize: 18, color: '#3B82F6' }} />
          <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>
            Tùy chọn hiển thị
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Input
            label="Số công trình hiển thị"
            type="number"
            value={data.limit || 6}
            onChange={(v) => updateField('limit', parseInt(v) || 6)}
            fullWidth
          />
          <div style={{ display: 'flex', alignItems: 'center', paddingTop: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={data.showStats !== false}
                onChange={(e) => updateField('showStats', e.target.checked)}
              />
              <span style={{ color: tokens.color.text, fontSize: 13 }}>Hiển thị thống kê</span>
            </label>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div
        style={{
          background: 'rgba(245, 211, 147, 0.05)',
          border: '1px solid rgba(245, 211, 147, 0.2)',
          borderRadius: tokens.radius.md,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <i className="ri-cursor-line" style={{ fontSize: 18, color: tokens.color.primary }} />
          <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>
            Nút Call-to-Action
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Input
            label="Text nút chính"
            value={data.ctaText || ''}
            onChange={(v) => updateField('ctaText', v)}
            placeholder="Xem tất cả công trình"
            fullWidth
          />
          <Input
            label="Link nút chính"
            value={data.ctaLink || ''}
            onChange={(v) => updateField('ctaLink', v)}
            placeholder="/portal/marketplace"
            fullWidth
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input
            label="Text nút đăng ký"
            value={data.registerText || ''}
            onChange={(v) => updateField('registerText', v)}
            placeholder="Đăng ký làm nhà thầu"
            fullWidth
          />
          <Input
            label="Link nút đăng ký"
            value={data.registerLink || ''}
            onChange={(v) => updateField('registerLink', v)}
            placeholder="/portal/auth/register?type=contractor"
            fullWidth
          />
        </div>
      </div>
    </div>
  );
}
