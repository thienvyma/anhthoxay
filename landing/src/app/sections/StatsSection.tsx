import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { memo } from 'react';
import { StatCard } from '../components/AnimatedCounter';

interface StatsSectionData {
  title?: string;
  subtitle?: string;
  stats?: Array<{
    icon: string;
    value: number;
    label: string;
    suffix?: string;
    prefix?: string;
    color?: string;
  }>;
}

export const StatsSection = memo(function StatsSection({ data }: { data: StatsSectionData }) {
  const defaultStats: Array<{
    icon: string;
    value: number;
    label: string;
    suffix?: string;
    prefix?: string;
    color?: string;
  }> = [
    { icon: 'ri-user-smile-fill', value: 10000, label: 'Khách hàng hài lòng', suffix: '+', color: '#10b981' },
    { icon: 'ri-award-fill', value: 15, label: 'Năm kinh nghiệm', suffix: '+', color: '#f59e0b' },
    { icon: 'ri-star-fill', value: 4.9, label: 'Đánh giá trung bình', color: '#fbbf24' },
    { icon: 'ri-restaurant-fill', value: 150, label: 'Món ăn đặc sắc', suffix: '+', color: '#F5D393' },
  ];

  const stats = data.stats || defaultStats;

  return (
    <div style={{ maxWidth: 1200, margin: '80px auto', padding: '0 16px' }}>
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{
          padding: '60px 0',
          position: 'relative',
        }}
      >
      {/* Background Decorations */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, rgba(245,211,147,0.05) 0%, rgba(239,182,121,0.02) 100%)`,
          borderRadius: tokens.radius.lg,
          border: `1px solid ${tokens.color.border}`,
          zIndex: -1,
        }}
      />

      {/* Section Header */}
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
                maxWidth: 600,
                margin: '0 auto',
                fontSize: 16,
              }}
            >
              {data.subtitle}
            </motion.p>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 24,
          padding: '0 20px',
        }}
      >
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            <StatCard
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
              suffix={stat.suffix}
              prefix={stat.prefix}
              color={stat.color}
            />
          </motion.div>
        ))}
      </div>
    </motion.section>
    </div>
  );
});

