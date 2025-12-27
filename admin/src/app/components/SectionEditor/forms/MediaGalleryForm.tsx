/**
 * MediaGalleryForm Component
 * Form for MEDIA_GALLERY section type
 * Requirements: 3.2
 */

import { tokens } from '@app/shared';
import { Input, TextArea } from '../../Input';
import { InfoBanner } from './shared';
import type { DataRecord, UpdateFieldFn } from './shared';

interface MediaGalleryFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
}

export function MediaGalleryForm({ data, updateField }: MediaGalleryFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner
        icon="ri-gallery-line"
        color="#8b5cf6"
        title="Thư Viện Ảnh"
        description="Hiển thị toàn bộ ảnh trong Media Library với phân trang và lightbox xem chi tiết."
      />

      {/* Header */}
      <div
        style={{
          background: 'rgba(139, 92, 246, 0.05)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: tokens.radius.md,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <i className="ri-text" style={{ fontSize: 18, color: '#8b5cf6' }} />
          <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>
            Tiêu đề & Mô tả
          </label>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            label="Tiêu đề (tùy chọn)"
            value={data.title || ''}
            onChange={(v) => updateField('title', v)}
            placeholder="Thư viện ảnh"
            fullWidth
          />
          <TextArea
            label="Mô tả (tùy chọn)"
            value={data.subtitle || ''}
            onChange={(v) => updateField('subtitle', v)}
            placeholder="Khám phá bộ sưu tập hình ảnh của chúng tôi"
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
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 6,
                color: tokens.color.text,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Số cột
            </label>
            <select
              value={data.columns || 3}
              onChange={(e) => updateField('columns', parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.color.border}`,
                background: tokens.color.surface,
                color: tokens.color.text,
                fontSize: 14,
              }}
            >
              <option value={2}>2 cột</option>
              <option value={3}>3 cột</option>
              <option value={4}>4 cột</option>
            </select>
          </div>
          <Input
            label="Số ảnh mỗi trang"
            type="number"
            value={data.itemsPerPage || 12}
            onChange={(v) => updateField('itemsPerPage', parseInt(v) || 12)}
            fullWidth
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={data.showCaptions !== false}
              onChange={(e) => updateField('showCaptions', e.target.checked)}
            />
            <span style={{ color: tokens.color.text, fontSize: 13 }}>Hiển thị caption ảnh</span>
          </label>
        </div>
      </div>

      {/* Info */}
      <div
        style={{
          background: 'rgba(245, 211, 147, 0.05)',
          border: '1px solid rgba(245, 211, 147, 0.2)',
          borderRadius: tokens.radius.md,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ri-information-line" style={{ fontSize: 18, color: tokens.color.primary }} />
          <p style={{ color: tokens.color.muted, fontSize: 13, margin: 0 }}>
            Hình ảnh được lấy từ Media Library. Vào Media Library để upload và quản lý ảnh.
          </p>
        </div>
      </div>
    </div>
  );
}
