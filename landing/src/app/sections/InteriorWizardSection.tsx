/**
 * InteriorWizardSection - CMS-configurable interior quote wizard
 * Section kind: INTERIOR_WIZARD
 *
 * Similar to QUOTE_CALCULATOR but for interior furniture quotes.
 * Provides a 7-step wizard for customers to:
 * 1. Select a developer
 * 2. Select a development
 * 3. Select a building
 * 4. Select/enter a unit
 * 5. Preview layout
 * 6. Select a package
 * 7. View quote result
 */

import { tokens } from '@app/shared';
import { motion } from 'framer-motion';
import { InteriorWizard } from '../components/InteriorWizard';

interface InteriorWizardSectionData {
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  maxWidth?: number;
  backgroundStyle?: 'transparent' | 'default' | 'glass' | 'gradient';
  headerIcon?: string;
}

interface InteriorWizardSectionProps {
  data: InteriorWizardSectionData;
}

export function InteriorWizardSection({ data }: InteriorWizardSectionProps) {
  const {
    title = 'Báo Giá Nội Thất',
    subtitle = 'Chọn căn hộ và gói nội thất để nhận báo giá chi tiết ngay lập tức',
    showHeader = true,
    maxWidth = 1200,
    backgroundStyle = 'transparent',
    headerIcon = 'ri-home-smile-fill',
  } = data;

  const getBackgroundStyle = (): React.CSSProperties => {
    switch (backgroundStyle) {
      case 'glass':
        return {
          background: 'rgba(19, 19, 22, 0.6)',
          backdropFilter: 'blur(20px)',
        };
      case 'gradient':
        return {
          background: `linear-gradient(135deg, ${tokens.color.background} 0%, ${tokens.color.surface} 100%)`,
        };
      case 'default':
        return {
          background: tokens.color.background,
        };
      case 'transparent':
      default:
        return {
          background: 'transparent',
        };
    }
  };

  return (
    <section
      style={{
        padding: 'clamp(2rem, 5vw, 4rem) 1rem',
        ...getBackgroundStyle(),
      }}
    >
      {showHeader && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            textAlign: 'center',
            marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)',
          }}
        >
          <h2
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
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
                  fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
                }}
              />
            )}
            {title}
          </h2>
          <p
            style={{
              fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
              color: tokens.color.textMuted,
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            {subtitle}
          </p>
        </motion.div>
      )}

      <div
        style={{
          maxWidth: maxWidth,
          margin: '0 auto',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            padding: 'clamp(1.5rem, 4vw, 2.5rem)',
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

export default InteriorWizardSection;
