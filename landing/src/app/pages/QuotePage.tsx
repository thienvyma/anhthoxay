import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { tokens, API_URL } from '@app/shared';
import { PageRenderer } from '../components/PageRenderer';
import type { PageData } from '../types';

export function QuotePage() {
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch page data from CMS
  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await fetch(`${API_URL}/pages/bao-gia`);
        if (res.ok) {
          const data = await res.json();
          setPage(data);
        }
      } catch {
        // Use default if fetch fails
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '4rem',
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            border: `3px solid ${tokens.color.border}`,
            borderTopColor: tokens.color.primary,
          }}
        />
      </div>
    );
  }

  return <PageRenderer page={page} eagerSections={1} />;
}

export default QuotePage;
