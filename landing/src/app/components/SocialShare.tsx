import { useState } from 'react';
import { motion } from 'framer-motion';

interface SocialShareProps {
  title: string;
  url: string;
  excerpt?: string;
}

/**
 * SocialShareButtons Component
 * 
 * Inline share buttons with popular platforms
 */
export function SocialShareButtons({ title, url, excerpt }: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${excerpt || title}\n\n${url}`)}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareButtons = [
    { id: 'facebook', icon: 'ri-facebook-fill', label: 'Facebook', color: '#1877F2', href: shareLinks.facebook },
    { id: 'twitter', icon: 'ri-twitter-x-line', label: 'Twitter', color: '#FFFFFF', href: shareLinks.twitter },
    { id: 'linkedin', icon: 'ri-linkedin-fill', label: 'LinkedIn', color: '#0A66C2', href: shareLinks.linkedin },
    { id: 'email', icon: 'ri-mail-line', label: 'Email', color: '#EA4335', href: shareLinks.email },
  ];

  return (
    <div style={{
      background: 'rgba(18,18,22,0.6)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '20px',
      padding: 'clamp(20px, 4vw, 32px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(245,211,147,0.2), rgba(239,182,121,0.1))',
          border: '1px solid rgba(245,211,147,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(245,211,147,0.2)'
        }}>
          <i className="ri-share-line" style={{ fontSize: '20px', color: '#f5d393' }} />
        </div>
        <div>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 700,
            color: 'white',
            margin: 0
          }}>
            Chia sẻ bài viết
          </h3>
          <p style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.5)',
            margin: 0
          }}>
            Chia sẻ với bạn bè của bạn
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        gap: '12px'
      }}>
        {shareButtons.map((button) => (
          <motion.a
            key={button.id}
            href={button.href}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '16px 12px',
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              textDecoration: 'none',
              transition: 'all 0.3s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${button.color}20`;
              e.currentTarget.style.borderColor = `${button.color}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
            }}
          >
            <i className={button.icon} style={{ fontSize: '24px', color: button.color }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
              {button.label}
            </span>
          </motion.a>
        ))}

        {/* Copy Link Button */}
        <motion.button
          type="button"
          onClick={handleCopyLink}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            padding: '16px 12px',
            background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '12px',
            transition: 'all 0.3s',
            cursor: 'pointer'
          }}
        >
          <i className={copied ? 'ri-check-line' : 'ri-link'} style={{ fontSize: '24px', color: copied ? '#22c55e' : '#f5d393' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
            {copied ? 'Đã copy!' : 'Copy link'}
          </span>
        </motion.button>
      </div>
    </div>
  );
}

/**
 * FloatingSocialShare Component
 * 
 * Floating sidebar with share buttons (desktop only)
 * Enhanced with better contrast colors
 */
export function FloatingSocialShare({ title, url }: SocialShareProps) {
  const shareButtons = [
    { id: 'facebook', icon: 'ri-facebook-fill', color: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { id: 'twitter', icon: 'ri-twitter-x-line', color: '#FFFFFF', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}` },
    { id: 'linkedin', icon: 'ri-linkedin-fill', color: '#0A66C2', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        position: 'fixed',
        left: '16px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 100,
        display: 'none',
        flexDirection: 'column',
        gap: '8px',
        padding: '14px 10px',
        background: 'rgba(30,32,38,0.95)',
        backdropFilter: 'blur(16px)',
        borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
      className="floating-share"
    >
      <div style={{
        fontSize: '10px',
        fontWeight: 700,
        color: 'rgba(255,255,255,0.6)',
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        textAlign: 'center',
        marginBottom: '2px',
      }}>
        SHARE
      </div>
      {shareButtons.map((button) => (
        <motion.a
          key={button.id}
          href={button.href}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: 'rgba(50,52,58,0.9)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            transition: 'all 0.2s',
            textDecoration: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${button.color}25`;
            e.currentTarget.style.borderColor = `${button.color}50`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(50,52,58,0.9)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          }}
        >
          <i className={button.icon} style={{ fontSize: '20px', color: button.color }} />
        </motion.a>
      ))}
      
      {/* CSS for responsive */}
      <style>{`
        @media (min-width: 1200px) {
          .floating-share {
            display: flex !important;
          }
        }
      `}</style>
    </motion.div>
  );
}
