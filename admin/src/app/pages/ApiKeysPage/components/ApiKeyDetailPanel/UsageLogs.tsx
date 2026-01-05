/**
 * UsageLogs - API Key usage logs table component
 *
 * Displays recent usage logs with: Time, Endpoint, Result
 *
 * **Feature: admin-guide-api-keys**
 * **Validates: Requirements 14.4**
 */

import { tokens } from '../../../../../theme';
import { getResultBadge, formatLogDate } from './utils';
import type { ApiKeyUsageLog } from './types';

interface UsageLogsProps {
  usageLogs: ApiKeyUsageLog[];
  loadingLogs: boolean;
}

export function UsageLogs({ usageLogs, loadingLogs }: UsageLogsProps) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <label
          style={{
            color: tokens.color.muted,
            fontSize: 12,
            fontWeight: 500,
            textTransform: 'uppercase',
          }}
        >
          Lịch sử sử dụng gần đây
        </label>
        {loadingLogs && (
          <i
            className="ri-loader-4-line ri-spin"
            style={{ fontSize: 14, color: tokens.color.muted }}
          />
        )}
      </div>

      {/* Usage Logs Table */}
      <div
        style={{
          background: tokens.color.surface,
          borderRadius: tokens.radius.md,
          border: `1px solid ${tokens.color.border}`,
          overflow: 'hidden',
        }}
      >
        {/* Table Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.5fr 0.8fr',
            gap: 12,
            padding: '10px 16px',
            borderBottom: `1px solid ${tokens.color.border}`,
            background: tokens.color.surfaceAlt,
          }}
        >
          <div
            style={{
              color: tokens.color.muted,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            Thời gian
          </div>
          <div
            style={{
              color: tokens.color.muted,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            Endpoint
          </div>
          <div
            style={{
              color: tokens.color.muted,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            Kết quả
          </div>
        </div>

        {/* Table Body */}
        {loadingLogs ? (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: tokens.color.muted,
            }}
          >
            <i className="ri-loader-4-line ri-spin" style={{ fontSize: 20 }} />
          </div>
        ) : usageLogs.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: tokens.color.muted,
              fontSize: 13,
            }}
          >
            Chưa có lịch sử sử dụng
          </div>
        ) : (
          usageLogs.map((log) => {
            const resultBadge = getResultBadge(log.statusCode);
            return (
              <div
                key={log.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.5fr 0.8fr',
                  gap: 12,
                  padding: '10px 16px',
                  borderBottom: `1px solid ${tokens.color.border}`,
                }}
              >
                <div
                  style={{
                    color: tokens.color.muted,
                    fontSize: 12,
                  }}
                >
                  {formatLogDate(log.createdAt)}
                </div>
                <div
                  style={{
                    color: tokens.color.text,
                    fontSize: 12,
                    fontFamily: 'monospace',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={`${log.method} ${log.endpoint}`}
                >
                  <span style={{ color: tokens.color.muted }}>{log.method}</span>{' '}
                  {log.endpoint}
                </div>
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: resultBadge.bg,
                      color: resultBadge.color,
                      fontSize: 10,
                      fontWeight: 500,
                    }}
                  >
                    {log.statusCode}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
