import { useState, useId } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/Toast';

/**
 * Login Page with accessibility support
 * Requirements: 26.3 - ARIA labels and roles, 26.5 - Form labels
 */
export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  
  // Generate unique IDs for form fields
  const emailId = useId();
  const passwordId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      showToast('Vui lòng nhập email và mật khẩu', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      showToast('Đăng nhập thành công!', 'success');
    } catch (error) {
      showToast((error as Error).message || 'Đăng nhập thất bại', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        padding: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--bg-secondary)',
          borderRadius: 16,
          padding: 32,
          border: '1px solid var(--border)',
        }}
        role="main"
        aria-labelledby="login-heading"
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 
            id="login-heading"
            style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}
          >
            Đăng nhập
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Chào mừng bạn quay trở lại
          </p>
        </div>

        <form onSubmit={handleSubmit} aria-label="Form đăng nhập">
          <div style={{ marginBottom: 20 }} className="form-field">
            <label
              htmlFor={emailId}
              style={{
                display: 'block',
                marginBottom: 8,
                color: 'var(--text-primary)',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Email
              <span className="sr-only"> (bắt buộc)</span>
            </label>
            <input
              id={emailId}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="input"
              style={{ width: '100%' }}
              required
              autoComplete="email"
              aria-required="true"
            />
          </div>

          <div style={{ marginBottom: 24 }} className="form-field">
            <label
              htmlFor={passwordId}
              style={{
                display: 'block',
                marginBottom: 8,
                color: 'var(--text-primary)',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Mật khẩu
              <span className="sr-only"> (bắt buộc)</span>
            </label>
            <input
              id={passwordId}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
              style={{ width: '100%' }}
              required
              autoComplete="current-password"
              aria-required="true"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: 16,
              fontWeight: 600,
              opacity: isLoading ? 0.7 : 1,
            }}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="ri-loader-4-line spinner" aria-hidden="true" />
                <span>Đang đăng nhập...</span>
              </span>
            ) : (
              'Đăng nhập'
            )}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Chưa có tài khoản?{' '}
            <Link
              to="/auth/register"
              style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Link
            to="/"
            style={{
              color: 'var(--text-muted)',
              fontSize: 13,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <i className="ri-arrow-left-line" aria-hidden="true" />
            Quay lại trang chủ
          </Link>
        </div>

        {/* Quick Login Buttons - DEV ONLY */}
        {process.env.NODE_ENV !== 'production' && (
          <div
            style={{
              marginTop: 24,
              padding: 16,
              background: 'var(--bg-tertiary)',
              borderRadius: 12,
              border: '1px dashed var(--border)',
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                marginBottom: 12,
                textAlign: 'center',
              }}
            >
              🧪 Quick Login (Dev Only)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@anhthoxay.vn');
                  setPassword('Admin@123');
                }}
                className="btn"
                style={{
                  padding: '8px 12px',
                  fontSize: 13,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <i className="ri-admin-line" style={{ color: 'var(--error)' }} />
                Admin
                <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 'auto' }}>
                  admin@anhthoxay.vn
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('chunha1@gmail.com');
                  setPassword('User@123');
                }}
                className="btn"
                style={{
                  padding: '8px 12px',
                  fontSize: 13,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <i className="ri-home-heart-line" style={{ color: 'var(--info)' }} />
                Chủ nhà
                <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 'auto' }}>
                  chunha1@gmail.com
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('nhathau1@gmail.com');
                  setPassword('User@123');
                }}
                className="btn"
                style={{
                  padding: '8px 12px',
                  fontSize: 13,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <i className="ri-tools-line" style={{ color: 'var(--success)' }} />
                Nhà thầu (Verified)
                <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 'auto' }}>
                  nhathau1@gmail.com
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('nhathau3@gmail.com');
                  setPassword('User@123');
                }}
                className="btn"
                style={{
                  padding: '8px 12px',
                  fontSize: 13,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <i className="ri-tools-line" style={{ color: 'var(--warning)' }} />
                Nhà thầu (Pending)
                <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 'auto' }}>
                  nhathau3@gmail.com
                </span>
              </button>
            </div>
            <p
              style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                marginTop: 8,
                textAlign: 'center',
              }}
            >
              Password: User@123 (homeowner/contractor) | Admin@123 (admin)
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
