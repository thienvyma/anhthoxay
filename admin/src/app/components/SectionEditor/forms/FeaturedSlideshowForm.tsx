/**
 * FeaturedSlideshowForm Component
 * Form for FEATURED_SLIDESHOW section type
 * Requirements: 3.2
 */

import { tokens } from '../../../../theme';
import { Input, TextArea } from '../../Input';
import { InfoBanner } from './shared';
import type { DataRecord, UpdateFieldFn } from './shared';

interface FeaturedSlideshowFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
}

export function FeaturedSlideshowForm({ data, updateField }: FeaturedSlideshowFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner
        icon="ri-slideshow-3-line"
        color="#ec4899"
        title="Slideshow Nổi Bật"
        description="Hiển thị các hình ảnh được đánh dấu nổi bật trong Media Library dạng slideshow tự động."
      />

      {/* Header */}
      <div
        style={{
          background: 'rgba(236, 72, 153, 0.05)',
          border: '1px solid rgba(236, 72, 153, 0.2)',
          borderRadius: tokens.radius.md,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <i className="ri-text" style={{ fontSize: 18, color: '#ec4899' }} />
          <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>
            Tiêu đề & Mô tả
          </label>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            label="Tiêu đề (tùy chọn)"
            value={data.title || ''}
            onChange={(v) => updateField('title', v)}
            placeholder="Hình ảnh nổi bật"
            fullWidth
          />
          <TextArea
            label="Mô tả (tùy chọn)"
            value={data.subtitle || ''}
            onChange={(v) => updateField('subtitle', v)}
            placeholder="Những khoảnh khắc đáng nhớ"
            rows={2}
            fullWidth
          />
        </div>
      </div>

      {/* Slideshow Options */}
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
            Tùy chọn Slideshow
          </label>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={data.autoplay !== false}
              onChange={(e) => updateField('autoplay', e.target.checked)}
            />
            <span style={{ color: tokens.color.text, fontSize: 13 }}>Tự động chuyển slide</span>
          </label>

          {data.autoplay !== false && (
            <Input
              label="Thời gian chuyển slide (ms)"
              type="number"
              value={data.autoplayDelay || 5000}
              onChange={(v) => updateField('autoplayDelay', parseInt(v) || 5000)}
              fullWidth
            />
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={data.showNavigation !== false}
              onChange={(e) => updateField('showNavigation', e.target.checked)}
            />
            <span style={{ color: tokens.color.text, fontSize: 13 }}>
              Hiển thị nút điều hướng (trái/phải)
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={data.showPagination !== false}
              onChange={(e) => updateField('showPagination', e.target.checked)}
            />
            <span style={{ color: tokens.color.text, fontSize: 13 }}>Hiển thị chấm phân trang</span>
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
            Hình ảnh được lấy từ Media Library với trạng thái "Nổi bật". Vào Media Library để đánh
            dấu ảnh nổi bật.
          </p>
        </div>
      </div>
    </div>
  );
}
