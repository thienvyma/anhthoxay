/**
 * UsageStats - API Key usage statistics component
 *
 * Displays: Total usage count, Last used date
 *
 * **Feature: admin-guide-api-keys**
 * **Validates: Requirements 14.3**
 */

import { tokens } from '../../../../../theme';
import { formatDate } from '../ApiKeysList';
import type { ApiKey } from './types';

interface UsageStatsProps {
  apiKey: ApiKey;
}

export function UsageStats({ apiKey }: UsageStatsProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 16,
        marginBottom: 24,
      }}
    >
      {/* Tổng số lần sử dụng */}
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
          Tổng số lần sử dụng
        </label>
        <p
          style={{
            margin: 0,
            color: tokens.color.text,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {apiKey.usageCount.toLocaleString('vi-VN')}
        </p>
      </div>

      {/* Lần sử dụng cuối */}
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
          Lần sử dụng cuối
        </label>
        <p
          style={{
            margin: 0,
            color: tokens.color.text,
            fontSize: 14,
          }}
        >
          {formatDate(apiKey.lastUsedAt)}
        </p>
      </div>
    </div>
  );
}
