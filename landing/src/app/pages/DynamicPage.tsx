import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { tokens, API_URL } from '@app/shared';
import { PageRenderer } from '../components/PageRenderer';
import { MaintenancePage } from '../components/MaintenancePage';
import type { PageData } from '../types';

export function DynamicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    setError(null);

    fetch(`${API_URL}/pages/${slug}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Page not found: ${slug}`);
        }
        return res.json();
      })
      .then((json) => {
        // Unwrap standardized response format { success: true, data: T }
        const data = json.data || json;
        setPage(data);
      })
      .catch((err) => {
        console.error(`Failed to fetch page ${slug}:`, err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '50vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: `3px solid ${tokens.color.border}`,
            borderTopColor: tokens.color.primary,
          }}
        />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div
        style={{
          minHeight: '50vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
          padding: 40,
          textAlign: 'center',
        }}
      >
        <i
          className="ri-error-warning-line"
          style={{ fontSize: 64, color: tokens.color.primary }}
        />
        <h1 style={{ fontSize: 24, color: tokens.color.text, margin: 0 }}>
          Trang không tồn tại
        </h1>
        <p style={{ color: tokens.color.muted, margin: 0 }}>
          Trang "{slug}" không được tìm thấy hoặc đã bị xóa.
        </p>
        <a
          href="/"
          style={{
            marginTop: 16,
            padding: '12px 24px',
            background: tokens.color.primary,
            color: '#111',
            borderRadius: tokens.radius.md,
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Về trang chủ
        </a>
      </div>
    );
  }

  // Check if page is disabled (isActive === false)
  if (page.isActive === false) {
    return (
      <MaintenancePage 
        title={`${page.title || slug} - Sắp Ra Mắt`}
      />
    );
  }

  return <PageRenderer page={page} eagerSections={2} />;
}

export default DynamicPage;
