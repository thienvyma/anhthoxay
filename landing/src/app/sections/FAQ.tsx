import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@app/shared';

interface FAQItem {
  _id?: string;
  question: string;
  answer: string;
}

interface FAQData {
  title?: string;
  subtitle?: string;
  items?: FAQItem[];
}

export function FAQ({ data }: { data: FAQData }) {
  const {
    title = 'Câu Hỏi Thường Gặp',
    subtitle = '',
    items = [],
  } = data;

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      style={{
        padding: 'clamp(60px, 10vw, 100px) clamp(16px, 5vw, 40px)',
        background: tokens.color.surface,
      }}
    >
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 48 }}
        >
          <h2
            style={{
              fontSize: 'clamp(28px, 5vw, 40px)',
              fontWeight: 700,
              color: tokens.color.text,
              marginBottom: subtitle ? 12 : 0,
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p style={{ fontSize: 16, color: tokens.color.muted }}>
              {subtitle}
            </p>
          )}
        </motion.div>

        {/* FAQ Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <motion.div
                key={item._id || index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                style={{
                  background: tokens.color.background,
                  borderRadius: tokens.radius.md,
                  border: `1px solid ${isOpen ? tokens.color.primary : tokens.color.border}`,
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}
              >
                {/* Question */}
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  style={{
                    width: '100%',
                    padding: '18px 20px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'clamp(15px, 2vw, 16px)',
                      fontWeight: 600,
                      color: isOpen ? tokens.color.primary : tokens.color.text,
                      transition: 'color 0.2s',
                    }}
                  >
                    {item.question}
                  </span>
                  <motion.i
                    className="ri-add-line"
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      fontSize: 20,
                      color: isOpen ? tokens.color.primary : tokens.color.muted,
                      flexShrink: 0,
                    }}
                  />
                </button>

                {/* Answer */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div
                        style={{
                          padding: '0 20px 20px',
                          fontSize: 15,
                          color: tokens.color.muted,
                          lineHeight: 1.7,
                        }}
                      >
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
