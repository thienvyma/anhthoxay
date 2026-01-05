/**
 * InfoSection - API Key basic info section
 *
 * Displays: Name, Status, Key Prefix, Description, Scope, Endpoint Groups, Dates
 *
 * **Feature: admin-guide-api-keys**
 * **Validates: Requirements 14.1, 14.2**
 */

import { tokens } from '../../../../../theme';
import { getScopeLabel, getStatusBadge, formatDate } from '../ApiKeysList';
import { parseAllowedEndpoints } from './utils';
import type { ApiKey } from './types';

interface InfoSectionProps {
  apiKey: ApiKey;
  expiringSoon: boolean;
}

export function InfoSection({ apiKey, expiringSoon }: InfoSectionProps) {
  const statusBadge = getStatusBadge(apiKey.status);
  const endpointLabels = parseAllowedEndpoints(apiKey.allowedEndpoints);

  return (
    <>
      {/* API Key Name & Status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: tokens.radius.md,
            background: 'rgba(245, 211, 147, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <i className="ri-key-2-line" style={{ fontSize: 24, color: tokens.color.primary }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h4
              style={{
                margin: 0,
                color: tokens.color.text,
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              {apiKey.name}
            </h4>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                borderRadius: 12,
                background: statusBadge.bg,
                color: statusBadge.color,
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: statusBadge.color,
                }}
              />
              {statusBadge.label}
            </span>
            {expiringSoon && (
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                }}
              >
                Sắp hết hạn
              </span>
            )}
          </div>
          <p
            style={{
              margin: '6px 0 0',
              color: tokens.color.muted,
              fontSize: 12,
              fontFamily: 'monospace',
            }}
          >
            {apiKey.keyPrefix}...
          </p>
        </div>
      </div>

      {/* Description */}
      {apiKey.description && (
        <div style={{ marginBottom: 20 }}>
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
            Mô tả
          </label>
          <p
            style={{
              margin: 0,
              color: tokens.color.text,
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {apiKey.description}
          </p>
        </div>
      )}

      {/* Info Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Quyền */}
        <div>
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
            Quyền
          </label>
          <p
            style={{
              margin: 0,
              color: tokens.color.text,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {getScopeLabel(apiKey.scope)}
          </p>
        </div>

        {/* Nhóm API */}
        <div>
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
            Nhóm API
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {endpointLabels.length > 0 ? (
              endpointLabels.map((label) => (
                <span
                  key={label}
                  style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: tokens.color.surfaceHover,
                    color: tokens.color.text,
                    fontSize: 12,
                  }}
                >
                  {label}
                </span>
              ))
            ) : (
              <span style={{ color: tokens.color.muted, fontSize: 14 }}>Không có</span>
            )}
          </div>
        </div>

        {/* Ngày tạo */}
        <div>
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
            Ngày tạo
          </label>
          <p
            style={{
              margin: 0,
              color: tokens.color.text,
              fontSize: 14,
            }}
          >
            {formatDate(apiKey.createdAt)}
          </p>
        </div>
      </div>
    </>
  );
}
