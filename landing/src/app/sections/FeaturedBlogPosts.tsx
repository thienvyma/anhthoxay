import { memo, useMemo } from 'react';
import { tokens } from '@app/shared';
import { useQuery } from '@tanstack/react-query';
import { OptimizedImage } from '../components/OptimizedImage';
import { blogAPI } from '../api';

interface FeaturedBlogPostsData {
  title?: string;
  subtitle?: string;
  limit?: number; // max posts to show, default 3
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  category: {
    name: string;
    slug: string;
    color: string | null;
  };
  author: {
    name: string;
  };
  publishedAt: string;
  _count: {
    comments: number;
  };
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

  const getImageUrl = (url: string | null) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:4202${url}`;
  };

  const formatDate = (dateString: string) => {
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
    <div style={{ maxWidth: 1200, margin: '80px auto', padding: '0 16px' }}>
      <section
        className="fade-in-up"
        style={{
          padding: '60px 0',
        }}
      >
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        {data.title && (
          <h2
            className="fade-in-up"
            style={{
              fontSize: tokens.font.size.h2,
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
              fontSize: 16,
              animationDelay: '0.2s',
            }}
          >
            {data.subtitle}
          </p>
        )}
      </div>

      {/* Blog Posts Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 32,
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
            <div style={{ padding: 24 }}>
              {/* Category Badge */}
              <div
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: tokens.radius.pill,
                  background: post.category.color 
                    ? `${post.category.color}20`
                    : 'rgba(245,211,147,0.1)',
                  color: post.category.color || tokens.color.primary,
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {post.category.name}
              </div>

              {/* Title */}
              <h3
                style={{
                  fontSize: 20,
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
                    fontSize: 14,
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
                  justifyContent: 'space-between',
                  paddingTop: 16,
                  borderTop: `1px solid ${tokens.color.border}`,
                  fontSize: 13,
                  color: tokens.color.muted,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="ri-user-line" />
                  <span>{post.author.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <i className="ri-calendar-line" />
                    <span>{formatDate(post.publishedAt)}</span>
                  </div>
                  {post._count.comments > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <i className="ri-chat-3-line" />
                      <span>{post._count.comments}</span>
                    </div>
                  )}
                </div>
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

