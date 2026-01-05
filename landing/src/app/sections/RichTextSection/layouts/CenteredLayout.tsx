import { tokens } from '@app/shared';
import { motion } from 'framer-motion';
import { getStyles } from '../styles';

interface CenteredLayoutProps {
  verticalPadding: string;
  showDecorations: boolean;
  maxWidth: string;
  padding: string;
  renderContent: () => React.ReactNode;
}

export function CenteredLayout({
  verticalPadding,
  showDecorations,
  maxWidth,
  padding,
  renderContent,
}: CenteredLayoutProps) {
  return (
    <section
      style={{
        maxWidth: 1200,
        margin: `${verticalPadding} auto`,
        padding: '0 24px',
        textAlign: 'center',
      }}
    >
      {/* Decorative top line */}
      {showDecorations && (
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{
            width: 80,
            height: 3,
            background: `linear-gradient(90deg, ${tokens.color.primary}, ${tokens.color.accent})`,
            margin: '0 auto 32px',
            borderRadius: 2,
          }}
        />
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{
          maxWidth,
          margin: '0 auto',
          background: 'linear-gradient(135deg, rgba(26, 27, 30, 0.6) 0%, rgba(19, 19, 22, 0.4) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(245, 211, 147, 0.1)',
          borderRadius: 16,
          padding,
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        }}
        className="rich-text-content rich-text-centered"
      >
        {renderContent()}
      </motion.div>
      
      {/* Decorative bottom line */}
      {showDecorations && (
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{
            width: 80,
            height: 3,
            background: `linear-gradient(90deg, ${tokens.color.primary}, ${tokens.color.accent})`,
            margin: '32px auto 0',
            borderRadius: 2,
          }}
        />
      )}
      
      <style>{getStyles()}</style>
    </section>
  );
}
