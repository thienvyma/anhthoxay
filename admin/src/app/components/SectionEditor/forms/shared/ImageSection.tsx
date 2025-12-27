/**
 * ImageSection Component
 * Image upload section with dropzone
 * Requirements: 3.4
 */

import { tokens } from '@app/shared';
import { ImageDropzone } from '../../../ImageDropzone';

interface ImageSectionProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
}

export function ImageSection({ label, value, onChange }: ImageSectionProps) {
  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: `1px solid ${tokens.color.border}`,
        borderRadius: tokens.radius.md,
        padding: 16,
      }}
    >
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: tokens.color.text,
          fontSize: 14,
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        <i className="ri-image-line" style={{ fontSize: 18 }} />
        {label}
      </label>
      <ImageDropzone
        value={value}
        onChange={onChange}
        onRemove={() => onChange('')}
        height={180}
      />
    </div>
  );
}
