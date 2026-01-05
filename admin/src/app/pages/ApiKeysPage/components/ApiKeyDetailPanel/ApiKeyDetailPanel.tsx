/**
 * ApiKeyDetailPanel - API Key Detail Panel Component
 *
 * Displays detailed information about an API key including:
 * - Tên, Mô tả, Quyền, Nhóm API, Ngày tạo, Ngày hết hạn
 * - Tổng số lần sử dụng, Lần sử dụng cuối
 * - Recent usage logs table (10 entries): Thời gian, Endpoint, Kết quả
 * - Edit and Delete buttons
 *
 * **Feature: admin-guide-api-keys**
 * **Validates: Requirements 14.1, 14.2, 14.3, 14.4**
 */

import { useState, useEffect } from 'react';
import { tokens } from '../../../../../theme';
import { Button } from '../../../../components/Button';
import { useResponsive } from '../../../../../hooks/useResponsive';
import { apiKeysApi } from '../../../../api';
import { isExpiringSoon, getDaysUntilExpiry } from '../ApiKeysList';
import { parseAllowedEndpointValues } from './utils';
import { InfoSection } from './InfoSection';
import { ExpirationWarning } from './ExpirationWarning';
import { UsageStats } from './UsageStats';
import { UsageLogs } from './UsageLogs';
import { EndpointGroups } from './EndpointGroups';
import type { ApiKeyDetailPanelProps, ApiKeyUsageLog } from './types';

/**
 * ApiKeyDetailPanel Component
 *
 * Slide-in panel showing detailed API key information and usage logs.
 *
 * **Feature: admin-guide-api-keys**
 * **Validates: Requirements 14.1, 14.2, 14.3, 14.4**
 */
export function ApiKeyDetailPanel({
  apiKey,
  onEdit,
  onDelete,
  onClose,
}: ApiKeyDetailPanelProps) {
  const { isMobile } = useResponsive();
  const [usageLogs, setUsageLogs] = useState<ApiKeyUsageLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Load usage logs when apiKey changes
  useEffect(() => {
    if (!apiKey) {
      setUsageLogs([]);
      return;
    }

    const loadLogs = async () => {
      setLoadingLogs(true);
      try {
        const logs = await apiKeysApi.getUsageLogs(apiKey.id, 10);
        setUsageLogs(logs);
      } catch (error) {
        console.error('Failed to load usage logs:', error);
        setUsageLogs([]);
      } finally {
        setLoadingLogs(false);
      }
    };

    loadLogs();
  }, [apiKey]);

  if (!apiKey) {
    return null;
  }

  const expiringSoon = isExpiringSoon(apiKey.expiresAt);
  const daysUntilExpiry = getDaysUntilExpiry(apiKey.expiresAt);
  const endpointValues = parseAllowedEndpointValues(apiKey.allowedEndpoints);

  return (
    <>
      {/* Overlay - click to close */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: tokens.color.overlay,
          zIndex: 999,
        }}
      />
      
      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: isMobile ? '100%' : 480,
          background: tokens.color.background,
          borderLeft: isMobile ? 'none' : `1px solid ${tokens.color.border}`,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          boxShadow: '-4px 0 24px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 20px',
            borderBottom: `1px solid ${tokens.color.border}`,
            background: tokens.color.surface,
          }}
        >
          {/* Back button for mobile */}
          {isMobile && (
            <button
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: tokens.radius.sm,
                border: 'none',
                background: 'transparent',
                color: tokens.color.text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <i className="ri-arrow-left-line" style={{ fontSize: 20 }} />
            </button>
          )}
          
          <h3
            style={{
              margin: 0,
              color: tokens.color.text,
              fontSize: 18,
              fontWeight: 600,
              flex: 1,
            }}
          >
            Chi tiết API Key
          </h3>
          
          {/* Close button - only on desktop */}
          {!isMobile && (
            <button
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: tokens.radius.sm,
                border: 'none',
                background: 'transparent',
                color: tokens.color.muted,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = tokens.color.surfaceHover;
                e.currentTarget.style.color = tokens.color.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = tokens.color.muted;
              }}
            >
              <i className="ri-close-line" style={{ fontSize: 20 }} />
            </button>
          )}
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 20,
          }}
        >
          <InfoSection apiKey={apiKey} expiringSoon={expiringSoon} />
          <ExpirationWarning 
            apiKey={apiKey} 
            expiringSoon={expiringSoon} 
            daysUntilExpiry={daysUntilExpiry} 
          />
          <UsageStats apiKey={apiKey} />
          <UsageLogs usageLogs={usageLogs} loadingLogs={loadingLogs} />
          <EndpointGroups endpointValues={endpointValues} />
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            padding: '16px 20px',
            borderTop: `1px solid ${tokens.color.border}`,
            background: tokens.color.surface,
          }}
        >
          <Button
            variant="secondary"
            onClick={onEdit}
            style={{ flex: 1 }}
          >
            <i className="ri-edit-line" style={{ marginRight: 8 }} />
            Chỉnh sửa
          </Button>
          <Button
            variant="secondary"
            onClick={onDelete}
            style={{
              flex: 1,
              color: tokens.color.error,
              borderColor: `${tokens.color.error}50`,
            }}
          >
            <i className="ri-delete-bin-line" style={{ marginRight: 8 }} />
            Xóa
          </Button>
        </div>
      </div>
    </>
  );
}
