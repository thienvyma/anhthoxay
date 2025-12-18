import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '@app/shared';

interface NewsletterSignupProps {
  variant?: 'inline' | 'compact' | 'floating';
  className?: string;
}

/**
 * NewsletterSignup Component
 * 
 * Email newsletter subscription form
 * Features:
 * - Email validation
 * - Loading states
 * - Success/error feedback
 * - Multiple variants
 * - Glassmorphism design
 */
export function NewsletterSignup({ variant = 'inline', className = '' }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Vui lòng nhập email hợp lệ');
      return;
    }

    try {
      setStatus('loading');
      
      // Submit to CustomerLead API with source = NEWSLETTER
      const res = await fetch(`${API_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Newsletter Subscriber',
          phone: '',
          email: email,
          content: 'Đăng ký nhận bài viết mới qua email',
          source: 'NEWSLETTER',
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to subscribe');
      }
      
      setStatus('success');
      setMessage('Đăng ký thành công! Cảm ơn bạn đã quan tâm.');
      setEmail('');
      
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    } catch {
      setStatus('error');
      setMessage('Có lỗi xảy ra. Vui lòng thử lại.');
      
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 3000);
    }
  };

  if (variant === 'compact') {
    return (
      <div className={className} style={{
        background: 'rgba(18,18,22,0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(245,211,147,0.2), rgba(239,182,121,0.1))',
            border: '1px solid rgba(245,211,147,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <i className="ri-mail-line" style={{ fontSize: '20px', color: '#f5d393' }} />
          </div>
          <div>
            <h4 style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'white',
              margin: 0
            }}>
              Newsletter
            </h4>
            <p style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.5)',
              margin: 0
            }}>
              Nhận bài viết mới
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email của bạn"
              disabled={status === 'loading' || status === 'success'}
              style={{
                flex: 1,
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '13px',
                outline: 'none',
                transition: 'all 0.3s'
              }}
            />
            <motion.button
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              whileHover={{ scale: status === 'idle' || status === 'error' ? 1.05 : 1 }}
              whileTap={{ scale: status === 'idle' || status === 'error' ? 0.95 : 1 }}
              style={{
                padding: '10px 16px',
                background: status === 'success' 
                  ? 'rgba(34,197,94,0.2)' 
                  : 'linear-gradient(135deg, #f5d393, #efb679)',
                color: status === 'success' ? '#22c55e' : '#0b0b0c',
                border: status === 'success' ? '1px solid rgba(34,197,94,0.4)' : 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: status === 'idle' || status === 'error' ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {status === 'loading' ? (
                <div style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(11,11,12,0.3)',
                  borderTopColor: '#0b0b0c',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
              ) : status === 'success' ? (
                <i className="ri-check-line" style={{ fontSize: '16px' }} />
              ) : (
                <i className="ri-send-plane-fill" style={{ fontSize: '14px' }} />
              )}
            </motion.button>
          </div>
          {message && (
            <p style={{
              fontSize: '11px',
              color: status === 'success' ? '#22c55e' : '#ef4444',
              marginTop: '8px',
              marginBottom: 0
            }}>
              {message}
            </p>
          )}
        </form>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
      style={{
        background: 'rgba(18,18,22,0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        padding: 'clamp(32px, 5vw, 48px)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative background */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-20%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(245,211,147,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, rgba(245,211,147,0.2), rgba(239,182,121,0.1))',
            border: '1px solid rgba(245,211,147,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(245,211,147,0.2)',
            flexShrink: 0
          }}>
            <i className="ri-mail-send-line" style={{ fontSize: '32px', color: '#f5d393' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: 700,
              color: 'white',
              marginBottom: '12px',
              lineHeight: 1.2
            }}>
              Đăng ký nhận bài viết mới
            </h3>
            <p style={{
              fontSize: 'clamp(0.875rem, 2vw, 1rem)',
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.6,
              margin: 0
            }}>
              Nhận những bài viết mới nhất về cải tạo nhà và tips hữu ích qua email mỗi tuần
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: window.innerWidth < 640 ? 'column' : 'row',
              gap: '12px'
            }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn..."
                disabled={status === 'loading' || status === 'success'}
                style={{
                  flex: 1,
                  padding: '16px 20px',
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(245,211,147,0.5)';
                  e.target.style.background = 'rgba(255,255,255,0.08)';
                  e.target.style.boxShadow = '0 0 0 4px rgba(245,211,147,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.target.style.background = 'rgba(255,255,255,0.05)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <motion.button
                type="submit"
                disabled={status === 'loading' || status === 'success'}
                whileHover={{ scale: status === 'idle' || status === 'error' ? 1.02 : 1 }}
                whileTap={{ scale: status === 'idle' || status === 'error' ? 0.98 : 1 }}
                style={{
                  padding: '16px 32px',
                  background: status === 'success' 
                    ? 'rgba(34,197,94,0.2)' 
                    : 'linear-gradient(135deg, #f5d393, #efb679)',
                  color: status === 'success' ? '#22c55e' : '#0b0b0c',
                  border: status === 'success' ? '1px solid rgba(34,197,94,0.4)' : 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: status === 'idle' || status === 'error' ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  minWidth: '160px',
                  boxShadow: status === 'idle' || status === 'error' 
                    ? '0 4px 16px rgba(245,211,147,0.3)' 
                    : 'none',
                  transition: 'all 0.3s'
                }}
              >
                {status === 'loading' ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(11,11,12,0.3)',
                      borderTopColor: '#0b0b0c',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    Đang gửi...
                  </>
                ) : status === 'success' ? (
                  <>
                    <i className="ri-check-line" style={{ fontSize: '20px' }} />
                    Đã đăng ký!
                  </>
                ) : (
                  <>
                    <i className="ri-send-plane-fill" style={{ fontSize: '18px' }} />
                    Đăng ký ngay
                  </>
                )}
              </motion.button>
            </div>

            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    padding: '12px 16px',
                    background: status === 'success' 
                      ? 'rgba(34,197,94,0.1)' 
                      : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${status === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <i 
                    className={status === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'} 
                    style={{ 
                      fontSize: '20px', 
                      color: status === 'success' ? '#22c55e' : '#ef4444' 
                    }} 
                  />
                  <p style={{
                    fontSize: '14px',
                    color: status === 'success' ? '#22c55e' : '#ef4444',
                    margin: 0,
                    fontWeight: 500
                  }}>
                    {message}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Benefits */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255,255,255,0.08)'
          }}>
            {[
              { icon: 'ri-mail-check-line', text: 'Bài viết mới mỗi tuần' },
              { icon: 'ri-gift-line', text: 'Ưu đãi độc quyền' },
              { icon: 'ri-close-circle-line', text: 'Hủy bất cứ lúc nào' },
            ].map((benefit, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className={benefit.icon} style={{ fontSize: '16px', color: '#f5d393' }} />
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                  {benefit.text}
                </span>
              </div>
            ))}
          </div>
        </form>
      </div>
    </motion.div>
  );
}
