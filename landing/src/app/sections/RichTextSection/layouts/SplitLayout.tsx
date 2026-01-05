import { motion } from 'framer-motion';
import { getStyles } from '../styles';

interface SplitLayoutProps {
  verticalPadding: string;
  backgroundImage?: string;
  padding: string;
  imageRatio?: number;
  isImageLeft: boolean;
  renderContent: () => React.ReactNode;
}

export function SplitLayout({
  verticalPadding,
  backgroundImage,
  padding,
  imageRatio,
  isImageLeft,
  renderContent,
}: SplitLayoutProps) {
  // Get image ratio from slider (default 40%)
  const imagePercent = imageRatio || 40;
  const contentPercent = 100 - imagePercent;
  
  // Generate grid template based on ratio
  const gridTemplate = backgroundImage 
    ? `${imagePercent}fr ${contentPercent}fr`
    : '1fr';
  
  return (
    <section
      style={{
        maxWidth: 1400,
        margin: `${verticalPadding} auto`,
        padding: '0 24px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{
          display: 'grid',
          gridTemplateColumns: gridTemplate,
          alignItems: 'stretch',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          position: 'relative',
        }}
        className="rich-text-split-grid"
      >
        {/* Image side - Left */}
        {isImageLeft && backgroundImage && (
          <div style={{ position: 'relative', minHeight: 400 }}>
            <img
              src={backgroundImage}
              alt=""
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {/* Glass divider overlay on right edge */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 40,
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(19, 19, 22, 0.7))',
                pointerEvents: 'none',
              }}
            />
          </div>
        )}
        
        {/* Content side */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(26, 27, 30, 0.6) 0%, rgba(19, 19, 22, 0.4) 100%)',
            backdropFilter: 'blur(20px)',
            padding,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1,
          }}
          className="rich-text-content"
        >
          {/* Glass divider line */}
          <div
            style={{
              position: 'absolute',
              top: 20,
              bottom: 20,
              [isImageLeft ? 'left' : 'right']: 0,
              width: 1,
              background: 'linear-gradient(180deg, transparent 0%, rgba(245, 211, 147, 0.3) 20%, rgba(245, 211, 147, 0.3) 80%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />
          {renderContent()}
        </div>
        
        {/* Image side - Right */}
        {!isImageLeft && backgroundImage && (
          <div style={{ position: 'relative', minHeight: 400 }}>
            <img
              src={backgroundImage}
              alt=""
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {/* Glass divider overlay on left edge */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 40,
                height: '100%',
                background: 'linear-gradient(270deg, transparent, rgba(19, 19, 22, 0.7))',
                pointerEvents: 'none',
              }}
            />
          </div>
        )}
      </motion.div>
      
      <style>{getStyles()}</style>
    </section>
  );
}
