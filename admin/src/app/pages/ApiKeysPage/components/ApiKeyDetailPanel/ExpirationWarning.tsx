/**
 * ExpirationWarning - Expiration warning banner component
 *
 * Displays warning banners for expiring or expired API keys
 *
 * **Feature: admin-guide-api-keys**
 * **Validates: Requirements 18.1, 18.2**
 */

import { tokens } from '../../../../../theme';
import { formatExpirationDate } from '../ApiKeysList';
import type { ApiKey } from './types';

interface ExpirationWarningProps {
  apiKey: ApiKey;
  expiringSoon: boolean;
  daysUntilExpiry: number | null;
}

export function ExpirationWarning({ apiKey, expiringSoon, daysUntilExpiry }: ExpirationWarningProps) {
  return (
    <>
      {/* Expiration Warning Banner - Validates: Requirements 18.1, 18.2 */}
      {expiringSoon && daysUntilExpiry !== null && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            marginBottom: 20,
            borderRadius: tokens.radius.md,
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}
        >
          <i
            className="ri-alarm-warning-line"
            style={{ fontSize: 20, color: '#f59e0b', flexShrink: 0 }}
          />
          <div>
            <p
              style={{
                margin: 0,
                color: '#f59e0b',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              API key sắp hết hạn
            </p>
            <p
              style={{
                margin: '4px 0 0',
                color: tokens.color.muted,
                fontSize: 12,
              }}
            >
              {daysUntilExpiry === 0
                ? 'Key này sẽ hết hạn hôm nay. Hãy gia hạn để tiếp tục sử dụng.'
                : daysUntilExpiry === 1
                ? 'Key này sẽ hết hạn trong 1 ngày. Hãy gia hạn để tiếp tục sử dụng.'
                : `Key này sẽ hết hạn trong ${daysUntilExpiry} ngày. Hãy gia hạn để tiếp tục sử dụng.`}
            </p>
          </div>
        </div>
      )}

      {/* Expired Warning Banner */}
      {apiKey.status === 'EXPIRED' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            marginBottom: 20,
            borderRadius: tokens.radius.md,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <i
            className="ri-error-warning-line"
            style={{ fontSize: 20, color: tokens.color.error, flexShrink: 0 }}
          />
          <div>
            <p
              style={{
                margin: 0,
                color: tokens.color.error,
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              API key đã hết hạn
            </p>
            <p
              style={{
                margin: '4px 0 0',
                color: tokens.color.muted,
                fontSize: 12,
              }}
            >
              Key này không còn hoạt động. Chỉnh sửa để gia hạn thời gian sử dụng.
            </p>
          </div>
        </div>
      )}

      {/* Expiration Date Display */}
      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: 'block',
            color: tokens.color.muted,
            fontSize: 12,
            fontWeight: 500,
            marginBottom: 6,
            textTransform: 'uppercase',
          }}
        >
          Ngày hết hạn
        </label>
        <p
          style={{
            margin: 0,
            color: expiringSoon
              ? '#f59e0b'
              : apiKey.status === 'EXPIRED'
              ? tokens.color.error
              : tokens.color.text,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {expiringSoon && <i className="ri-time-line" style={{ fontSize: 14 }} />}
          {apiKey.status === 'EXPIRED' && <i className="ri-error-warning-line" style={{ fontSize: 14 }} />}
          {formatExpirationDate(apiKey.expiresAt)}
        </p>
      </div>
    </>
  );
}
