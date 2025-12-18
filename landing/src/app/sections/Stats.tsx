import { motion } from 'framer-motion';
import { StatCard } from '../components/AnimatedCounter';

interface StatsData {
  title?: string;
  subtitle?: string;
  stats: Array<{
    icon: string;
    value: number;
    label: string;
    suffix?: string;
    color: string;
  }>;
}

export function Stats({ data }: { data: StatsData }) {
  // Defensive check for stats array
  const stats = Array.isArray(data?.stats) ? data.stats : [];
  
  if (stats.length === 0) {
    return null; // Don't render if no stats
  }

  return (
    <div style={{ maxWidth: 1200, margin: '80px auto', padding: '0 24px' }}>
      {(data.title || data.subtitle) && (
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          {data.title && (
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                fontFamily: 'Playfair Display, serif',
                color: '#F5D393',
                marginBottom: 12,
                fontWeight: 700,
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
                fontSize: 16,
                color: 'rgba(255,255,255,0.6)',
                maxWidth: 600,
                margin: '0 auto',
              }}
            >
              {data.subtitle}
            </motion.p>
          )}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="stats-grid"
        style={{
          display: 'grid',
          // Responsive: 2 cols on mobile/tablet, 4 on desktop
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
          gap: 16,
        }}
      >
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            icon={stat.icon}
            value={stat.value}
            label={stat.label}
            suffix={stat.suffix}
            color={stat.color}
          />
        ))}
      </motion.div>
    </div>
  );
}

