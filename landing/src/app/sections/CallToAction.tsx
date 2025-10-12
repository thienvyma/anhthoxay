import { motion } from 'framer-motion';
import { tokens } from '@app/shared';

interface CallToActionData {
  title?: string;
  subtitle?: string;
  primaryButton?: {
    text: string;
    link: string;
    icon?: string;
  };
  secondaryButton?: {
    text: string;
    link: string;
    icon?: string;
  };
  backgroundImage?: string;
  backgroundColor?: string;
}

export function CallToAction({ data }: { data: CallToActionData }) {
  return (
    <section
      style={{
        position: 'relative',
        padding: '100px 24px',
        margin: '80px 0',
        overflow: 'hidden',
        borderRadius: 24,
        background: data.backgroundColor || 'linear-gradient(135deg, rgba(245,211,147,0.1), rgba(239,182,121,0.05))',
      }}
    >
      {/* Background Image */}
      {data.backgroundImage && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${data.backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.15,
            zIndex: 0,
          }}
        />
      )}

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 800,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        {data.title && (
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontFamily: 'Playfair Display, serif',
              color: tokens.color.primary,
              marginBottom: 16,
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
              fontSize: 18,
              color: 'rgba(255,255,255,0.7)',
              marginBottom: 40,
              lineHeight: 1.6,
            }}
          >
            {data.subtitle}
          </motion.p>
        )}

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          style={{
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {data.primaryButton && (
            <motion.a
              href={data.primaryButton.link.startsWith('/') ? `#${data.primaryButton.link}` : data.primaryButton.link}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '16px 32px',
                background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                color: '#111',
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 16,
                textDecoration: 'none',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(245,211,147,0.3)',
                transition: 'all 0.3s ease',
              }}
            >
              {data.primaryButton.icon && <i className={data.primaryButton.icon} />}
              {data.primaryButton.text}
            </motion.a>
          )}

          {data.secondaryButton && (
            <motion.a
              href={data.secondaryButton.link.startsWith('/') ? `#${data.secondaryButton.link}` : data.secondaryButton.link}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '16px 32px',
                background: 'rgba(255,255,255,0.05)',
                color: 'white',
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 16,
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                backdropFilter: 'blur(12px)',
                transition: 'all 0.3s ease',
              }}
            >
              {data.secondaryButton.icon && <i className={data.secondaryButton.icon} />}
              {data.secondaryButton.text}
            </motion.a>
          )}
        </motion.div>
      </div>
    </section>
  );
}

