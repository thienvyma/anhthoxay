import { useState, useId } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/Toast';

type AccountType = 'homeowner' | 'contractor';

/**
 * Register Page with accessibility support
 * Requirements: 26.3 - ARIA labels and roles, 26.5 - Form labels
 */
export function RegisterPage() {
  const [accountType, setAccountType] = useState<AccountType>('homeowner');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPendingMessage, setShowPendingMessage] = useState(false);
  
  const { register } = useAuth();
  const { showToast } = useToast();
  
  // Generate unique IDs for form fields
  const nameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const accountTypeGroupId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      showToast('Vui lòng điền đầy đủ thông tin', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Mật khẩu phải có ít nhất 6 ký tự', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const result = await register({
        name,
        email,
        phone,
        password,
        accountType,
      });

      if (result.autoApproved) {
        showToast('Đăng ký thành công!', 'success');
      } else {
        // Contractor needs verification
        setShowPendingMessage(true);
      }
    } catch (error) {
      showToast((error as Error).message || 'Đăng ký thất bại', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (showPendingMessage) {
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            width: '100%',
            maxWidth: 480,
            background: 'var(--bg-secondary)',
            borderRadius: 16,
            padding: 40,
            border: '1px solid var(--border)',
            textAlign: 'center',
          }}
          role="main"
          aria-labelledby="pending-heading"
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'var(--warning-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
            aria-hidden="true"
          >
            <i className="ri-time-line" style={{ fontSize: 40, color: 'var(--warning)' }} />
          </div>
          
          <h2 
            id="pending-heading"
            style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}
          >
            Đăng ký thành công!
          </h2>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
            Tài khoản nhà thầu của bạn đang chờ xét duyệt. Chúng tôi sẽ thông báo qua email khi tài khoản được kích hoạt.
          </p>
          
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link
              to="/auth/login"
              className="btn btn-primary"
              style={{ textDecoration: 'none' }}
            >
              Đăng nhập
            </Link>
            <Link
              to="/"
              className="btn btn-secondary"
              style={{ textDecoration: 'none' }}
            >
              Về trang chủ
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

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
          maxWidth: 480,
          background: 'var(--bg-secondary)',
          borderRadius: 16,
          padding: 32,
          border: '1px solid var(--border)',
        }}
        role="main"
        aria-labelledby="register-heading"
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 
            id="register-heading"
            style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}
          >
            Đăng ký tài khoản
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Tham gia nền tảng đấu giá xây dựng
          </p>
        </div>

        {/* Account Type Selection */}
        <fieldset style={{ marginBottom: 24, border: 'none', padding: 0 }}>
          <legend
            id={accountTypeGroupId}
            style={{
              display: 'block',
              marginBottom: 10,
              color: 'var(--text-primary)',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Loại tài khoản
          </legend>
          <div 
            style={{ display: 'flex', gap: 12 }}
            role="radiogroup"
            aria-labelledby={accountTypeGroupId}
          >
            <button
              type="button"
              onClick={() => setAccountType('homeowner')}
              role="radio"
              aria-checked={accountType === 'homeowner'}
              style={{
                flex: 1,
                padding: '16px 12px',
                background: accountType === 'homeowner' ? 'var(--primary-muted)' : 'var(--bg-tertiary)',
                border: `2px solid ${accountType === 'homeowner' ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <i
                className="ri-home-4-line"
                style={{
                  fontSize: 28,
                  color: accountType === 'homeowner' ? 'var(--primary)' : 'var(--text-muted)',
                  display: 'block',
                  marginBottom: 8,
                }}
                aria-hidden="true"
              />
              <span
                style={{
                  color: accountType === 'homeowner' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Chủ nhà
              </span>
            </button>
            
            <button
              type="button"
              onClick={() => setAccountType('contractor')}
              role="radio"
              aria-checked={accountType === 'contractor'}
              style={{
                flex: 1,
                padding: '16px 12px',
                background: accountType === 'contractor' ? 'var(--primary-muted)' : 'var(--bg-tertiary)',
                border: `2px solid ${accountType === 'contractor' ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <i
                className="ri-building-2-line"
                style={{
                  fontSize: 28,
                  color: accountType === 'contractor' ? 'var(--primary)' : 'var(--text-muted)',
                  display: 'block',
                  marginBottom: 8,
                }}
                aria-hidden="true"
              />
              <span
                style={{
                  color: accountType === 'contractor' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Nhà thầu
              </span>
            </button>
          </div>
          
          {accountType === 'contractor' && (
            <p 
              style={{ marginTop: 10, color: 'var(--warning)', fontSize: 12 }}
              role="alert"
            >
              <i className="ri-information-line" style={{ marginRight: 4 }} aria-hidden="true" />
              Tài khoản nhà thầu cần được xét duyệt trước khi sử dụng
            </p>
          )}
        </fieldset>

        <form onSubmit={handleSubmit} aria-label="Form đăng ký">
          <div style={{ marginBottom: 16 }} className="form-field">
            <label 
              htmlFor={nameId}
              style={{ display: 'block', marginBottom: 8, color: 'var(--text-primary)', fontSize: 14, fontWeight: 500 }}
            >
              Họ và tên
              <span className="sr-only"> (bắt buộc)</span>
            </label>
            <input
              id={nameId}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="input"
              required
              autoComplete="name"
              aria-required="true"
            />
          </div>

          <div style={{ marginBottom: 16 }} className="form-field">
            <label 
              htmlFor={emailId}
              style={{ display: 'block', marginBottom: 8, color: 'var(--text-primary)', fontSize: 14, fontWeight: 500 }}
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
              required
              autoComplete="email"
              aria-required="true"
            />
          </div>

          <div style={{ marginBottom: 16 }} className="form-field">
            <label 
              htmlFor={phoneId}
              style={{ display: 'block', marginBottom: 8, color: 'var(--text-primary)', fontSize: 14, fontWeight: 500 }}
            >
              Số điện thoại
            </label>
            <input
              id={phoneId}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0901234567"
              className="input"
              autoComplete="tel"
            />
          </div>

          <div style={{ marginBottom: 16 }} className="form-field">
            <label 
              htmlFor={passwordId}
              style={{ display: 'block', marginBottom: 8, color: 'var(--text-primary)', fontSize: 14, fontWeight: 500 }}
            >
              Mật khẩu
              <span className="sr-only"> (bắt buộc, tối thiểu 6 ký tự)</span>
            </label>
            <input
              id={passwordId}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
              required
              minLength={6}
              autoComplete="new-password"
              aria-required="true"
              aria-describedby="password-hint"
            />
            <span id="password-hint" className="sr-only">Mật khẩu phải có ít nhất 6 ký tự</span>
          </div>

          <div style={{ marginBottom: 24 }} className="form-field">
            <label 
              htmlFor={confirmPasswordId}
              style={{ display: 'block', marginBottom: 8, color: 'var(--text-primary)', fontSize: 14, fontWeight: 500 }}
            >
              Xác nhận mật khẩu
              <span className="sr-only"> (bắt buộc)</span>
            </label>
            <input
              id={confirmPasswordId}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
              required
              autoComplete="new-password"
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
                <span>Đang đăng ký...</span>
              </span>
            ) : (
              'Đăng ký'
            )}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Đã có tài khoản?{' '}
            <Link
              to="/auth/login"
              style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}
            >
              Đăng nhập
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
      </motion.div>
    </div>
  );
}
