/**
 * BlogListForm Component
 * Form for BLOG_LIST section type
 * Requirements: 3.2
 */

import { Input, TextArea } from '../../Input';
import { InfoBanner } from './shared';
import type { DataRecord, UpdateFieldFn } from './shared';

interface BlogListFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
}

export function BlogListForm({ data, updateField }: BlogListFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner
        icon="ri-file-list-line"
        color="#8B5CF6"
        title="Danh Sách Blog"
        description="Hiển thị danh sách bài viết với phân trang."
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
        label="Số bài mỗi trang"
        type="number"
        value={data.perPage || 6}
        onChange={(v) => updateField('perPage', parseInt(v) || 6)}
        fullWidth
      />
    </div>
  );
}
