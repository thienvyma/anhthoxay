import { motion } from 'framer-motion';
import { getStyles } from '../styles';

interface DefaultLayoutProps {
  verticalPadding: string;
  maxWidth: string;
  padding: string;
  textAlign: string;
  renderContent: () => React.ReactNode;
}

export function DefaultLayout({
  verticalPadding,
  maxWidth,
  padding,
  textAlign,
  renderContent,
}: DefaultLayoutProps) {
  return (
    <section
      style={{
        maxWidth: 1200,
        margin: `${verticalPadding} auto`,
        padding: '0 24px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{
          background: 'linear-gradient(135deg, rgba(26, 27, 30, 0.6) 0%, rgba(19, 19, 22, 0.4) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(245, 211, 147, 0.1)',
          borderRadius: 16,
          padding,
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          maxWidth,
          margin: textAlign === 'center' ? '0 auto' : textAlign === 'right' ? '0 0 0 auto' : '0',
        }}
        className="rich-text-content"
      >
        {renderContent()}
      </motion.div>

      <style>{getStyles()}</style>
    </section>
  );
}
