/**
 * TestApiKeyModal - Test API Key Modal Component
 *
 * Modal for testing API keys with:
 * - Dropdown to select test endpoint
 * - "Chạy Test" button
 * - Display result: success (green) or error (red)
 * - Show response time in milliseconds
 * - Show error reason if failed
 *
 * **Feature: admin-guide-api-keys**
 * **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.6**
 */

import { useState } from 'react';
import { tokens } from '../../../../theme';
import { ResponsiveModal } from '../../../../components/responsive';
import { Button } from '../../../components/Button';
import { useResponsive } from '../../../../hooks/useResponsive';
import { apiKeysApi } from '../../../api';
import type { ApiKey } from '../../../api/api-keys';

// ============================================
// TYPES
// ============================================

export interface TestApiKeyModalProps {
  isOpen: boolean;
  apiKey: ApiKey | null;
  onClose: () => void;
}

/**
 * Local type for test result to avoid unknown type issues
 */
interface LocalTestResult {
  success: boolean;
  statusCode: number;
  responseTime: number;
  message: string;
  data?: Record<string, unknown>;
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Test endpoint options
 * **Validates: Requirements 13.2**
 */
const TEST_ENDPOINTS: Array<{ value: string; label: string; description: string }> = [
  {
    value: '/api/external/health',
    label: 'Kiểm tra kết nối',
    description: 'Kiểm tra API key có hoạt động không',
  },
  {
    value: '/api/external/leads',
    label: 'Lấy danh sách Leads',
    description: 'Yêu cầu quyền truy cập nhóm Leads',
  },
  {
    value: '/api/external/blog/posts',
    label: 'Lấy danh sách Blog',
    description: 'Yêu cầu quyền truy cập nhóm Blog',
  },
  {
    value: '/api/external/projects',
    label: 'Lấy danh sách Công trình',
    description: 'Yêu cầu quyền truy cập nhóm Công trình',
  },
  {
    value: '/api/external/contractors',
    label: 'Lấy danh sách Nhà thầu',
    description: 'Yêu cầu quyền truy cập nhóm Nhà thầu',
  },
];

// ============================================
// COMPONENT
// ============================================

/**
 * TestApiKeyModal Component
 *
 * Modal for testing API keys by making internal API calls.
 *
 * **Feature: admin-guide-api-keys**
 * **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.6**
 */
export function TestApiKeyModal({ isOpen, apiKey, onClose }: TestApiKeyModalProps) {
  const { isMobile } = useResponsive();

  // State
  const [selectedEndpoint, setSelectedEndpoint] = useState(TEST_ENDPOINTS[0].value);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<LocalTestResult | null>(null);

  // Reset state when modal closes
  const handleClose = () => {
    setSelectedEndpoint(TEST_ENDPOINTS[0].value);
    setTesting(false);
    setResult(null);
    onClose();
  };

  // Run test
  const handleRunTest = async () => {
    if (!apiKey) return;

    setTesting(true);
    setResult(null);

    try {
      const testResult = await apiKeysApi.testKey(apiKey.id, selectedEndpoint);
      setResult({
        success: testResult.success,
        statusCode: testResult.statusCode,
        responseTime: testResult.responseTime,
        message: testResult.message,
        data: testResult.data as Record<string, unknown> | undefined,
      });
    } catch (error) {
      console.error('Test API key error:', error);
      setResult({
        success: false,
        statusCode: 500,
        responseTime: 0,
        message: error instanceof Error ? error.message : 'Lỗi không xác định',
      });
    } finally {
      setTesting(false);
    }
  };

  // Get selected endpoint info
  const selectedEndpointInfo = TEST_ENDPOINTS.find((e) => e.value === selectedEndpoint);

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Test API Key"
      size="md"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={testing}
            style={{ width: isMobile ? '100%' : 'auto' }}
          >
            Đóng
          </Button>
          <Button
            onClick={handleRunTest}
            disabled={testing || !apiKey}
            style={{ width: isMobile ? '100%' : 'auto' }}
          >
            {testing ? (
              <>
                <i className="ri-loader-4-line ri-spin" style={{ marginRight: 8 }} />
                Đang test...
              </>
            ) : (
              <>
                <i className="ri-play-line" style={{ marginRight: 8 }} />
                Chạy Test
              </>
            )}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* API Key Info */}
        {apiKey && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 16,
              background: tokens.color.surfaceAlt,
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.border}`,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: tokens.radius.sm,
                background: 'rgba(245, 211, 147, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <i className="ri-key-2-line" style={{ fontSize: 20, color: tokens.color.primary }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  color: tokens.color.text,
                  fontWeight: 500,
                  fontSize: 14,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {apiKey.name}
              </p>
              <p
                style={{
                  margin: '2px 0 0',
                  color: tokens.color.muted,
                  fontSize: 12,
                  fontFamily: 'monospace',
                }}
              >
                {apiKey.keyPrefix}...
              </p>
            </div>
            <div
              style={{
                padding: '4px 8px',
                borderRadius: tokens.radius.sm,
                background:
                  apiKey.status === 'ACTIVE'
                    ? 'rgba(34, 197, 94, 0.15)'
                    : apiKey.status === 'INACTIVE'
                    ? 'rgba(156, 163, 175, 0.15)'
                    : 'rgba(239, 68, 68, 0.15)',
                color:
                  apiKey.status === 'ACTIVE'
                    ? tokens.color.success
                    : apiKey.status === 'INACTIVE'
                    ? tokens.color.muted
                    : tokens.color.error,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {apiKey.status === 'ACTIVE'
                ? 'Hoạt động'
                : apiKey.status === 'INACTIVE'
                ? 'Tắt'
                : 'Hết hạn'}
            </div>
          </div>
        )}

        {/* Endpoint Selection */}
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: 8,
              color: tokens.color.text,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Chọn endpoint để test
          </label>
          <select
            value={selectedEndpoint}
            onChange={(e) => {
              setSelectedEndpoint(e.target.value);
              setResult(null);
            }}
            disabled={testing}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.border}`,
              background: tokens.color.surfaceAlt,
              color: tokens.color.text,
              fontSize: 14,
              minHeight: '44px',
              cursor: testing ? 'not-allowed' : 'pointer',
              opacity: testing ? 0.6 : 1,
            }}
          >
            {TEST_ENDPOINTS.map((endpoint) => (
              <option key={endpoint.value} value={endpoint.value}>
                {endpoint.label}
              </option>
            ))}
          </select>
          {selectedEndpointInfo && (
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 12,
                color: tokens.color.muted,
              }}
            >
              <i className="ri-information-line" style={{ marginRight: 4 }} />
              {selectedEndpointInfo.description}
            </p>
          )}
        </div>

        {/* Test Result */}
        {result !== null && (
          <div
            style={{
              padding: 16,
              borderRadius: tokens.radius.md,
              border: `1px solid ${result.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              background: result.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            }}
          >
            {/* Result Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: result.success ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <i
                  className={result.success ? 'ri-check-line' : 'ri-close-line'}
                  style={{
                    fontSize: 24,
                    color: result.success ? tokens.color.success : tokens.color.error,
                  }}
                />
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    color: result.success ? tokens.color.success : tokens.color.error,
                    fontWeight: 600,
                    fontSize: 16,
                  }}
                >
                  {result.success ? 'Test thành công!' : 'Test thất bại'}
                </p>
                <p
                  style={{
                    margin: '2px 0 0',
                    color: tokens.color.muted,
                    fontSize: 13,
                  }}
                >
                  {result.message}
                </p>
              </div>
            </div>

            {/* Result Details */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                gap: 12,
                padding: 12,
                background: tokens.color.surfaceAlt,
                borderRadius: tokens.radius.sm,
              }}
            >
              {/* Status Code */}
              <div>
                <p
                  style={{
                    margin: 0,
                    color: tokens.color.muted,
                    fontSize: 12,
                    marginBottom: 4,
                  }}
                >
                  Status Code
                </p>
                <p
                  style={{
                    margin: 0,
                    color: tokens.color.text,
                    fontSize: 14,
                    fontWeight: 500,
                    fontFamily: 'monospace',
                  }}
                >
                  {result.statusCode}
                </p>
              </div>

              {/* Response Time */}
              <div>
                <p
                  style={{
                    margin: 0,
                    color: tokens.color.muted,
                    fontSize: 12,
                    marginBottom: 4,
                  }}
                >
                  Thời gian phản hồi
                </p>
                <p
                  style={{
                    margin: 0,
                    color: tokens.color.text,
                    fontSize: 14,
                    fontWeight: 500,
                    fontFamily: 'monospace',
                  }}
                >
                  {result.responseTime} ms
                </p>
              </div>
            </div>

            {/* Response Data Preview (if success) */}
            {result.success && result.data && (
              <div style={{ marginTop: 12 }}>
                <p
                  style={{
                    margin: '0 0 8px',
                    color: tokens.color.muted,
                    fontSize: 12,
                  }}
                >
                  Response Preview
                </p>
                <pre
                  style={{
                    margin: 0,
                    padding: 12,
                    background: tokens.color.surfaceAlt,
                    borderRadius: tokens.radius.sm,
                    color: tokens.color.text,
                    fontSize: 12,
                    fontFamily: 'monospace',
                    overflow: 'auto',
                    maxHeight: 120,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  {String(JSON.stringify(result.data, null, 2))}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        {!result && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: 16,
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: tokens.radius.md,
              border: '1px solid rgba(59, 130, 246, 0.2)',
            }}
          >
            <i
              className="ri-lightbulb-line"
              style={{
                fontSize: 18,
                color: tokens.color.info,
                flexShrink: 0,
                marginTop: 2,
              }}
            />
            <div>
              <p
                style={{
                  margin: 0,
                  color: tokens.color.text,
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                Test sẽ gửi một request GET đến endpoint đã chọn sử dụng API key này.
                Kết quả sẽ cho biết API key có hoạt động đúng và có quyền truy cập endpoint hay không.
              </p>
            </div>
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
}
