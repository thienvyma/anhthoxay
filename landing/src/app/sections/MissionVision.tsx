import { motion } from 'framer-motion';
import { tokens } from '@app/shared';

interface MissionVisionData {
  title?: string;
  subtitle?: string;
  mission?: {
    icon: string;
    title: string;
    content: string;
  };
  vision?: {
    icon: string;
    title: string;
    content: string;
  };
}

export function MissionVision({ data }: { data: MissionVisionData }) {
  const items = [];
  
  if (data.mission) {
    items.push({
      ...data.mission,
      icon: data.mission.icon || 'ri-target-line',
    });
  }
  
  if (data.vision) {
    items.push({
      ...data.vision,
      icon: data.vision.icon || 'ri-eye-line',
    });
  }

  if (items.length === 0) return null;

  return (
    <div style={{ 
      maxWidth: 1200, 
      margin: '80px auto', 
      padding: '0 24px',
    }}>
      {/* Section Header */}
      {(data.title || data.subtitle) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            textAlign: 'center',
            marginBottom: 60,
          }}
        >
          {data.title && (
            <h2
              style={{
                fontSize: 'clamp(2rem, 5vw, 3rem)',
                fontFamily: 'Playfair Display, serif',
                color: tokens.color.primary,
                marginBottom: 16,
                fontWeight: 700,
              }}
            >
              {data.title}
            </h2>
          )}
          {data.subtitle && (
            <p
              style={{
                fontSize: 18,
                color: tokens.color.muted,
                maxWidth: 700,
                margin: '0 auto',
                lineHeight: 1.7,
              }}
            >
              {data.subtitle}
            </p>
          )}
        </motion.div>
      )}

      {/* Cards Grid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 32,
        }}
      >
        {items.map((item, index) => (
          <motion.div
            key={index}
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.3 }}
            style={{
              background: 'rgba(255,255,255,0.02)',
              backdropFilter: 'blur(12px)',
              padding: 48,
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: tokens.shadow.lg,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Background Glow */}
            <div
              style={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                background: `radial-gradient(circle, ${tokens.color.primary}15, transparent 70%)`,
                borderRadius: '50%',
                pointerEvents: 'none',
              }}
            />

            {/* Icon */}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 16,
                background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
                boxShadow: `0 8px 24px ${tokens.color.primary}40`,
                position: 'relative',
              }}
            >
              <i className={item.icon} style={{ fontSize: 36, color: '#111' }} />
            </div>

            {/* Title */}
            <h3
              style={{
                fontSize: 28,
                color: tokens.color.primary,
                marginBottom: 16,
                fontWeight: 700,
                fontFamily: 'Playfair Display, serif',
                position: 'relative',
              }}
            >
              {item.title}
            </h3>

            {/* Content */}
            <p
              style={{
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.8,
                fontSize: 16,
                position: 'relative',
              }}
            >
              {item.content}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
