/**
 * MapEmbedInstructions Component
 * Instructions for getting Google Maps embed URL
 * Requirements: 3.2
 */

import { tokens } from '@app/shared';

interface MapEmbedInstructionsProps {
  urlError: string | null;
  hasInvalidUrl: boolean;
}

export function MapEmbedInstructions({ urlError, hasInvalidUrl }: MapEmbedInstructionsProps) {
  return (
    <>
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
    </>
  );
}
