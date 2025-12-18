import { memo, useMemo } from 'react';
import { tokens, resolveMediaUrl } from '@app/shared';
import { useQuery } from '@tanstack/react-query';
import { OptimizedImage } from '../components/OptimizedImage';
import { blogAPI } from '../api';

interface FeaturedBlogPostsData {
  title?: string;
  subtitle?: string;
  limit?: number; // max posts to show, default 3
}

export const FeaturedBlogPosts = memo(function FeaturedBlogPosts({ data }: { data: FeaturedBlogPostsData }) {
  const limit = data.limit || 3;

  // Fetch blog posts with React Query
  const { data: allPosts = [], isLoading: loading } = useQuery({
    queryKey: ['blog-posts', { status: 'PUBLISHED', limit: 20 }],
    queryFn: () => blogAPI.getPosts({ status: 'PUBLISHED', limit: 20 }),
  });

  // Take first N posts
  const posts = useMemo(() => {
    return allPosts.slice(0, limit);
  }, [allPosts, limit]);

  const getImageUrl = (url: string | null) => resolveMediaUrl(url);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <i
          className="ri-loader-4-line spinner"
          style={{ fontSize: 40, color: tokens.color.primary }}
        />
      </div>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <div style={{ maxWidth: 1200, margin: 'clamp(40px, 8vw, 80px) auto', padding: '0 16px' }}>
      <section
        className="fade-in-up"
        style={{
          padding: 'clamp(32px, 6vw, 60px) 0',
        }}
      >
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: 'clamp(32px, 6vw, 48px)' }}>
        {data.title && (
          <h2
            className="fade-in-up"
            style={{
              fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
              fontFamily: tokens.font.display,
              color: tokens.color.primary,
              marginBottom: 12,
              animationDelay: '0.1s',
            }}
          >
            {data.title}
          </h2>
        )}
        {data.subtitle && (
          <p
            className="fade-in-up"
            style={{
              color: tokens.color.muted,
              maxWidth: 600,
              margin: '0 auto',
              fontSize: 'clamp(14px, 2.5vw, 16px)',
              animationDelay: '0.2s',
            }}
          >
            {data.subtitle}
          </p>
        )}
      </div>

      {/* Blog Posts Grid */}
      <div
        className="blog-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: 24,
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        {posts.map((post, index) => (
          <article
            key={post.id}
            className="blog-card fade-in-up"
            style={{
              background: 'rgba(12,12,16,0.7)',
              borderRadius: tokens.radius.lg,
              overflow: 'hidden',
              border: `1px solid ${tokens.color.border}`,
              cursor: 'pointer',
              position: 'relative',
              animationDelay: `${index * 0.1}s`,
            }}
            onClick={() => {
              window.location.href = `/blog/${post.slug}`;
            }}
          >
            {/* Featured Image */}
            {post.featuredImage && (
              <div 
                className="blog-card-image-wrapper"
                style={{ aspectRatio: '16/9', overflow: 'hidden' }}
              >
                <OptimizedImage
                  src={getImageUrl(post.featuredImage)}
                  alt={post.title}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  className="blog-card-image"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>
            )}

            {/* Content */}
            <div style={{ padding: 'clamp(16px, 4vw, 24px)' }}>
              {/* Category Badge */}
              <div
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: tokens.radius.pill,
                  background: 'rgba(245,211,147,0.1)',
                  color: tokens.color.primary,
                  fontSize: 'clamp(10px, 2vw, 12px)',
                  fontWeight: 600,
                  marginBottom: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Blog
              </div>

              {/* Title */}
              <h3
                style={{
                  fontSize: 'clamp(16px, 3vw, 20px)',
                  fontWeight: 700,
                  color: tokens.color.text,
                  marginBottom: 12,
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {post.title}
              </h3>

              {/* Excerpt */}
              {post.excerpt && (
                <p
                  style={{
                    fontSize: 'clamp(12px, 2.5vw, 14px)',
                    color: tokens.color.muted,
                    lineHeight: 1.6,
                    marginBottom: 16,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {post.excerpt}
                </p>
              )}

              {/* Meta Info */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingTop: 16,
                  borderTop: `1px solid ${tokens.color.border}`,
                  fontSize: 'clamp(11px, 2vw, 13px)',
                  color: tokens.color.muted,
                }}
              >
                {post.publishedAt && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <i className="ri-calendar-line" />
                    <span>{formatDate(post.publishedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* View All Button */}
      <div
        className="fade-in-up"
        style={{
          textAlign: 'center',
          marginTop: 48,
          animationDelay: '0.4s',
        }}
      >
        <a
          href="/blog"
          className="cta-button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 32px',
            background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
            color: '#111',
            textDecoration: 'none',
            borderRadius: tokens.radius.pill,
            fontSize: 16,
            fontWeight: 700,
            boxShadow: tokens.shadow.lg,
          }}
        >
          <span>Xem tất cả bài viết</span>
          <i className="ri-arrow-right-line" />
        </a>
      </div>
    </section>
    </div>
  );
});

