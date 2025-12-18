import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { accountApi, type SessionInfo } from '../../api';
import { useUser } from '../../store';

interface AccountTabProps {
  onShowMessage: (message: string) => void;
  onError: (message: string) => void;
}

const glass = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
};

export function AccountTab({ onShowMessage, onError }: AccountTabProps) {
  const user = useUser();

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);

  // Load sessions - using ref to avoid infinite loop with onError callback
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const loadSessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      const data = await accountApi.getSessions();
      setSessions(data.sessions);
    } catch {
      onErrorRef.current('Không thể tải danh sách phiên đăng nhập');
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      onError('Mật khẩu mới không khớp');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      onError('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }

    try {
      setChangingPassword(true);
      await accountApi.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      onShowMessage('Đổi mật khẩu thành công! Tất cả phiên khác đã bị đăng xuất.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      loadSessions(); // Reload sessions
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đổi mật khẩu thất bại';
      onError(message);
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle revoke session
  const handleRevokeSession = async (sessionId: string) => {
    try {
      setRevokingSession(sessionId);
      await accountApi.revokeSession(sessionId);
      onShowMessage('Đã đăng xuất phiên này');
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch {
      onError('Không thể đăng xuất phiên này');
    } finally {
      setRevokingSession(null);
    }
  };

  // Handle revoke all other sessions
  const handleRevokeAllOthers = async () => {
    try {
      setRevokingSession('all');
      const result = await accountApi.revokeAllOtherSessions();
      onShowMessage(`Đã đăng xuất ${result.count} phiên khác`);
      loadSessions();
    } catch {
      onError('Không thể đăng xuất các phiên khác');
    } finally {
      setRevokingSession(null);
    }
  };

  // Parse user agent to friendly name
  const parseUserAgent = (ua: string | null): string => {
    if (!ua) return 'Không xác định';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Trình duyệt khác';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* User Info */}
      <div
        style={{
          ...glass,
          borderRadius: tokens.radius.lg,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h3 style={{ color: tokens.color.text, margin: '0 0 16px', fontSize: 18 }}>
          <i className="ri-user-line" style={{ marginRight: 8 }} />
          Thông tin tài khoản
        </h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ color: tokens.color.muted, width: 100 }}>Email:</span>
            <span style={{ color: tokens.color.text }}>{user?.email}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ color: tokens.color.muted, width: 100 }}>Tên:</span>
            <span style={{ color: tokens.color.text }}>{user?.name}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ color: tokens.color.muted, width: 100 }}>Vai trò:</span>
            <span
              style={{
                color: user?.role === 'ADMIN' ? tokens.color.primary : tokens.color.accent,
                fontWeight: 600,
              }}
            >
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div
        style={{
          ...glass,
          borderRadius: tokens.radius.lg,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h3 style={{ color: tokens.color.text, margin: '0 0 16px', fontSize: 18 }}>
          <i className="ri-lock-password-line" style={{ marginRight: 8 }} />
          Đổi mật khẩu
        </h3>
        <p style={{ color: tokens.color.muted, fontSize: 14, marginBottom: 16 }}>
          Sau khi đổi mật khẩu, tất cả các phiên đăng nhập khác sẽ bị đăng xuất.
        </p>
        <form onSubmit={handleChangePassword}>
          <div style={{ display: 'grid', gap: 16, maxWidth: 400 }}>
            <div>
              <label
                style={{
                  display: 'block',
                  color: tokens.color.muted,
                  fontSize: 13,
                  marginBottom: 6,
                }}
              >
                Mật khẩu hiện tại
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                }
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: tokens.radius.md,
                  color: tokens.color.text,
                  fontSize: 14,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  color: tokens.color.muted,
                  fontSize: 13,
                  marginBottom: 6,
                }}
              >
                Mật khẩu mới (tối thiểu 8 ký tự)
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                }
                required
                minLength={8}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: tokens.radius.md,
                  color: tokens.color.text,
                  fontSize: 14,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  color: tokens.color.muted,
                  fontSize: 13,
                  marginBottom: 6,
                }}
              >
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: tokens.radius.md,
                  color: tokens.color.text,
                  fontSize: 14,
                }}
              />
            </div>
            <motion.button
              type="submit"
              disabled={changingPassword}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '12px 24px',
                background: tokens.color.primary,
                border: 'none',
                borderRadius: tokens.radius.md,
                color: '#111',
                fontSize: 14,
                fontWeight: 600,
                cursor: changingPassword ? 'not-allowed' : 'pointer',
                opacity: changingPassword ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {changingPassword ? (
                <>
                  <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }} />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <i className="ri-lock-line" />
                  Đổi mật khẩu
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>

      {/* Active Sessions */}
      <div
        style={{
          ...glass,
          borderRadius: tokens.radius.lg,
          padding: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h3 style={{ color: tokens.color.text, margin: 0, fontSize: 18 }}>
            <i className="ri-device-line" style={{ marginRight: 8 }} />
            Phiên đăng nhập ({sessions.length}/5)
          </h3>
          {sessions.filter((s) => !s.isCurrent).length > 0 && (
            <motion.button
              onClick={handleRevokeAllOthers}
              disabled={revokingSession === 'all'}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '8px 16px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: tokens.radius.md,
                color: '#ef4444',
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <i className="ri-logout-box-line" />
              Đăng xuất tất cả phiên khác
            </motion.button>
          )}
        </div>

        <p style={{ color: tokens.color.muted, fontSize: 14, marginBottom: 16 }}>
          Tối đa 5 phiên đăng nhập cùng lúc. Phiên cũ nhất sẽ tự động bị đăng xuất khi vượt quá.
        </p>

        {loadingSessions ? (
          <div style={{ textAlign: 'center', padding: 40, color: tokens.color.muted }}>
            <i
              className="ri-loader-4-line"
              style={{ fontSize: 24, animation: 'spin 1s linear infinite' }}
            />
            <p>Đang tải...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: tokens.color.muted }}>
            Không có phiên đăng nhập nào
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {sessions.map((session) => (
              <div
                key={session.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 16,
                  background: session.isCurrent
                    ? 'rgba(245, 211, 147, 0.1)'
                    : 'rgba(0,0,0,0.2)',
                  border: session.isCurrent
                    ? `1px solid ${tokens.color.primary}40`
                    : '1px solid rgba(255,255,255,0.05)',
                  borderRadius: tokens.radius.md,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: tokens.radius.md,
                      background: session.isCurrent
                        ? tokens.color.primary
                        : 'rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: session.isCurrent ? '#111' : tokens.color.muted,
                    }}
                  >
                    <i className="ri-computer-line" style={{ fontSize: 20 }} />
                  </div>
                  <div>
                    <div style={{ color: tokens.color.text, fontWeight: 500, marginBottom: 4 }}>
                      {parseUserAgent(session.userAgent)}
                      {session.isCurrent && (
                        <span
                          style={{
                            marginLeft: 8,
                            padding: '2px 8px',
                            background: tokens.color.primary,
                            color: '#111',
                            fontSize: 11,
                            borderRadius: 4,
                            fontWeight: 600,
                          }}
                        >
                          Phiên hiện tại
                        </span>
                      )}
                    </div>
                    <div style={{ color: tokens.color.muted, fontSize: 12 }}>
                      IP: {session.ipAddress || 'Không xác định'} • Đăng nhập:{' '}
                      {formatDate(session.createdAt)}
                    </div>
                  </div>
                </div>
                {!session.isCurrent && (
                  <motion.button
                    onClick={() => handleRevokeSession(session.id)}
                    disabled={revokingSession === session.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '8px 12px',
                      background: 'transparent',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: tokens.radius.sm,
                      color: '#ef4444',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    {revokingSession === session.id ? (
                      <i
                        className="ri-loader-4-line"
                        style={{ animation: 'spin 1s linear infinite' }}
                      />
                    ) : (
                      <i className="ri-logout-box-line" />
                    )}
                  </motion.button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
}
