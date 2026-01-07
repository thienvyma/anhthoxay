import { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { useThrottledCallback } from '../hooks/useThrottle';

/**
 * ReadingProgressBar Component
 * 
 * Shows reading progress as user scrolls through article
 * Features:
 * - Smooth animations
 * - Responsive design
 * - Gradient color
 * - Fixed position at top
 */
export function ReadingProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <>
      {/* Progress bar container */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'rgba(18,18,22,0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 10001,
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        {/* Progress bar fill */}
        <motion.div
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #f5d393 0%, #efb679 50%, #f5d393 100%)',
            transformOrigin: '0%',
            scaleX,
            boxShadow: '0 0 20px rgba(245,211,147,0.6)'
          }}
        />
      </div>
    </>
  );
}

/**
 * ReadingProgressIndicator Component
 * 
 * Shows estimated time remaining and progress percentage
 * Sticky indicator that appears after scrolling
 */
interface ReadingProgressIndicatorProps {
  totalMinutes: number;
}

export function ReadingProgressIndicator({ totalMinutes }: ReadingProgressIndicatorProps) {
  const [progress, setProgress] = useState(0);
  const [show, setShow] = useState(false);

  // Throttled scroll handler with 100ms interval (Requirement 9.3)
  const handleScroll = useThrottledCallback(() => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    const totalScroll = documentHeight - windowHeight;
    const currentProgress = (scrollTop / totalScroll) * 100;
    
    setProgress(Math.min(100, Math.max(0, currentProgress)));
    setShow(scrollTop > 300); // Show after scrolling 300px
  }, 100);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const minutesRemaining = Math.ceil((totalMinutes * (100 - progress)) / 100);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{
        position: 'fixed',
        top: '80px',
        right: '24px',
        background: 'rgba(18,18,22,0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '12px 20px',
        zIndex: 1000,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '180px'
      }}
    >
      {/* Icon */}
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: `conic-gradient(#f5d393 ${progress}%, rgba(245,211,147,0.2) ${progress}%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: '#12121680',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <i className="ri-time-line" style={{ fontSize: '14px', color: '#f5d393' }} />
        </div>
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '11px',
          color: 'rgba(255,255,255,0.5)',
          marginBottom: '2px',
          fontWeight: 500
        }}>
          {progress < 95 ? 'Còn lại' : 'Hoàn thành'}
        </div>
        <div style={{
          fontSize: '13px',
          color: 'white',
          fontWeight: 600
        }}>
          {progress < 95 ? (
            <>{minutesRemaining} phút • {Math.round(progress)}%</>
          ) : (
            <>Đã đọc xong! 🎉</>
          )}
        </div>
      </div>
    </motion.div>
  );
}
