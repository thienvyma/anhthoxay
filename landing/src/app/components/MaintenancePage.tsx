import { tokens } from '@app/shared';
import { motion } from 'framer-motion';

interface MaintenancePageProps {
  title?: string;
  message?: string;
  showHomeLink?: boolean;
}

export function MaintenancePage({ 
  title = 'Sắp Ra Mắt',
  message = 'Tính năng đang được phát triển và sẽ sớm ra mắt. Cảm ơn bạn đã kiên nhẫn chờ đợi!',
  showHomeLink = true,
}: MaintenancePageProps) {
  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorations */}
      <motion.div
        animate={{ 
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{ 
          rotate: { duration: 60, repeat: Infinity, ease: 'linear' },
          scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
        }}
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${tokens.color.primary}10 0%, transparent 70%)`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          textAlign: 'center',
          maxWidth: 600,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(20px)',
          borderRadius: tokens.radius.xl,
          padding: '60px 40px',
          border: `1px solid ${tokens.color.border}`,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Illustration - Construction/Building Theme */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
          style={{
            width: 180,
            height: 180,
            margin: '0 auto 32px',
            position: 'relative',
          }}
        >
          {/* Main circle background */}
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${tokens.color.primary}30, ${tokens.color.accent}20)`,
              border: `3px solid ${tokens.color.primary}50`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {/* Construction crane icon */}
            <i 
              className="ri-building-4-line" 
              style={{ 
                fontSize: 72, 
                color: tokens.color.primary,
              }} 
            />
          </div>
          
          {/* Animated gear */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              bottom: -5,
              right: -5,
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${tokens.color.accent}, ${tokens.color.primary})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 15px ${tokens.color.primary}50`,
            }}
          >
            <i className="ri-settings-3-line" style={{ fontSize: 24, color: '#111' }} />
          </motion.div>

          {/* Animated wrench */}
          <motion.div
            animate={{ rotate: [-10, 10, -10] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: -5,
              left: -5,
              width: 45,
              height: 45,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: `2px solid ${tokens.color.primary}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i className="ri-hammer-line" style={{ fontSize: 22, color: tokens.color.primary }} />
          </motion.div>
        </motion.div>

        {/* Coming Soon Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            display: 'inline-block',
            padding: '8px 20px',
            background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
            borderRadius: 50,
            marginBottom: 24,
          }}
        >
          <span style={{ 
            fontSize: 12, 
            fontWeight: 700, 
            color: '#111',
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}>
            🚀 Sắp Ra Mắt
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ 
            fontSize: 36, 
            fontWeight: 800, 
            color: tokens.color.text, 
            margin: '0 0 16px',
            lineHeight: 1.2,
            background: `linear-gradient(135deg, ${tokens.color.text}, ${tokens.color.primary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {title}
        </motion.h1>

        {/* Message */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ 
            fontSize: 18, 
            color: tokens.color.muted, 
            margin: '0 0 40px',
            lineHeight: 1.7,
          }}
        >
          {message}
        </motion.p>

        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: '100%' }}
          transition={{ delay: 0.6, duration: 0.8 }}
          style={{
            maxWidth: 300,
            margin: '0 auto 32px',
          }}
        >
          <div style={{
            height: 6,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 10,
            overflow: 'hidden',
          }}>
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: '50%',
                height: '100%',
                background: `linear-gradient(90deg, transparent, ${tokens.color.primary}, transparent)`,
                borderRadius: 10,
              }}
            />
          </div>
          <p style={{ 
            fontSize: 12, 
            color: tokens.color.muted, 
            marginTop: 8,
            opacity: 0.7,
          }}>
            Đang hoàn thiện...
          </p>
        </motion.div>

        {/* Home Link */}
        {showHomeLink && (
          <motion.a
            href="/"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.05, boxShadow: `0 8px 30px ${tokens.color.primary}50` }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '16px 32px',
              background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
              color: '#111',
              borderRadius: tokens.radius.md,
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: 16,
              boxShadow: `0 4px 20px ${tokens.color.primary}40`,
              transition: 'all 0.3s ease',
            }}
          >
            <i className="ri-home-4-line" style={{ fontSize: 20 }} />
            Về trang chủ
          </motion.a>
        )}

        {/* Footer info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{ 
            marginTop: 40, 
            paddingTop: 24, 
            borderTop: `1px solid ${tokens.color.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            color: tokens.color.muted,
            fontSize: 14,
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <i className="ri-heart-pulse-line" style={{ color: tokens.color.primary }} />
          </motion.div>
          <span>Nội Thất Nhanh - Giải pháp nội thất trọn gói</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default MaintenancePage;
