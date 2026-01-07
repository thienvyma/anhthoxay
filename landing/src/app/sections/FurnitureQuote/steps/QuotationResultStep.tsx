/**
 * QuotationResultStep - Step 9: Email Confirmation
 * 
 * **Feature: furniture-quotation-email**
 * **Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.2, 3.4, 8.4, 1.3**
 * 
 * Redesigned to show email confirmation instead of price details.
 * Prices are hidden from the UI and sent via email PDF attachment.
 * 
 * Error Handling:
 * - Gmail not configured (6.2): Shows user-friendly message with support contact
 * - Email send failure (3.4, 8.4): Shows error message with retry option
 * - Rate limit exceeded (1.3): Shows wait time message and disables resend button
 */

import { memo, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { furnitureAPI } from '../../../api/furniture';

/**
 * Error types for email sending
 * _Requirements: 6.2, 3.4, 8.4, 1.3_
 */
type EmailErrorType = 'gmail_not_configured' | 'send_failed' | 'rate_limited' | null;

interface QuotationResultStepProps {
  quotationId: string | null;
  recipientEmail: string;
  onReset: () => void;
  /** Initial email status from parent (useQuotation hook) */
  initialEmailStatus?: 'idle' | 'sending' | 'sent' | 'error' | 'rate_limited';
  /** Initial email error from parent */
  initialEmailError?: string | null;
  /** Initial error code from parent */
  initialErrorCode?: string | null;
}

/**
 * Get user-friendly error message based on error code
 * _Requirements: 6.2, 3.4, 8.4, 1.3_
 */
function getErrorMessage(errorCode: string | null | undefined, errorMessage: string | null | undefined): {
  message: string;
  type: EmailErrorType;
  showSupport: boolean;
  retryAfter?: number;
} {
  switch (errorCode) {
    case 'GMAIL_NOT_CONFIGURED':
      // _Requirements: 6.2_
      return {
        message: 'Hệ thống email chưa được cấu hình. Vui lòng liên hệ bộ phận hỗ trợ để được giúp đỡ.',
        type: 'gmail_not_configured',
        showSupport: true,
      };
    case 'EMAIL_RATE_LIMITED':
      // _Requirements: 1.3_
      return {
        message: errorMessage || 'Bạn đã gửi quá nhiều email. Vui lòng thử lại sau 1 giờ.',
        type: 'rate_limited',
        showSupport: false,
      };
    case 'EMAIL_SEND_FAILED':
    case 'LEAD_EMAIL_MISSING':
    case 'QUOTATION_NOT_FOUND':
    default:
      // _Requirements: 3.4, 8.4_
      return {
        message: errorMessage || 'Không thể gửi email. Vui lòng thử lại hoặc liên hệ hỗ trợ.',
        type: 'send_failed',
        showSupport: false,
      };
  }
}

export const QuotationResultStep = memo(function QuotationResultStep({
  quotationId,
  recipientEmail,
  onReset,
  initialEmailStatus = 'idle',
  initialEmailError = null,
  initialErrorCode = null,
}: QuotationResultStepProps) {
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error' | 'rate_limited'>('idle');
  const [resendError, setResendError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [rateLimitDisabled, setRateLimitDisabled] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(null);

  // Handle initial email status from parent
  useEffect(() => {
    if (initialEmailStatus === 'error' || initialEmailStatus === 'rate_limited') {
      setResendStatus(initialEmailStatus === 'rate_limited' ? 'rate_limited' : 'error');
      setResendError(initialEmailError);
      setErrorCode(initialErrorCode);
      
      if (initialEmailStatus === 'rate_limited') {
        setRateLimitDisabled(true);
      }
    }
  }, [initialEmailStatus, initialEmailError, initialErrorCode]);

  // Countdown timer for rate limit
  // _Requirements: 1.3_
  useEffect(() => {
    if (rateLimitCountdown !== null && rateLimitCountdown > 0) {
      const timer = setTimeout(() => {
        setRateLimitCountdown(rateLimitCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (rateLimitCountdown === 0) {
      setRateLimitDisabled(false);
      setRateLimitCountdown(null);
      setResendStatus('idle');
    }
  }, [rateLimitCountdown]);

  /**
   * Handle resend email
   * _Requirements: 5.5, 3.4, 8.4_
   */
  const handleResendEmail = useCallback(async () => {
    if (!quotationId || resending || rateLimitDisabled) return;

    setResending(true);
    setResendStatus('idle');
    setResendError(null);
    setErrorCode(null);

    try {
      const result = await furnitureAPI.sendQuotationEmail(quotationId);

      if (result.success) {
        setResendStatus('success');
      } else if (result.error?.code === 'EMAIL_RATE_LIMITED') {
        // _Requirements: 1.3_
        setResendStatus('rate_limited');
        setResendError(result.error.message);
        setErrorCode(result.error.code);
        setRateLimitDisabled(true);
        // Set countdown timer (default 60 minutes = 3600 seconds, or use retryAfter if provided)
        const retryAfterSeconds = result.error.retryAfter || 3600;
        setRateLimitCountdown(Math.min(retryAfterSeconds, 300)); // Cap at 5 minutes for UX
      } else {
        // _Requirements: 3.4, 8.4_
        setResendStatus('error');
        setResendError(result.error?.message || 'Không thể gửi email. Vui lòng thử lại.');
        setErrorCode(result.error?.code || null);
      }
    } catch {
      setResendStatus('error');
      setResendError('Có lỗi xảy ra. Vui lòng thử lại.');
      setErrorCode('EMAIL_SEND_FAILED');
    } finally {
      setResending(false);
    }
  }, [quotationId, resending, rateLimitDisabled]);

  return (
    <motion.div
      key="step9"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {/* Success Header */}
      {/* _Requirements: 5.1_ */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: `${tokens.color.primary}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}
        >
          <i
            className="ri-mail-check-fill"
            style={{ fontSize: '2.5rem', color: tokens.color.primary }}
          />
        </motion.div>
        <h3 style={{ 
          margin: '0 0 0.5rem', 
          fontSize: '1.25rem', 
          fontWeight: 700, 
          color: tokens.color.text 
        }}>
          Báo giá đã được gửi!
        </h3>
        <p style={{ 
          margin: 0, 
          fontSize: '0.9rem', 
          color: tokens.color.muted 
        }}>
          Chúng tôi đã gửi báo giá chi tiết đến email của bạn
        </p>
      </div>

      {/* Email Confirmation Card */}
      {/* _Requirements: 5.2_ */}
      <div
        style={{
          borderRadius: tokens.radius.md,
          background: tokens.color.surface,
          border: `1px solid ${tokens.color.border}`,
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Recipient Email */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          marginBottom: '1rem',
        }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: tokens.radius.md,
              background: `${tokens.color.primary}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: tokens.color.primary,
              fontSize: '1.25rem',
            }}
          >
            <i className="ri-mail-line" />
          </div>
          <div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: tokens.color.muted,
              marginBottom: '0.125rem',
            }}>
              Email nhận báo giá
            </div>
            <div style={{ 
              fontSize: '1rem', 
              fontWeight: 600, 
              color: tokens.color.primary,
              wordBreak: 'break-all',
            }}>
              {recipientEmail}
            </div>
          </div>
        </div>

        {/* Spam Folder Instruction */}
        {/* _Requirements: 5.4_ */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '0.875rem',
            borderRadius: tokens.radius.sm,
            background: tokens.color.background,
            border: `1px solid ${tokens.color.border}`,
          }}
        >
          <i 
            className="ri-information-line" 
            style={{ 
              color: tokens.color.primary, 
              fontSize: '1.125rem',
              marginTop: '0.125rem',
            }} 
          />
          <div style={{ fontSize: '0.85rem', color: tokens.color.text, lineHeight: 1.5 }}>
            <strong>Không thấy email?</strong>
            <br />
            Vui lòng kiểm tra thư mục <strong>Spam</strong> hoặc <strong>Quảng cáo</strong> trong hộp thư của bạn.
          </div>
        </div>

        {/* Resend Status Messages */}
        {resendStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              borderRadius: tokens.radius.sm,
              background: `${tokens.color.success}15`,
              marginTop: '1rem',
            }}
          >
            <i className="ri-check-line" style={{ color: tokens.color.success }} />
            <span style={{ fontSize: '0.85rem', color: tokens.color.success }}>
              Email đã được gửi lại thành công!
            </span>
          </motion.div>
        )}

        {/* Error Messages with specific handling */}
        {/* _Requirements: 6.2, 3.4, 8.4, 1.3_ */}
        {(resendStatus === 'error' || resendStatus === 'rate_limited') && (() => {
          const errorInfo = getErrorMessage(errorCode, resendError);
          return (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '0.875rem',
                borderRadius: tokens.radius.sm,
                background: errorInfo.type === 'gmail_not_configured' 
                  ? `${tokens.color.warning}15` 
                  : `${tokens.color.error}15`,
                marginTop: '1rem',
                border: `1px solid ${errorInfo.type === 'gmail_not_configured' 
                  ? `${tokens.color.warning}30` 
                  : `${tokens.color.error}30`}`,
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '0.5rem',
              }}>
                <i 
                  className={errorInfo.type === 'gmail_not_configured' 
                    ? 'ri-settings-3-line' 
                    : errorInfo.type === 'rate_limited'
                    ? 'ri-time-line'
                    : 'ri-error-warning-line'
                  } 
                  style={{ 
                    color: errorInfo.type === 'gmail_not_configured' 
                      ? tokens.color.warning 
                      : tokens.color.error,
                    fontSize: '1.125rem',
                    marginTop: '0.125rem',
                  }} 
                />
                <div style={{ flex: 1 }}>
                  <span style={{ 
                    fontSize: '0.85rem', 
                    color: errorInfo.type === 'gmail_not_configured' 
                      ? tokens.color.warning 
                      : tokens.color.error,
                    lineHeight: 1.5,
                  }}>
                    {errorInfo.message}
                  </span>
                  
                  {/* Rate limit countdown */}
                  {/* _Requirements: 1.3_ */}
                  {errorInfo.type === 'rate_limited' && rateLimitCountdown !== null && rateLimitCountdown > 0 && (
                    <div style={{ 
                      marginTop: '0.5rem',
                      fontSize: '0.8rem',
                      color: tokens.color.muted,
                    }}>
                      Có thể thử lại sau: {Math.floor(rateLimitCountdown / 60)}:{(rateLimitCountdown % 60).toString().padStart(2, '0')}
                    </div>
                  )}
                  
                  {/* Support contact suggestion */}
                  {/* _Requirements: 6.2_ */}
                  {errorInfo.showSupport && (
                    <div style={{ 
                      marginTop: '0.75rem',
                      padding: '0.625rem',
                      borderRadius: tokens.radius.sm,
                      background: tokens.color.background,
                      border: `1px solid ${tokens.color.border}`,
                    }}>
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: tokens.color.text,
                        fontWeight: 600,
                        marginBottom: '0.25rem',
                      }}>
                        Liên hệ hỗ trợ:
                      </div>
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: tokens.color.muted,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                      }}>
                        <i className="ri-phone-line" />
                        <span>Hotline: 1900-xxxx</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })()}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {/* Resend Email Button */}
        {/* _Requirements: 5.5, 1.3_ */}
        {quotationId && (
          <motion.button
            whileHover={{ scale: resending || rateLimitDisabled ? 1 : 1.02 }}
            whileTap={{ scale: resending || rateLimitDisabled ? 1 : 0.98 }}
            onClick={handleResendEmail}
            disabled={resending || rateLimitDisabled}
            style={{
              flex: 1,
              padding: '0.875rem',
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.primary}`,
              background: 'transparent',
              color: tokens.color.primary,
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: resending || rateLimitDisabled ? 'not-allowed' : 'pointer',
              opacity: resending || rateLimitDisabled ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            {resending ? (
              <>
                <motion.i
                  className="ri-loader-4-line"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                Đang gửi...
              </>
            ) : rateLimitDisabled ? (
              <>
                <i className="ri-time-line" />
                Vui lòng chờ...
              </>
            ) : (
              <>
                <i className="ri-mail-send-line" />
                Gửi lại email
              </>
            )}
          </motion.button>
        )}

        {/* New Quotation Button */}
        {/* _Requirements: 5.3_ */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onReset}
          style={{
            flex: 1,
            padding: '0.875rem',
            borderRadius: tokens.radius.md,
            border: 'none',
            background: tokens.color.primary,
            color: '#111',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <i className="ri-refresh-line" />
          Báo giá mới
        </motion.button>
      </div>
    </motion.div>
  );
});
