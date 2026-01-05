import { motion } from 'framer-motion';
import { getStyles } from '../styles';

interface FullWidthLayoutProps {
  verticalPadding: string;
  backgroundImage?: string;
  backgroundOverlay: number;
  showDecorations: boolean;
  maxWidth: string;
  textAlign: string;
  renderContent: () => React.ReactNode;
}

export function FullWidthLayout({
  verticalPadding,
  backgroundImage,
  backgroundOverlay,
  showDecorations,
  maxWidth,
  textAlign,
  renderContent,
}: FullWidthLayoutProps) {
  return (
    <section
      style={{
        position: 'relative',
        padding: `${verticalPadding} 24px`,
        background: backgroundImage
          ? `linear-gradient(rgba(0,0,0,${backgroundOverlay / 100}), rgba(0,0,0,${backgroundOverlay / 100})), url(${backgroundImage})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Animated light effect */}
      {showDecorations && !backgroundImage && (
        <motion.div
          animate={{
            background: [
              'radial-gradient(600px circle at 20% 30%, rgba(255,255,255,0.03), transparent 50%)',
              'radial-gradient(600px circle at 80% 70%, rgba(255,255,255,0.03), transparent 50%)',
              'radial-gradient(600px circle at 20% 30%, rgba(255,255,255,0.03), transparent 50%)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        />
      )}
      
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <div style={{ maxWidth, margin: textAlign === 'center' ? '0 auto' : textAlign === 'right' ? '0 0 0 auto' : '0' }}>
          {renderContent()}
        </div>
      </div>
      
      <style>{getStyles()}</style>
    </section>
  );
}
