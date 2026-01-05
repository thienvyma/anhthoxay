import { useState, useEffect, useCallback } from 'react';
import { tokens } from '../../../theme';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { googleSheetsApi, GoogleSheetsStatus } from '../../api';

export function GoogleSheetsTab() {
  const [status, setStatus] = useState<GoogleSheetsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Form state
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [sheetName, setSheetName] = useState('Leads');
  const [syncEnabled, setSyncEnabled] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const data = await googleSheetsApi.getStatus();
      setStatus(data);
      setSpreadsheetId(data.spreadsheetId || '');
      setSheetName(data.sheetName || 'Leads');
      setSyncEnabled(data.syncEnabled);
    } catch (loadError) {
      console.error('Failed to load status:', loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleConnect = async () => {
    try {
      const { authUrl } = await googleSheetsApi.getAuthUrl();
      window.location.href = authUrl;
    } catch {
      setMessage({ type: 'error', text: 'Không thể kết nối Google Sheets' });
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Bạn có chắc muốn ngắt kết nối Google Sheets?')) return;
    
    try {
      await googleSheetsApi.disconnect();
      setStatus(null);
      setSpreadsheetId('');
      setSyncEnabled(false);
      setMessage({ type: 'success', text: 'Đã ngắt kết nối Google Sheets' });
      loadStatus();
    } catch {
      setMessage({ type: 'error', text: 'Không thể ngắt kết nối' });
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const result = await googleSheetsApi.updateSettings({
        spreadsheetId,
        sheetName,
        syncEnabled,
      });
      if (result.success) {
        setMessage({ type: 'success', text: 'Đã lưu cài đặt' });
        loadStatus();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch {
      setMessage({ type: 'error', text: 'Không thể lưu cài đặt' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const result = await googleSheetsApi.testConnection();
      setMessage({
        type: result.success ? 'success' : 'error',
        text: result.message,
      });
    } catch {
      setMessage({ type: 'error', text: 'Không thể kiểm tra kết nối' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48, color: tokens.color.muted }}>
        Đang tải...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Connection Status */}
      <Card title="Trạng thái kết nối" icon="ri-google-fill">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: status?.connected ? tokens.color.success : tokens.color.error,
          }} />
          <span style={{ color: tokens.color.text, fontSize: 16 }}>
            {status?.connected ? 'Đã kết nối' : 'Chưa kết nối'}
          </span>
        </div>
        
        {!status?.connected ? (
          <Button variant="primary" icon="ri-google-fill" onClick={handleConnect}>
            Kết nối Google Sheets
          </Button>
        ) : (
          <Button variant="outline" icon="ri-link-unlink" onClick={handleDisconnect}>
            Ngắt kết nối
          </Button>
        )}
      </Card>


      {/* Settings (only show when connected) */}
      {status?.connected && (
        <Card title="Cấu hình đồng bộ" icon="ri-settings-3-line">
          {message && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 8,
              marginBottom: 16,
              background: message.type === 'success' ? tokens.color.successBg : tokens.color.errorBg,
              border: `1px solid ${message.type === 'success' ? tokens.color.success : tokens.color.error}`,
              color: message.type === 'success' ? tokens.color.success : tokens.color.error,
            }}>
              <i className={message.type === 'success' ? 'ri-check-line' : 'ri-error-warning-line'} style={{ marginRight: 8 }} />
              {message.text}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Spreadsheet ID */}
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 8 }}>
                Spreadsheet ID
              </label>
              <input
                type="text"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: tokens.color.surfaceHover,
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: 8,
                  color: tokens.color.text,
                  fontSize: 14,
                }}
              />
              <p style={{ color: tokens.color.muted, fontSize: 12, marginTop: 4 }}>
                Lấy từ URL: https://docs.google.com/spreadsheets/d/<strong>[SPREADSHEET_ID]</strong>/edit
              </p>
            </div>

            {/* Sheet Name */}
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 8 }}>
                Tên Sheet
              </label>
              <input
                type="text"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                placeholder="Leads"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: tokens.color.surfaceHover,
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: 8,
                  color: tokens.color.text,
                  fontSize: 14,
                }}
              />
            </div>

            {/* Sync Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => setSyncEnabled(!syncEnabled)}
                style={{
                  width: 48,
                  height: 26,
                  borderRadius: 13,
                  border: 'none',
                  background: syncEnabled ? tokens.color.primary : tokens.color.surfaceHover,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#fff',
                  position: 'absolute',
                  top: 2,
                  left: syncEnabled ? 24 : 2,
                  transition: 'left 0.2s',
                }} />
              </button>
              <span style={{ color: tokens.color.text }}>
                Tự động đồng bộ leads mới
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <Button
                variant="primary"
                onClick={handleSaveSettings}
                disabled={saving}
              >
                {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
              </Button>
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing || !spreadsheetId}
              >
                {testing ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Sync Status */}
      {status?.connected && (
        <Card title="Thông tin đồng bộ" icon="ri-refresh-line">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ color: tokens.color.muted, fontSize: 13 }}>Lần đồng bộ cuối</div>
              <div style={{ color: tokens.color.text, fontSize: 16, marginTop: 4 }}>
                {status.lastSyncAt 
                  ? new Date(status.lastSyncAt).toLocaleString('vi-VN')
                  : 'Chưa có'}
              </div>
            </div>
            <div>
              <div style={{ color: tokens.color.muted, fontSize: 13 }}>Số lỗi</div>
              <div style={{ 
                color: status.errorCount > 0 ? tokens.color.error : tokens.color.success, 
                fontSize: 16, 
                marginTop: 4 
              }}>
                {status.errorCount}
              </div>
            </div>
          </div>
          {status.lastError && (
            <div style={{
              marginTop: 16,
              padding: 12,
              background: tokens.color.errorBg,
              borderRadius: 8,
              border: `1px solid ${tokens.color.error}40`,
            }}>
              <div style={{ color: tokens.color.error, fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                Lỗi gần nhất
              </div>
              <div style={{ color: tokens.color.muted, fontSize: 13 }}>
                {status.lastError}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Help */}
      <Card title="Hướng dẫn" icon="ri-question-line">
        <div style={{ color: tokens.color.muted, fontSize: 14, lineHeight: 1.6 }}>
          <p style={{ marginBottom: 12 }}>
            <strong>1. Tạo Google Spreadsheet:</strong> Tạo một spreadsheet mới trên Google Sheets
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong>2. Chia sẻ quyền:</strong> Đảm bảo tài khoản Google đã kết nối có quyền chỉnh sửa spreadsheet
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong>3. Cấu hình:</strong> Nhập Spreadsheet ID và tên sheet (mặc định: Leads)
          </p>
          <p>
            <strong>4. Bật đồng bộ:</strong> Bật tùy chọn "Tự động đồng bộ" để leads mới tự động được thêm vào spreadsheet
          </p>
        </div>
      </Card>
    </div>
  );
}
