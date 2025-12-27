/**
 * ContactInfoForm Component
 * Form for CONTACT_INFO section type
 * Requirements: 3.2
 */

import { useState } from 'react';
import { tokens } from '@app/shared';
import { Input } from '../../Input';
import { ArraySection } from './shared';
import type {
  DataRecord,
  UpdateFieldFn,
  AddArrayItemFn,
  RemoveArrayItemFn,
} from './shared';
import { generateUniqueId } from '../utils';

interface ContactInfoFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
  addArrayItem: AddArrayItemFn;
  removeArrayItem: RemoveArrayItemFn;
}

// Check if URL is a valid Google Maps embed URL
function isValidEmbedUrl(url: string): boolean {
  if (!url) return true; // Empty is valid (no map)
  return (
    url.includes('google.com/maps/embed') ||
    url.includes('google.com/maps/d/embed')
  );
}

// Extract URL from iframe tag if user pastes the whole iframe code
function extractUrlFromInput(input: string): string {
  const trimmed = input.trim();

  // If input contains iframe tag, extract src URL
  if (trimmed.includes('<iframe') && trimmed.includes('src=')) {
    // Try to extract src with double quotes first
    let srcMatch = trimmed.match(/src="([^"]+)"/);
    if (srcMatch && srcMatch[1]) {
      return srcMatch[1];
    }
    // Try single quotes
    srcMatch = trimmed.match(/src='([^']+)'/);
    if (srcMatch && srcMatch[1]) {
      return srcMatch[1];
    }
  }

  // Otherwise return as-is
  return trimmed;
}

export function ContactInfoForm({
  data,
  updateField,
  addArrayItem,
  removeArrayItem,
}: ContactInfoFormProps) {
  const [urlError, setUrlError] = useState<string | null>(null);

  // Handle map URL change with validation
  const handleMapUrlChange = (value: string) => {
    // Extract URL from iframe tag if user pastes the whole code
    const extractedUrl = extractUrlFromInput(value);

    // Clear error if empty
    if (!extractedUrl) {
      setUrlError(null);
      updateField('mapEmbedUrl', '');
      return;
    }

    // Check if it's a valid embed URL
    if (isValidEmbedUrl(extractedUrl)) {
      setUrlError(null);
      updateField('mapEmbedUrl', extractedUrl);
    } else {
      // Show error but still save the value so user can see what they entered
      setUrlError(
        'URL không hợp lệ. Vui lòng sử dụng Embed URL từ Google Maps (xem hướng dẫn bên dưới)'
      );
      updateField('mapEmbedUrl', extractedUrl);
    }
  };

  const currentUrl = (data.mapEmbedUrl as string) || '';
  const hasInvalidUrl = currentUrl && !isValidEmbedUrl(currentUrl);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Input
        label="Tiêu đề section"
        value={data.title || ''}
        onChange={(v) => updateField('title', v)}
        fullWidth
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16,
        }}
      >
        <Input
          label="Số điện thoại"
          value={data.phone || ''}
          onChange={(v) => updateField('phone', v)}
          fullWidth
        />
        <Input
          label="Email"
          value={data.email || ''}
          onChange={(v) => updateField('email', v)}
          fullWidth
        />
      </div>
      <Input
        label="Địa chỉ"
        value={data.address || ''}
        onChange={(v) => updateField('address', v)}
        fullWidth
      />
      <ArraySection
        label="Giờ làm việc"
        items={data.hours || []}
        onAdd={() =>
          addArrayItem('hours', {
            _id: generateUniqueId(),
            day: 'Thứ 2 - Thứ 6',
            time: '08:00 - 18:00',
          })
        }
        onRemove={(idx) => removeArrayItem('hours', idx)}
        renderItem={(item, idx) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              value={item.day || ''}
              onChange={(v) => updateField(`hours.${idx}.day`, v)}
              placeholder="Thứ 2 - Thứ 6"
              fullWidth
            />
            <Input
              value={item.time || ''}
              onChange={(v) => updateField(`hours.${idx}.time`, v)}
              placeholder="08:00 - 18:00"
              fullWidth
            />
          </div>
        )}
      />
      <div>
        <Input
          label="Google Maps Embed URL"
          value={currentUrl}
          onChange={handleMapUrlChange}
          placeholder="https://www.google.com/maps/embed?pb=..."
          fullWidth
        />

        {/* Error message */}
        {(urlError || hasInvalidUrl) && (
          <div
            style={{
              marginTop: 8,
              padding: 10,
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: tokens.radius.sm,
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <i
              className="ri-error-warning-line"
              style={{ color: tokens.color.error, fontSize: 16 }}
            />
            <span style={{ color: tokens.color.error, fontSize: 13 }}>
              {urlError ||
                'URL không hợp lệ. Vui lòng sử dụng Embed URL từ Google Maps'}
            </span>
          </div>
        )}

        {/* Instructions */}
        <div
          style={{
            marginTop: 8,
            padding: 12,
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: tokens.radius.sm,
            border: '1px solid rgba(59, 130, 246, 0.2)',
          }}
        >
          <p
            style={{
              color: tokens.color.info,
              fontSize: 13,
              margin: 0,
              fontWeight: 500,
            }}
          >
            <i className="ri-information-line" style={{ marginRight: 6 }} />
            Cách lấy Embed URL:
          </p>
          <ol
            style={{
              color: tokens.color.muted,
              fontSize: 12,
              margin: '8px 0 0',
              paddingLeft: 20,
              lineHeight: 1.8,
            }}
          >
            <li>Mở Google Maps và tìm địa điểm của bạn</li>
            <li>
              Click vào nút <strong>Chia sẻ</strong> (biểu tượng mũi tên)
            </li>
            <li>
              Chọn tab <strong>"Nhúng bản đồ"</strong> (Embed a map)
            </li>
            <li>
              Click <strong>"SAO CHÉP HTML"</strong> và paste vào ô trên
              (hệ thống sẽ tự động lấy URL)
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
