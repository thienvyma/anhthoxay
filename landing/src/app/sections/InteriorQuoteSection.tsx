/**
 * InteriorQuoteSection - CMS-integrated interior quote wizard
 * Section kind: INTERIOR_QUOTE
 *
 * Displays the interior quote wizard with a card wrapper.
 * Similar styling to QUOTE_CALCULATOR section.
 */

import { tokens } from '@app/shared';
import { motion } from 'framer-motion';
import { InteriorWizard } from '../components/InteriorWizard';

interface InteriorQuoteSectionData {
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  maxWidth?: number;
  headerIcon?: string;
}

interface InteriorQuoteSectionProps {
  data: InteriorQuoteSectionData;
}

export function InteriorQuoteSection({ data }: InteriorQuoteSectionProps) {
  const {
    title = 'Báo Giá Nội Thất',
    subtitle = 'Chọn căn hộ và gói nội thất để nhận báo giá chi tiết ngay lập tức',
    showHeader = true,
    maxWidth = 900,
    headerIcon = 'ri-home-smile-fill',
  } = data;

  return (
    <section
      style={{
        padding: '4rem 1rem',
        background: 'transparent',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header - outside card, like QUOTE_CALCULATOR */}
        {showHeader && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              textAlign: 'center',
              marginBottom: '2rem',
            }}
          >
            <h2
              style={{
                fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
                fontWeight: 700,
                color: tokens.color.text,
                marginBottom: '0.75rem',
                fontFamily: tokens.font.display,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              {headerIcon && (
                <i
                  className={headerIcon}
                  style={{
                    color: tokens.color.primary,
                    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                  }}
                />
              )}
              {title}
            </h2>
            <p
              style={{
                fontSize: '1rem',
                color: tokens.color.textMuted,
                maxWidth: 500,
                margin: '0 auto',
              }}
            >
              {subtitle}
            </p>
          </motion.div>
        )}

        {/* Card wrapper - same style as QUOTE_CALCULATOR */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={{
            maxWidth: maxWidth,
            margin: '0 auto',
            padding: '2.5rem',
            borderRadius: tokens.radius.lg,
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.border}`,
          }}
        >
          <InteriorWizard />
        </motion.div>
      </div>
    </section>
  );
}

export default InteriorQuoteSection;
