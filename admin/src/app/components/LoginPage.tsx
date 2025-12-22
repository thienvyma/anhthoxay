import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { Input } from './Input';
import { Button } from './Button';
import { authApi } from '../api';
import { store } from '../store';

export function LoginPage() {
  const [email, setEmail] = useState('admin@anhthoxay.vn');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double-click
    if (loading) return;
    
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login(email, password);
      store.setUser(response.user as Parameters<typeof store.setUser>[0]);
    } catch (err) {
      const errorMessage = (err as Error).message || 'Login failed';
      // Handle network errors more gracefully
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, loading]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: tokens.color.background,
        padding: 24,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'rgba(20,21,26,0.95)',
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.lg,
          padding: 40,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 80,
              height: 80,
              margin: '0 auto 16px',
              borderRadius: tokens.radius.md,
              background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              color: '#111',
            }}
          >
            <i className="ri-admin-line" />
          </div>
          <h1 style={{ color: tokens.color.text, fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>
            Admin Dashboard
          </h1>
          <p style={{ color: tokens.color.muted, fontSize: 14, margin: 0 }}>
            Đăng nhập để quản lý hệ thống Anh Thợ Xây
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: 12,
                background: 'rgba(239,68,68,0.1)',
                border: `1px solid ${tokens.color.error}`,
                borderRadius: tokens.radius.md,
                color: tokens.color.error,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <i className="ri-error-warning-line" />
              {error}
            </motion.div>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="admin@example.com"
            icon="ri-mail-line"
            required
            fullWidth
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
            icon="ri-lock-line"
            required
            fullWidth
          />

          <Button type="submit" variant="primary" loading={loading} fullWidth icon="ri-login-circle-line">
            Sign In
          </Button>
        </form>

        {/* Info */}
        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: 'rgba(245,211,147,0.05)',
            border: `1px solid ${tokens.color.primary}40`,
            borderRadius: tokens.radius.md,
            fontSize: 13,
            color: tokens.color.muted,
          }}
        >
          <div style={{ color: tokens.color.primary, fontWeight: 600, marginBottom: 8 }}>
            <i className="ri-information-line" style={{ marginRight: 4 }} />
            Demo Credentials
          </div>
          <div>Email: admin@anhthoxay.vn</div>
          <div>Password: Admin@123</div>
        </div>
      </motion.div>
    </div>
  );
}

