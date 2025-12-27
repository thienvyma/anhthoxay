/**
 * TestimonialsForm Component
 * Form for TESTIMONIALS section type
 * Requirements: 3.2
 */

import { Input, TextArea } from '../../Input';
import { InfoBanner, ArraySection } from './shared';
import type { DataRecord, UpdateFieldFn, AddArrayItemFn, RemoveArrayItemFn } from './shared';
import { generateUniqueId } from '../utils';

interface TestimonialsFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
  addArrayItem: AddArrayItemFn;
  removeArrayItem: RemoveArrayItemFn;
}

export function TestimonialsForm({
  data,
  updateField,
  addArrayItem,
  removeArrayItem,
}: TestimonialsFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <InfoBanner
        icon="ri-chat-quote-line"
        color="#F59E0B"
        title="Đánh Giá Khách Hàng"
        description="Hiển thị phản hồi từ khách hàng."
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
      <ArraySection
        label={`Đánh giá (${data.testimonials?.length || 0})`}
        items={data.testimonials || []}
        onAdd={() =>
          addArrayItem('testimonials', {
            _id: generateUniqueId(),
            name: '',
            role: '',
            content: '',
            rating: 5,
            avatar: '',
          })
        }
        onRemove={(idx) => removeArrayItem('testimonials', idx)}
        renderItem={(item, idx) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input
                label="Tên"
                value={item.name || ''}
                onChange={(v) => updateField(`testimonials.${idx}.name`, v)}
                fullWidth
              />
              <Input
                label="Vai trò"
                value={item.role || ''}
                onChange={(v) => updateField(`testimonials.${idx}.role`, v)}
                placeholder="VD: Chủ nhà tại Quận 7"
                fullWidth
              />
            </div>
            <TextArea
              label="Nội dung đánh giá"
              value={item.content || ''}
              onChange={(v) => updateField(`testimonials.${idx}.content`, v)}
              rows={3}
              fullWidth
            />
            <Input
              label="Số sao (1-5)"
              type="number"
              value={item.rating || 5}
              onChange={(v) => updateField(`testimonials.${idx}.rating`, parseInt(v) || 5)}
              fullWidth
            />
          </div>
        )}
      />
    </div>
  );
}
