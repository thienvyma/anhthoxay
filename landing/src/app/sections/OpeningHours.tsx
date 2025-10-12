import { memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';

interface OpeningHoursData {
  title?: string;
  subtitle?: string;
  schedule: Array<{
    day: string;
    hours: string;
    special?: boolean;
  }>;
  note?: string;
}

export const OpeningHours = memo(function OpeningHours({ data }: { data: OpeningHoursData }) {
  return (
    <div style={{ maxWidth: 1200, margin: '80px auto', padding: '0 16px' }}>
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{
          padding: '60px 24px',
          maxWidth: 800,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
      {/* Header */}
      {(data.title || data.subtitle) && (
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          {data.title && (
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                fontSize: tokens.font.size.h2,
                fontFamily: tokens.font.display,
                color: tokens.color.primary,
                marginBottom: 12,
              }}
            >
              {data.title}
            </motion.h2>
          )}
          {data.subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              style={{
                color: tokens.color.muted,
                fontSize: 16,
              }}
            >
              {data.subtitle}
            </motion.p>
          )}
        </div>
      )}

      {/* Schedule */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {data.schedule?.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ x: 4, scale: 1.02 }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 28px',
              background: item.special ? 'rgba(255,167,0,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${item.special ? tokens.color.primary + '40' : tokens.color.border}`,
              borderRadius: tokens.radius.lg,
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {item.special && (
                <i className="ri-star-fill" style={{ fontSize: 20, color: tokens.color.primary }} />
              )}
              <span style={{ 
                fontWeight: 600, 
                color: tokens.color.text,
                fontSize: 16,
              }}>
                {item.day}
              </span>
            </div>
            <span style={{ 
              color: tokens.color.muted,
              fontSize: 15,
              fontWeight: 500,
            }}>
              {item.hours}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Note */}
      {data.note && (
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          style={{
            marginTop: 32,
            padding: 16,
            textAlign: 'center',
            color: tokens.color.muted,
            fontSize: 14,
            fontStyle: 'italic',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.border}`,
          }}
        >
          💡 {data.note}
        </motion.div>
      )}
      </motion.section>
    </div>
  );
});

