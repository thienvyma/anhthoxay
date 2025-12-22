/**
 * SkeletonLoader - Loading placeholder component
 */

import { tokens } from '@app/shared';
import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  count?: number;
  type?: 'card' | 'list' | 'text';
}

export function SkeletonLoader({ count = 4, type = 'card' }: SkeletonLoaderProps) {
  const shimmerVariants = {
    initial: { opacity: 0.5 },
    animate: {
      opacity: [0.5, 0.8, 0.5],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
  };

  if (type === 'text') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            variants={shimmerVariants}
            initial="initial"
            animate="animate"
            style={{
              height: '1rem',
              width: i === count - 1 ? '60%' : '100%',
              background: tokens.color.surface,
              borderRadius: tokens.radius.sm,
            }}
          />
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            variants={shimmerVariants}
            initial="initial"
            animate="animate"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              background: tokens.color.surface,
              borderRadius: tokens.radius.md,
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: tokens.radius.md,
                background: tokens.color.background,
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  height: '1rem',
                  width: '60%',
                  background: tokens.color.background,
                  borderRadius: tokens.radius.sm,
                  marginBottom: '0.5rem',
                }}
              />
              <div
                style={{
                  height: '0.75rem',
                  width: '40%',
                  background: tokens.color.background,
                  borderRadius: tokens.radius.sm,
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  // Card type (default)
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '1rem',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          variants={shimmerVariants}
          initial="initial"
          animate="animate"
          style={{
            background: tokens.color.surface,
            borderRadius: tokens.radius.lg,
            padding: '1rem',
            border: `1px solid ${tokens.color.border}`,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100px',
              background: tokens.color.background,
              borderRadius: tokens.radius.md,
              marginBottom: '0.75rem',
            }}
          />
          <div
            style={{
              height: '1rem',
              width: '70%',
              background: tokens.color.background,
              borderRadius: tokens.radius.sm,
              margin: '0 auto',
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

export default SkeletonLoader;
