/**
 * AboutForm Component
 * Form for ABOUT section type
 * Requirements: 3.2
 */

import { tokens } from '@app/shared';
import { Input, TextArea } from '../../Input';
import { InfoBanner, ImageSection, ArraySection } from './shared';
import type { DataRecord, UpdateFieldFn } from './shared';

interface FeatureItem {
  _id?: string;
  icon: string;
  title: string;
  description: string;
}

interface AboutFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
}

export function AboutForm({ data, updateField }: AboutFormProps) {
  const features = (data.features as FeatureItem[]) || [];

  const handleUpdateFeature = (index: number, field: keyof FeatureItem, value: string) => {
    const updated = [...features];
    updated[index] = { ...updated[index], [field]: value };
    updateField('features', updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <InfoBanner
        icon="ri-building-2-line"
        color="#8B5CF6"
        title="Giới Thiệu"
        description="Section giới thiệu về công ty với hình ảnh và danh sách tính năng."
      />

      {/* Basic Info */}
      <div
        style={{
          background: tokens.color.surfaceAlt,
          borderRadius: tokens.radius.md,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <h4 style={{ fontSize: 14, fontWeight: 600, color: tokens.color.text, margin: 0 }}>
          <i className="ri-text" style={{ marginRight: 8, color: tokens.color.primary }} />
          Nội dung chính
        </h4>

        <Input
          label="Badge"
          value={(data.badge as string) || ''}
          onChange={(v) => updateField('badge', v)}
          placeholder="Về Chúng Tôi"
          fullWidth
        />

        <Input
          label="Tiêu đề"
          value={(data.title as string) || ''}
          onChange={(v) => updateField('title', v)}
          placeholder="Nội Thất Nhanh - Đối Tác Tin Cậy"
          fullWidth
        />

        <TextArea
          label="Mô tả"
          value={(data.description as string) || ''}
          onChange={(v) => updateField('description', v)}
          placeholder="Mô tả về công ty, dịch vụ..."
          rows={4}
          fullWidth
        />
      </div>

      {/* Image */}
      <div
        style={{
          background: tokens.color.surfaceAlt,
          borderRadius: tokens.radius.md,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <h4 style={{ fontSize: 14, fontWeight: 600, color: tokens.color.text, margin: 0 }}>
          <i className="ri-image-line" style={{ marginRight: 8, color: tokens.color.primary }} />
          Hình ảnh
        </h4>

        <ImageSection
          label="Hình ảnh minh họa"
          value={data.imageUrl as string}
          onChange={(url) => updateField('imageUrl', url)}
        />

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              color: tokens.color.textMuted,
              marginBottom: 8,
            }}
          >
            Vị trí hình ảnh
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            {(['right', 'left'] as const).map((pos) => (
              <button
                key={pos}
                onClick={() => updateField('layout', pos)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background:
                    (data.layout || 'right') === pos
                      ? `${tokens.color.primary}20`
                      : tokens.color.surface,
                  border: `1px solid ${
                    (data.layout || 'right') === pos
                      ? tokens.color.primary
                      : tokens.color.border
                  }`,
                  borderRadius: tokens.radius.md,
                  color:
                    (data.layout || 'right') === pos
                      ? tokens.color.primary
                      : tokens.color.text,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <i
                  className={
                    pos === 'right' ? 'ri-layout-right-line' : 'ri-layout-left-line'
                  }
                />
                {pos === 'right' ? 'Ảnh bên phải' : 'Ảnh bên trái'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <ArraySection
        label="Tính năng nổi bật"
        items={features as DataRecord[]}
        onAdd={() => {
          updateField('features', [
            ...features,
            {
              _id: `feature-${Date.now()}`,
              icon: 'ri-check-double-line',
              title: '',
              description: '',
            },
          ]);
        }}
        onRemove={(index: number) => {
          updateField(
            'features',
            features.filter((_, i) => i !== index)
          );
        }}
        renderItem={(item: DataRecord, index: number) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input
              label="Icon (Remix Icon)"
              value={(item.icon as string) || ''}
              onChange={(v) => handleUpdateFeature(index, 'icon', v)}
              placeholder="ri-check-double-line"
              fullWidth
            />
            <Input
              label="Tiêu đề"
              value={(item.title as string) || ''}
              onChange={(v) => handleUpdateFeature(index, 'title', v)}
              placeholder="Chất lượng cao"
              fullWidth
            />
            <TextArea
              label="Mô tả"
              value={(item.description as string) || ''}
              onChange={(v) => handleUpdateFeature(index, 'description', v)}
              placeholder="Mô tả ngắn về tính năng..."
              rows={2}
              fullWidth
            />
          </div>
        )}
      />

      {/* CTA */}
      <div
        style={{
          background: tokens.color.surfaceAlt,
          borderRadius: tokens.radius.md,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <h4 style={{ fontSize: 14, fontWeight: 600, color: tokens.color.text, margin: 0 }}>
          <i
            className="ri-cursor-line"
            style={{ marginRight: 8, color: tokens.color.primary }}
          />
          Nút kêu gọi hành động (CTA)
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input
            label="Text nút"
            value={(data.ctaText as string) || ''}
            onChange={(v) => updateField('ctaText', v)}
            placeholder="Tìm hiểu thêm"
            fullWidth
          />
          <Input
            label="Link"
            value={(data.ctaLink as string) || ''}
            onChange={(v) => updateField('ctaLink', v)}
            placeholder="/gioi-thieu"
            fullWidth
          />
        </div>

        <p
          style={{
            fontSize: 12,
            color: tokens.color.muted,
            margin: 0,
            fontStyle: 'italic',
          }}
        >
          Để trống nếu không muốn hiển thị nút CTA
        </p>
      </div>
    </div>
  );
}
