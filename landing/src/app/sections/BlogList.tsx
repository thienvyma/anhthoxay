import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CardImage } from '../components/OptimizedImage';
import { blogAPI } from '../api';

import { resolveMediaUrl } from '@app/shared';

// Helper to get full image URL
const getImageUrl = (url: string | null) => resolveMediaUrl(url);

interface BlogListData {
  title?: string;
  subtitle?: string;
  showFilters?: boolean;
  postsPerPage?: number;
}

export function BlogList({ data }: { data: BlogListData }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch blog categories with React Query
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: blogAPI.getCategories,
  });

  // Fetch blog posts with React Query
  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['blog-posts', { status: 'PUBLISHED' }],
    queryFn: () => blogAPI.getPosts({ status: 'PUBLISHED' }),
  });

  const loading = loadingCategories || loadingPosts;

  const calculateReadTime = (excerpt: string | null) => {
    if (!excerpt) return 3;
    const wordsPerMinute = 200;
    const words = excerpt.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  };

  // Filter posts based on selected category
  const filteredPosts = selectedCategory === 'all' 
    ? posts 
    : posts.filter(post => post.categoryId === selectedCategory);

  // Categories for filter (including 'all')
  const filterCategories = ['all', ...categories.map(c => c.id)];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
      {/* Title */}
      {(data.title || data.subtitle) && (
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          {data.title && (
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                fontFamily: 'Playfair Display, serif',
                color: '#F5D393',
                marginBottom: 12,
                fontWeight: 700,
              }}
            >
              {data.title}
            </motion.h2>
          )}
          {data.subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              style={{
                fontSize: 16,
                color: 'rgba(255,255,255,0.6)',
                maxWidth: 600,
                margin: '0 auto',
              }}
            >
              {data.subtitle}
            </motion.p>
          )}
        </div>
      )}

      {/* Category Filters */}
      {data.showFilters !== false && (
        <AnimatePresence>
          {filterCategories.length > 1 && (
            <motion.div
              className="blog-category-filters"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ 
                display: 'flex', 
                gap: 12, 
                justifyContent: 'center', 
                marginBottom: 48, 
                flexWrap: 'wrap' 
              }}
            >
              {filterCategories.map((catId) => {
                const category = catId === 'all' 
                  ? { id: 'all', name: 'All', color: null }
                  : categories.find(c => c.id === catId);
                
                if (!category) return null;

                const isActive = selectedCategory === catId;

                return (
                  <motion.button
                    key={catId}
                    onClick={() => setSelectedCategory(catId)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '12px 28px',
                      borderRadius: '999px',
                      border: `1px solid ${isActive ? '#F5D393' : 'rgba(255,255,255,0.08)'}`,
                      background: isActive 
                        ? 'linear-gradient(135deg, #F5D393, #EFB679)' 
                        : 'rgba(12,12,16,0.7)',
                      backdropFilter: 'blur(12px)',
                      color: isActive ? '#111' : 'white',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      transition: 'all 0.3s ease',
                      boxShadow: isActive 
                        ? '0 4px 16px rgba(245,211,147,0.3)' 
                        : '0 2px 8px rgba(0,0,0,0.2)',
                    }}
                  >
                    {category.name}
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Masonry Grid */}
      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '80px 0',
          color: 'rgba(255,255,255,0.5)'
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderWidth: '3px',
            borderStyle: 'solid',
            borderColor: 'rgba(245,211,147,0.2) rgba(245,211,147,0.2) rgba(245,211,147,0.2) #F5D393',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 0.8s linear infinite'
          }} />
          <p>Đang tải bài viết...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '80px 0',
          color: 'rgba(255,255,255,0.5)'
        }}>
          <i className="ri-article-line" style={{ fontSize: 64, marginBottom: 16, display: 'block' }} />
          <p style={{ fontSize: 18 }}>Không tìm thấy bài viết nào</p>
        </div>
      ) : (
        <div
          className="blog-list-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: 24,
            paddingBottom: 80,
          }}
        >
          <AnimatePresence mode="sync">
            {filteredPosts.map((post, idx) => {
              // Create varied aspect ratios for masonry effect
              const aspectRatios = ['1/1', '4/3', '3/4', '16/9'];
              const aspectRatio = aspectRatios[idx % aspectRatios.length];

              return (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    borderRadius: 16,
                    overflow: 'hidden',
                    background: 'rgba(12,12,16,0.85)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                    willChange: 'transform, opacity',
                    transform: 'translateZ(0)',
                  }}
                >
                  <Link
                    to={`/blog/${post.slug}`}
                    style={{
                      textDecoration: 'none',
                      display: 'block',
                    }}
                  >
                  {/* Image */}
                  <div 
                    style={{
                      position: 'relative',
                      aspectRatio: aspectRatio,
                      overflow: 'hidden',
                      background: 'rgba(0,0,0,0.3)',
                    }}
                    onMouseEnter={(e) => {
                      const img = e.currentTarget.querySelector('img');
                      if (img) img.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      const img = e.currentTarget.querySelector('img');
                      if (img) img.style.transform = 'scale(1)';
                    }}
                  >
                    {post.featuredImage ? (
                      <CardImage
                        src={getImageUrl(post.featuredImage)}
                        alt={post.title}
                        style={{ aspectRatio }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, rgba(245,211,147,0.1), rgba(239,182,121,0.05))',
                      }}>
                        <i className="ri-image-line" style={{ fontSize: 48, color: 'rgba(245,211,147,0.3)' }} />
                      </div>
                    )}

                    {/* Category Badge */}
                    {(() => {
                      const cat = categories.find(c => c.id === post.categoryId);
                      return cat ? (
                        <div style={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          padding: '6px 12px',
                          background: cat.color || '#F5D393',
                          color: '#111',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}>
                          {cat.name}
                        </div>
                      ) : null;
                    })()}
                  </div>

                  {/* Content Overlay */}
                  <div 
                    className="blog-list-content-overlay"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: 'clamp(16px, 4vw, 24px)',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 70%, transparent 100%)',
                    }}
                  >
                    {/* Title */}
                    <h3 style={{
                      fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                      fontWeight: 700,
                      color: 'white',
                      marginBottom: 8,
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p style={{
                        fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                        color: 'rgba(255,255,255,0.6)',
                        marginBottom: 12,
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {post.excerpt}
                      </p>
                    )}

                    {/* Meta */}
                    <div 
                      className="blog-meta"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        fontSize: 'clamp(0.7rem, 1.8vw, 0.813rem)',
                        color: 'rgba(255,255,255,0.5)',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className="ri-time-line" />
                        {calculateReadTime(post.excerpt)} min
                      </span>
                      {post.publishedAt && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <i className="ri-calendar-line" />
                          {new Date(post.publishedAt).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                  </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

