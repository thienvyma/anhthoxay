/**
 * FeaturedBlogPostsForm Component
 * Form for FEATURED_BLOG_POSTS section type
 * Requirements: 3.2
 */

import { Input, TextArea } from '../../Input';
import { InfoBanner } from './shared';
import type { DataRecord, UpdateFieldFn } from './shared';

interface FeaturedBlogPostsFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
}

export function FeaturedBlogPostsForm({ data, updateField }: FeaturedBlogPostsFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner
        icon="ri-article-line"
        color="#8B5CF6"
        title="Bài Viết Nổi Bật"
        description="Hiển thị bài blog mới nhất từ hệ thống."
      />
      <Input
        label="Tiêu đề"
        value={data.title || ''}
        onChange={(v) => updateField('title', v)}
        fullWidth
      />
      <TextArea
        label="Mô tả"
        value={data.subtitle || ''}
        onChange={(v) => updateField('subtitle', v)}
        fullWidth
      />
      <Input
        label="Số bài hiển thị"
        type="number"
        value={data.limit || 3}
        onChange={(v) => updateField('limit', parseInt(v) || 3)}
        fullWidth
      />
    </div>
  );
}
