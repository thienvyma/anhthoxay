/**
 * Homeowner Profile Page
 *
 * Displays:
 * - User profile information
 * - Activity history tab (Requirement 23.1)
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 23.1**
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';
import { Layout } from '../../components/Layout';
import { ActivityHistory } from '../../components/ActivityHistory';
import { useToast } from '../../components/Toast';
import { authApi } from '../../api';

// Tab types
type ProfileTab = 'profile' | 'activity';

export function HomeownerProfilePage() {
  const { user, refreshToken } = useAuth();
  const { showToast } = useToast();

  // Tab state - Requirements: 23.1
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showToast('Mật khẩu mới không khớp', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Mật khẩu mới phải có ít nhất 6 ký tự', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      showToast('Đã đổi mật khẩu thành công', 'success');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Refresh token after password change
      if (refreshToken) {
        await refreshToken();
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      showToast('Không thể đổi mật khẩu. Vui lòng kiểm tra mật khẩu hiện tại.', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <Layout>
      <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 24 }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e4e7ec', marginBottom: 4 }}>
            Tài khoản
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: 14 }}>
            Quản lý thông tin cá nhân và xem lịch sử hoạt động
          </p>
        </motion.div>

        {/* Tab Navigation - Requirements: 23.1 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{
            display: 'flex',
            gap: 4,
            marginBottom: 24,
            background: 'rgba(255, 255, 255, 0.02)',
            padding: 4,
            borderRadius: 12,
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'profile' ? 'rgba(245, 211, 147, 0.15)' : 'transparent',
              color: activeTab === 'profile' ? '#f5d393' : '#a1a1aa',
              fontWeight: activeTab === 'profile' ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <i className="ri-user-line" />
            Thông tin
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'activity' ? 'rgba(245, 211, 147, 0.15)' : 'transparent',
              color: activeTab === 'activity' ? '#f5d393' : '#a1a1aa',
              fontWeight: activeTab === 'activity' ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <i className="ri-history-line" />
            Hoạt động
          </button>
        </motion.div>

        {/* Activity Tab Content - Requirements: 23.1 */}
        {activeTab === 'activity' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
            style={{ padding: 24 }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e4e7ec', marginBottom: 20 }}>
              Lịch sử hoạt động
            </h2>
            <ActivityHistory showFilters={true} />
          </motion.div>
        )}

        {/* Profile Tab Content */}
        {activeTab === 'profile' && (
          <>
            {/* User Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card"
              style={{ padding: 24, marginBottom: 24 }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e4e7ec', marginBottom: 20 }}>
                Thông tin cá nhân
              </h2>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f5d393 0%, #d4a574 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32,
                    fontWeight: 700,
                    color: '#18181b',
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 600, color: '#e4e7ec', marginBottom: 4 }}>
                    {user?.name || 'Người dùng'}
                  </h3>
                  <p style={{ color: '#a1a1aa', fontSize: 14 }}>{user?.email}</p>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: 8,
                      padding: '4px 12px',
                      borderRadius: 20,
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: '#3b82f6',
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    Chủ nhà
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16,
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#71717a', marginBottom: 4 }}>
                    Họ tên
                  </label>
                  <p style={{ color: '#e4e7ec', fontSize: 15 }}>{user?.name || '-'}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#71717a', marginBottom: 4 }}>
                    Email
                  </label>
                  <p style={{ color: '#e4e7ec', fontSize: 15 }}>{user?.email || '-'}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#71717a', marginBottom: 4 }}>
                    Số điện thoại
                  </label>
                  <p style={{ color: '#e4e7ec', fontSize: 15 }}>{user?.phone || '-'}</p>
                </div>
              </div>
            </motion.div>

            {/* Security Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="card"
              style={{ padding: 24 }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e4e7ec', marginBottom: 20 }}>
                Bảo mật
              </h2>

              {!showPasswordForm ? (
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(true)}
                  style={{
                    padding: '12px 20px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 8,
                    color: '#e4e7ec',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 14,
                  }}
                >
                  <i className="ri-lock-line" />
                  Đổi mật khẩu
                </button>
              ) : (
                <form onSubmit={handleChangePassword}>
                  <div style={{ marginBottom: 16 }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 14,
                        fontWeight: 500,
                        color: '#e4e7ec',
                        marginBottom: 8,
                      }}
                    >
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="input"
                      required
                    />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 14,
                        fontWeight: 500,
                        color: '#e4e7ec',
                        marginBottom: 8,
                      }}
                    >
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input"
                      required
                      minLength={6}
                    />
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 14,
                        fontWeight: 500,
                        color: '#e4e7ec',
                        marginBottom: 8,
                      }}
                    >
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input"
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      style={{
                        padding: '12px 20px',
                        background: '#f5d393',
                        border: 'none',
                        borderRadius: 8,
                        color: '#18181b',
                        fontWeight: 600,
                        cursor: isChangingPassword ? 'not-allowed' : 'pointer',
                        opacity: isChangingPassword ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      {isChangingPassword && <i className="ri-loader-4-line spinner" />}
                      {isChangingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      style={{
                        padding: '12px 20px',
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 8,
                        color: '#a1a1aa',
                        cursor: 'pointer',
                      }}
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </>
        )}
      </div>
    </Layout>
  );
}

export default HomeownerProfilePage;
