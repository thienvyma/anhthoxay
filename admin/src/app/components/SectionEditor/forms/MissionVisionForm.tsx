/**
 * MissionVisionForm Component
 * Form for MISSION_VISION section type
 * Requirements: 3.2
 */

import { tokens } from '../../../../theme';
import { Input, TextArea } from '../../Input';
import { IconPicker } from '../../IconPicker';
import { InfoBanner } from './shared';
import type { DataRecord, UpdateFieldFn } from './shared';

interface MissionVisionFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
}

export function MissionVisionForm({ data, updateField }: MissionVisionFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner
        icon="ri-flag-line"
        color="#10B981"
        title="Sứ Mệnh & Tầm Nhìn"
        description="Giới thiệu sứ mệnh và tầm nhìn công ty."
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
      <div
        style={{
          background: 'rgba(245, 211, 147, 0.05)',
          border: '1px solid rgba(245, 211, 147, 0.2)',
          borderRadius: tokens.radius.md,
          padding: 16,
        }}
      >
        <h4
          style={{
            color: tokens.color.text,
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          Sứ Mệnh
        </h4>
        <IconPicker
          label="Icon"
          value={data.mission?.icon || ''}
          onChange={(v) => updateField('mission.icon', v)}
        />
        <Input
          label="Tiêu đề"
          value={data.mission?.title || ''}
          onChange={(v) => updateField('mission.title', v)}
          placeholder="Sứ Mệnh"
          fullWidth
          style={{ marginTop: 12 }}
        />
        <TextArea
          label="Nội dung"
          value={data.mission?.content || ''}
          onChange={(v) => updateField('mission.content', v)}
          fullWidth
          style={{ marginTop: 12 }}
        />
      </div>
      <div
        style={{
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: tokens.radius.md,
          padding: 16,
        }}
      >
        <h4
          style={{
            color: tokens.color.text,
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          Tầm Nhìn
        </h4>
        <IconPicker
          label="Icon"
          value={data.vision?.icon || ''}
          onChange={(v) => updateField('vision.icon', v)}
        />
        <Input
          label="Tiêu đề"
          value={data.vision?.title || ''}
          onChange={(v) => updateField('vision.title', v)}
          placeholder="Tầm Nhìn"
          fullWidth
          style={{ marginTop: 12 }}
        />
        <TextArea
          label="Nội dung"
          value={data.vision?.content || ''}
          onChange={(v) => updateField('vision.content', v)}
          fullWidth
          style={{ marginTop: 12 }}
        />
      </div>
    </div>
  );
}
