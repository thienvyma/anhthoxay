import { motion } from 'framer-motion';

interface CoreValuesData {
  title?: string;
  subtitle?: string;
  values: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
}

export function CoreValues({ data }: { data: CoreValuesData }) {
  // Defensive check for values array
  const values = Array.isArray(data?.values) ? data.values : [];
  
  if (values.length === 0) {
    return null; // Don't render if no values
  }

  return (
    <div style={{ maxWidth: 1200, margin: 'clamp(40px, 8vw, 80px) auto', padding: '0 16px' }}>
      {(data.title || data.subtitle) && (
        <div style={{ textAlign: 'center', marginBottom: 'clamp(20px, 4vw, 40px)' }}>
          {data.title && (
            <h2
              style={{
                fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                fontFamily: 'Playfair Display, serif',
                color: '#F5D393',
                marginBottom: data.subtitle ? 8 : 0,
                fontWeight: 700,
              }}
            >
              {data.title}
            </h2>
          )}
          {data.subtitle && (
            <p
              style={{
                fontSize: 'clamp(13px, 2vw, 16px)',
                color: 'rgba(255,255,255,0.6)',
                maxWidth: 600,
                margin: '0 auto',
              }}
            >
              {data.subtitle}
            </p>
          )}
        </div>
      )}

      <div
        className="values-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))',
          gap: 12,
        }}
      >
        {values.map((value, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ y: -3, scale: 1.02 }}
            className="value-card"
            style={{
              padding: 'clamp(10px, 2vw, 20px)',
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(8px)',
              borderRadius: 'clamp(8px, 1.5vw, 12px)',
              border: '1px solid rgba(255,255,255,0.08)',
              textAlign: 'center',
            }}
          >
            <i
              className={value.icon}
              style={{
                fontSize: 'clamp(24px, 4vw, 36px)',
                color: '#F5D393',
                marginBottom: 'clamp(6px, 1.5vw, 12px)',
                display: 'block',
              }}
            />
            <h4
              style={{
                fontSize: 'clamp(11px, 1.8vw, 16px)',
                color: 'white',
                marginBottom: 'clamp(2px, 0.8vw, 8px)',
                fontWeight: 600,
                lineHeight: 1.2,
              }}
            >
              {value.title}
            </h4>
            <p
              style={{
                fontSize: 'clamp(9px, 1.3vw, 13px)',
                color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.35,
                margin: 0,
              }}
            >
              {value.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

