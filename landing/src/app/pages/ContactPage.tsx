import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { fadeInUp } from '@app/ui';
import { LazySection } from '../components/LazySection';
import { renderSection } from '../sections/render';
import type { PageData } from '../types';

export function ContactPage({ page }: { page: PageData }) {
  return (
    <div>
      {/* Render all sections from page data */}
      {page?.sections
        ?.filter((s) => 
          s.kind !== 'FAB_ACTIONS' // FAB rendered separately in app.tsx
        )
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((s, index) => {
          const rendered = renderSection(s);
          if (!rendered) return null;
          
          // Lazy load sections after first one
          const shouldLazy = index >= 1;
          
          return shouldLazy ? (
            <LazySection key={s.id} rootMargin="300px">
              <section>{rendered}</section>
            </LazySection>
          ) : (
            <section key={s.id}>{rendered}</section>
          );
        })}

      {/* Social Media Section */}
      <motion.div
        variants={fadeInUp}
        style={{
          marginTop: 60,
          padding: 48,
          background: `linear-gradient(135deg, ${tokens.color.surface} 0%, rgba(19,19,22,0.8) 100%)`,
          borderRadius: tokens.radius.lg,
          border: `1px solid ${tokens.color.border}`,
          textAlign: 'center',
        }}
      >
        <h3 style={{ fontSize: 28, color: tokens.color.primary, marginBottom: 16, fontWeight: 700 }}>
          Kết Nối Với Chúng Tôi
        </h3>
        <p style={{ color: tokens.color.muted, marginBottom: 32, fontSize: 16 }}>
          Theo dõi chúng tôi trên mạng xã hội để cập nhật những món ăn mới và ưu đãi đặc biệt
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['facebook', 'instagram', 'youtube', 'twitter', 'tiktok'].map((social, idx) => (
            <motion.a
              key={social}
              href={`https://${social}.com`}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: idx * 0.1, type: 'spring' }}
              whileHover={{ scale: 1.15, y: -4 }}
              whileTap={{ scale: 0.95 }}
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#111',
                fontSize: 24,
                textDecoration: 'none',
                boxShadow: tokens.shadow.md,
                transition: 'all 0.3s ease',
              }}
            >
              <i className={`ri-${social}-fill`} />
            </motion.a>
          ))}
        </div>
      </motion.div>
    </div>
  );
}


