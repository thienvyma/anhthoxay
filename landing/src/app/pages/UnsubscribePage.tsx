/**
 * Unsubscribe Landing Page
 *
 * Allows users to manage email notification preferences via unsubscribe link.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 21.2, 21.3**
 */

import { memo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { tokens, API_URL } from '@app/shared';

// ============================================
// TYPES
// ============================================

interface UnsubscribePageData {
  email: string;
  name: string;
  preferences: {
    emailEnabled: boolean;
    emailBidReceived: boolean;
    emailBidApproved: boolean;
    emailProjectMatched: boolean;
    emailNewMessage: boolean;
    emailEscrowReleased: boolean;
  };
}

interface PreferenceOption {
  key: keyof UnsubscribePageData['preferences'];
  label: string;
  description: string;
  isCritical: boolean;
}

// ============================================
// PREFERENCE OPTIONS
// ============================================

const PREFERENCE_OPTIONS: PreferenceOption[] = [
  {
    key: 'emailBidReceived',
    label: 'Thông báo nhận bid',
    description: 'Nhận email khi có nhà thầu gửi báo giá cho dự án của bạn',
    isCritical: false,
  },
  {
    key: 'emailBidApproved',
    label: 'Thông báo duyệt bid',
    description: 'Nhận email khi bid của bạn được duyệt hoặc từ chối',
    isCritical: false,
  },
  {
    key: 'emailNewMessage',
    label: 'Tin nhắn mới',
    description: 'Nhận email khi có tin nhắn mới trong cuộc hội thoại',
    isCritical: false,
  },
  {
    key: 'emailProjectMatched',
    label: 'Thông báo match dự án',
    description: 'Nhận email khi dự án được match với nhà thầu (quan trọng)',
    isCritical: true,
  },
  {
    key: 'emailEscrowReleased',
    label: 'Thông báo đặt cọc',
    description: 'Nhận email về trạng thái đặt cọc và giao dịch (quan trọng)',
    isCritical: true,
  },
];

// ============================================
// COMPONENT
// ============================================

export const UnsubscribePage = memo(function UnsubscribePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const action = searchParams.get('action');

  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    data: UnsubscribePageData | null;
    success: boolean;
    successMessage: string | null;
  }>({
    loading: true,
    error: null,
    data: null,
    success: false,
    successMessage: null,
  });

  const [preferences, setPreferences] = useState<UnsubscribePageData['preferences'] | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch page data
  useEffect(() => {
    if (!token) {
      setState({
        loading: false,
        error: 'Link không hợp lệ. Vui lòng sử dụng link từ email.',
        data: null,
        success: false,
        successMessage: null,
      });
      return;
    }

    fetch(`${API_URL}/unsubscribe?token=${token}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Token không hợp lệ hoặc đã hết hạn');
        }
        return res.json();
      })
      .then((json) => {
        const data = json.data || json;
        setState({
          loading: false,
          error: null,
          data,
          success: false,
          successMessage: null,
        });
        setPreferences(data.preferences);
      })
      .catch((err) => {
        setState({
          loading: false,
          error: err.message || 'Không thể tải thông tin. Vui lòng thử lại.',
          data: null,
          success: false,
          successMessage: null,
        });
      });
  }, [token]);

  // Handle preference toggle
  const handleToggle = useCallback((key: keyof UnsubscribePageData['preferences']) => {
    if (!preferences) return;

    // Don't allow disabling critical notifications
    const option = PREFERENCE_OPTIONS.find((o) => o.key === key);
    if (option?.isCritical && preferences[key]) {
      return;
    }

    setPreferences((prev) => (prev ? { ...prev, [key]: !prev[key] } : null));
  }, [preferences]);

  // Handle save preferences
  const handleSave = useCallback(async () => {
    if (!token || !preferences) return;

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/unsubscribe`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...preferences }),
      });

      if (!res.ok) {
        throw new Error('Không thể cập nhật cài đặt');
      }

      const json = await res.json();
      const result = json.data || json;

      setState((prev) => ({
        ...prev,
        success: true,
        successMessage: result.message || 'Cài đặt đã được cập nhật thành công.',
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Có lỗi xảy ra',
      }));
    } finally {
      setSaving(false);
    }
  }, [token, preferences]);

  // Handle quick unsubscribe
  const handleQuickUnsubscribe = useCallback(async () => {
    if (!token) return;

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/unsubscribe/quick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        throw new Error('Không thể hủy đăng ký');
      }

      const json = await res.json();
      const result = json.data || json;

      setState((prev) => ({
        ...prev,
        success: true,
        successMessage: result.message || 'Bạn đã hủy đăng ký nhận email thành công.',
      }));

      if (result.preferences) {
        setPreferences(result.preferences);
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Có lỗi xảy ra',
      }));
    } finally {
      setSaving(false);
    }
  }, [token]);

  // Loading state
  if (state.loading) {
    return (
      <div style={styles.container}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={styles.spinner}
        />
      </div>
    );
  }

  // Error state
  if (state.error && !state.data) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.iconError}>
            <i className="ri-error-warning-line" style={{ fontSize: '3rem' }} />
          </div>
          <h1 style={styles.title}>Không thể xử lý yêu cầu</h1>
          <p style={styles.description}>{state.error}</p>
        </div>
      </div>
    );
  }

  // Success state
  if (state.success) {
    return (
      <div style={styles.container}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={styles.card}
        >
          <div style={styles.iconSuccess}>
            <i className="ri-checkbox-circle-line" style={{ fontSize: '3rem' }} />
          </div>
          <h1 style={styles.title}>Thành công!</h1>
          <p style={styles.description}>{state.successMessage}</p>
          <p style={styles.note}>
            Bạn vẫn sẽ nhận được các thông báo quan trọng về giao dịch và đặt cọc.
          </p>
        </motion.div>
      </div>
    );
  }

  // Main content - show preferences or quick unsubscribe
  const showPreferences = action === 'preferences';

  return (
    <div style={styles.container}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={styles.card}
      >
        <div style={styles.iconEmail}>
          <i className="ri-mail-settings-line" style={{ fontSize: '3rem' }} />
        </div>

        <h1 style={styles.title}>Quản lý thông báo email</h1>

        {state.data && (
          <p style={styles.email}>
            Email: <strong>{state.data.email}</strong>
          </p>
        )}

        {showPreferences && preferences ? (
          <>
            <p style={styles.description}>
              Chọn loại thông báo bạn muốn nhận qua email:
            </p>

            <div style={styles.preferenceList}>
              {PREFERENCE_OPTIONS.map((option) => (
                <div
                  key={option.key}
                  style={{
                    ...styles.preferenceItem,
                    opacity: option.isCritical ? 0.7 : 1,
                  }}
                >
                  <div style={styles.preferenceInfo}>
                    <span style={styles.preferenceLabel}>
                      {option.label}
                      {option.isCritical && (
                        <span style={styles.criticalBadge}>Bắt buộc</span>
                      )}
                    </span>
                    <span style={styles.preferenceDescription}>
                      {option.description}
                    </span>
                  </div>
                  <label style={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={preferences[option.key]}
                      onChange={() => handleToggle(option.key)}
                      disabled={option.isCritical}
                      style={styles.toggleInput}
                    />
                    <span
                      style={{
                        ...styles.toggleSlider,
                        backgroundColor: preferences[option.key]
                          ? tokens.color.primary
                          : '#ccc',
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                ...styles.button,
                ...styles.buttonPrimary,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
            </button>
          </>
        ) : (
          <>
            <p style={styles.description}>
              Bạn có muốn hủy đăng ký nhận email từ Anh Thợ Xây?
            </p>

            <div style={styles.buttonGroup}>
              <button
                onClick={handleQuickUnsubscribe}
                disabled={saving}
                style={{
                  ...styles.button,
                  ...styles.buttonDanger,
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Đang xử lý...' : 'Hủy đăng ký tất cả'}
              </button>

              <a
                href={`?token=${token}&action=preferences`}
                style={{ ...styles.button, ...styles.buttonSecondary }}
              >
                Quản lý chi tiết
              </a>
            </div>

            <p style={styles.note}>
              <i className="ri-information-line" /> Bạn vẫn sẽ nhận được các thông
              báo quan trọng về giao dịch và đặt cọc theo quy định.
            </p>
          </>
        )}

        {state.error && (
          <p style={styles.errorMessage}>{state.error}</p>
        )}
      </motion.div>
    </div>
  );
});

// ============================================
// STYLES
// ============================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    background: `linear-gradient(135deg, ${tokens.color.background} 0%, #1a1a2e 100%)`,
  },
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '16px',
    padding: '2.5rem',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  spinner: {
    width: 50,
    height: 50,
    borderRadius: '50%',
    border: `4px solid ${tokens.color.border}`,
    borderTopColor: tokens.color.primary,
  },
  iconEmail: {
    color: tokens.color.primary,
    marginBottom: '1rem',
  },
  iconSuccess: {
    color: '#10b981',
    marginBottom: '1rem',
  },
  iconError: {
    color: '#ef4444',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '0.5rem',
  },
  email: {
    fontSize: '0.9rem',
    color: '#6b7280',
    marginBottom: '1.5rem',
  },
  description: {
    fontSize: '1rem',
    color: '#4b5563',
    marginBottom: '1.5rem',
    lineHeight: 1.6,
  },
  preferenceList: {
    textAlign: 'left',
    marginBottom: '1.5rem',
  },
  preferenceItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem',
    borderBottom: '1px solid #e5e7eb',
  },
  preferenceInfo: {
    flex: 1,
    marginRight: '1rem',
  },
  preferenceLabel: {
    display: 'block',
    fontWeight: 500,
    color: '#1f2937',
    marginBottom: '0.25rem',
  },
  preferenceDescription: {
    display: 'block',
    fontSize: '0.85rem',
    color: '#6b7280',
  },
  criticalBadge: {
    display: 'inline-block',
    marginLeft: '0.5rem',
    padding: '0.125rem 0.5rem',
    fontSize: '0.7rem',
    fontWeight: 500,
    color: '#b45309',
    background: '#fef3c7',
    borderRadius: '4px',
  },
  toggle: {
    position: 'relative',
    display: 'inline-block',
    width: '48px',
    height: '26px',
    flexShrink: 0,
  },
  toggleInput: {
    opacity: 0,
    width: 0,
    height: 0,
  },
  toggleSlider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '26px',
    transition: '0.3s',
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  button: {
    display: 'inline-block',
    padding: '0.875rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 500,
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    textAlign: 'center',
    transition: 'all 0.2s',
  },
  buttonPrimary: {
    background: tokens.color.primary,
    color: 'white',
  },
  buttonSecondary: {
    background: '#f3f4f6',
    color: '#374151',
  },
  buttonDanger: {
    background: '#ef4444',
    color: 'white',
  },
  note: {
    fontSize: '0.85rem',
    color: '#6b7280',
    padding: '1rem',
    background: '#f9fafb',
    borderRadius: '8px',
    lineHeight: 1.5,
  },
  errorMessage: {
    marginTop: '1rem',
    padding: '0.75rem',
    background: '#fef2f2',
    color: '#dc2626',
    borderRadius: '8px',
    fontSize: '0.9rem',
  },
};

export default UnsubscribePage;
