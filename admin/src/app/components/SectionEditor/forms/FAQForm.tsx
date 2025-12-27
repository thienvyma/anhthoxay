/**
 * FAQForm Component
 * Form for FAQ section type
 * Requirements: 3.2
 */

import { Input, TextArea } from '../../Input';
import { InfoBanner, ArraySection } from './shared';
import type { DataRecord, UpdateFieldFn, AddArrayItemFn, RemoveArrayItemFn } from './shared';
import { generateUniqueId } from '../utils';

interface FAQFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
  addArrayItem: AddArrayItemFn;
  removeArrayItem: RemoveArrayItemFn;
}

export function FAQForm({ data, updateField, addArrayItem, removeArrayItem }: FAQFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner
        icon="ri-question-line"
        color="#06B6D4"
        title="Câu Hỏi Thường Gặp"
        description="Danh sách FAQ accordion."
      />
      <Input
        label="Tiêu đề"
        value={data.title || ''}
        onChange={(v) => updateField('title', v)}
        fullWidth
      />
      <ArraySection
        label="Câu hỏi"
        items={data.items || []}
        onAdd={() =>
          addArrayItem('items', {
            _id: generateUniqueId(),
            question: 'Câu hỏi mới?',
            answer: 'Trả lời...',
          })
        }
        onRemove={(idx) => removeArrayItem('items', idx)}
        renderItem={(item, idx) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input
              label="Câu hỏi"
              value={item.question || ''}
              onChange={(v) => updateField(`items.${idx}.question`, v)}
              fullWidth
            />
            <TextArea
              label="Trả lời"
              value={item.answer || ''}
              onChange={(v) => updateField(`items.${idx}.answer`, v)}
              rows={3}
              fullWidth
            />
          </div>
        )}
      />
    </div>
  );
}
