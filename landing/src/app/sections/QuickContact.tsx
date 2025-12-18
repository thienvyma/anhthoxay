import { memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { glassEffect } from '../styles/glassEffect';

interface ContactMethod {
  icon: string;
  title: string;
  value: string;
  href?: string;
  color: string;
}

interface QuickContactData {
  title?: string;
  subtitle?: string;
  methods?: ContactMethod[];
}

const defaultMethods: ContactMethod[] = [
  {
    icon: 'ri-phone-fill',
    title: 'ĐIỆN THOẠI',
    value: '+84 123 456 789',
    href: 'tel:+84123456789',
    color: '#10b981',
  },
  {
    icon: 'ri-mail-fill',
    title: 'EMAIL',
    value: 'info@anhthoxay.com',
    href: 'mailto:info@anhthoxay.com',
    color: '#3b82f6',
  },
  {
    icon: 'ri-map-pin-fill',
    title: 'ĐỊA CHỈ',
    value: '123 Đường ABC, Quận XYZ, TP.HCM',
    href: 'https://maps.google.com',
    color: '#f59e0b',
  },
  {
    icon: 'ri-time-fill',
    title: 'GIỜ LÀM VIỆC',
    value: 'Thứ 2 - Thứ 7: 8:00 - 18:00',
    color: tokens.color.primary,
  },
];

export const QuickContact = memo(function QuickContact({ data }: { data: QuickContactData }) {
  const methods = data.methods || defaultMethods;
  const title = data.title || 'Hãy Liên Hệ Với Chúng Tôi';
  const subtitle = data.subtitle || 'Chúng tôi luôn sẵn sàng lắng nghe và phục vụ bạn';

  return (
    <div style={{ maxWidth: 1200, margin: '80px auto', padding: '0 16px' }}>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{
          textAlign: 'center',
          marginBottom: 60,
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', delay: 0.2 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
            color: '#111',
            padding: '12px 28px',
            borderRadius: tokens.radius.pill,
            fontSize: 14,
            fontWeight: 700,
            textTransform: 'uppercase',
            marginBottom: 24,
            letterSpacing: 1,
          }}
        >
          <i className="ri-customer-service-fill" style={{ fontSize: 20 }} />
          Liên Hệ
        </motion.div>

        <h1
          className="heroTitle"
          style={{
            fontSize: 'clamp(36px, 6vw, 64px)',
            fontFamily: tokens.font.display,
            color: tokens.color.primary,
            marginBottom: 20,
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: tokens.color.muted,
            maxWidth: 700,
            margin: '0 auto',
            lineHeight: 1.7,
          }}
        >
          {subtitle}
        </motion.p>
      </motion.div>

      {/* Quick Contact Methods - Glass Morphism Cards */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="contact-methods-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
          gap: 20,
        }}
      >
        {methods.map((method, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            style={{
              ...glassEffect({ variant: 'strong' }),
              padding: 32,
              borderRadius: tokens.radius.lg,
              textAlign: 'center',
              transition: 'all 0.3s ease',
              cursor: method.href ? 'pointer' : 'default',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                margin: '0 auto 20px',
                borderRadius: '50%',
                background: `${method.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i className={method.icon} style={{ fontSize: 32, color: method.color }} />
            </div>
            <h3
              style={{
                fontSize: 14,
                color: tokens.color.muted,
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                fontWeight: 600,
              }}
            >
              {method.title}
            </h3>
            {method.href ? (
              <a
                href={method.href}
                target={method.href.startsWith('http') ? '_blank' : undefined}
                rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                style={{
                  fontSize: 18,
                  color: tokens.color.text,
                  textDecoration: 'none',
                  fontWeight: 600,
                  display: 'block',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = tokens.color.primary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = tokens.color.text)}
              >
                {method.value}
              </a>
            ) : (
              <div style={{ fontSize: 18, color: tokens.color.text, fontWeight: 600 }}>
                {method.value}
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
});

