/**
 * ShareQuoteModal - Share quote via link or social media
 *
 * **Feature: interior-quote-module**
 * **Validates: Requirements 15.7**
 */

import { tokens } from '@app/shared';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface ShareQuoteModalProps {
  quoteCode: string;
  onClose: () => void;
}

export function ShareQuoteModal({ quoteCode, onClose }: ShareQuoteModalProps) {
  const [copied, setCopied] = useState(false);

  const quoteUrl = `${window.location.origin}/noi-that/bao-gia/${quoteCode}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(quoteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = quoteUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(quoteUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnZalo = () => {
    const url = `https://zalo.me/share?url=${encodeURIComponent(quoteUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnMessenger = () => {
    const url = `fb-messenger://share?link=${encodeURIComponent(quoteUrl)}`;
    window.location.href = url;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={overlayStyle}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={modalStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={headerStyle}>
            <h3 style={titleStyle}>
              <i className="ri-share-line" style={{ marginRight: '0.5rem' }} />
              Chia sẻ báo giá
            </h3>
            <button onClick={onClose} style={closeButtonStyle}>
              <i className="ri-close-line" />
            </button>
          </div>

          {/* Content */}
          <div style={contentStyle}>
            {/* Quote Code */}
            <div style={quoteCodeStyle}>
              <span style={{ color: tokens.color.textMuted, fontSize: '0.875rem' }}>
                Mã báo giá
              </span>
              <span style={{ color: tokens.color.primary, fontWeight: 700, fontSize: '1.25rem' }}>
                {quoteCode}
              </span>
            </div>

            {/* Copy Link */}
            <div style={linkSectionStyle}>
              <label style={labelStyle}>Đường dẫn báo giá</label>
              <div style={linkInputContainerStyle}>
                <input
                  type="text"
                  value={quoteUrl}
                  readOnly
                  style={linkInputStyle}
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCopyLink}
                  style={{
                    ...copyButtonStyle,
                    background: copied ? tokens.color.success : tokens.color.primary,
                  }}
                >
                  <i className={copied ? 'ri-check-line' : 'ri-file-copy-line'} />
                  {copied ? 'Đã sao chép' : 'Sao chép'}
                </motion.button>
              </div>
            </div>

            {/* Social Share */}
            <div style={socialSectionStyle}>
              <label style={labelStyle}>Chia sẻ qua</label>
              <div style={socialButtonsStyle}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={shareOnFacebook}
                  style={{ ...socialButtonStyle, background: '#1877F2' }}
                >
                  <i className="ri-facebook-fill" style={{ fontSize: '1.25rem' }} />
                  <span>Facebook</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={shareOnZalo}
                  style={{ ...socialButtonStyle, background: '#0068FF' }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Zalo</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={shareOnMessenger}
                  style={{ ...socialButtonStyle, background: '#00B2FF' }}
                >
                  <i className="ri-messenger-fill" style={{ fontSize: '1.25rem' }} />
                  <span>Messenger</span>
                </motion.button>
              </div>
            </div>

            {/* Download PDF - Future feature */}
            <div style={pdfSectionStyle}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={pdfButtonStyle}
                disabled
                title="Tính năng sẽ có trong phiên bản tiếp theo"
              >
                <i className="ri-file-pdf-line" style={{ marginRight: '0.5rem' }} />
                Tải PDF (Sắp có)
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 'clamp(0.5rem, 2vw, 1rem)',
};

const modalStyle: React.CSSProperties = {
  background: tokens.color.background,
  borderRadius: tokens.radius.lg,
  width: '100%',
  maxWidth: '450px',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '1rem 1.5rem',
  borderBottom: `1px solid ${tokens.color.border}`,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '1.125rem',
  fontWeight: 600,
  color: tokens.color.text,
  display: 'flex',
  alignItems: 'center',
};

const closeButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  fontSize: '1.5rem',
  color: tokens.color.textMuted,
  cursor: 'pointer',
  padding: '0.25rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const contentStyle: React.CSSProperties = {
  padding: '1.5rem',
};

const quoteCodeStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.25rem',
  padding: '1rem',
  background: tokens.color.surface,
  borderRadius: tokens.radius.md,
  marginBottom: '1.5rem',
};

const linkSectionStyle: React.CSSProperties = {
  marginBottom: '1.5rem',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.5rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: tokens.color.text,
};

const linkInputContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
};

const linkInputStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.75rem 1rem',
  background: tokens.color.surface,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.md,
  color: tokens.color.text,
  fontSize: '0.875rem',
  outline: 'none',
};

const copyButtonStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  color: tokens.color.background,
  border: 'none',
  borderRadius: tokens.radius.md,
  fontWeight: 500,
  fontSize: '0.875rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  whiteSpace: 'nowrap',
  minHeight: '44px', // Touch target
};

const socialSectionStyle: React.CSSProperties = {
  marginBottom: '1.5rem',
};

const socialButtonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
};

const socialButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: 'clamp(0.5rem, 1.5vw, 0.75rem)',
  color: tokens.color.background,
  border: 'none',
  borderRadius: tokens.radius.md,
  fontWeight: 500,
  fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.25rem',
  minHeight: '44px', // Touch target
};

const pdfSectionStyle: React.CSSProperties = {
  borderTop: `1px solid ${tokens.color.border}`,
  paddingTop: '1rem',
};

const pdfButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  background: tokens.color.surface,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.md,
  color: tokens.color.textMuted,
  fontSize: '0.875rem',
  cursor: 'not-allowed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0.6,
};

export default ShareQuoteModal;
