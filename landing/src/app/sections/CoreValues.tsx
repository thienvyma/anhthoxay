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
  return (
    <div style={{ maxWidth: 1200, margin: '80px auto', padding: '0 24px' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{
          background: 'radial-gradient(800px 400px at 50% 50%, rgba(245,211,147,0.05) 0%, transparent 70%)',
          borderRadius: 24,
          padding: '60px 40px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {(data.title || data.subtitle) && (
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            {data.title && (
              <h2
                style={{
                  fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                  fontFamily: 'Playfair Display, serif',
                  color: '#F5D393',
                  marginBottom: data.subtitle ? 12 : 0,
                  fontWeight: 700,
                }}
              >
                {data.title}
              </h2>
            )}
            {data.subtitle && (
              <p
                style={{
                  fontSize: 16,
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
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 24,
          }}
        >
          {data.values.map((value, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              style={{
                padding: 32,
                background: 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(12px)',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.08)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}
            >
              {/* Background Glow */}
              <div
                style={{
                  position: 'absolute',
                  top: -30,
                  right: -30,
                  width: 150,
                  height: 150,
                  background: 'radial-gradient(circle, rgba(245,211,147,0.15), transparent 70%)',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                }}
              />

              <i
                className={value.icon}
                style={{
                  fontSize: 48,
                  color: '#F5D393',
                  marginBottom: 20,
                  display: 'block',
                  position: 'relative',
                }}
              />
              <h4
                style={{
                  fontSize: 20,
                  color: 'white',
                  marginBottom: 12,
                  fontWeight: 600,
                  position: 'relative',
                }}
              >
                {value.title}
              </h4>
              <p
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.6)',
                  lineHeight: 1.6,
                  position: 'relative',
                }}
              >
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

