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
  perPage?: number; // Admin form uses this field name
}

export function BlogList({ data }: { data: BlogListData }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Support both field names: perPage (admin) and postsPerPage (legacy)
  const postsPerPage = data.perPage || data.postsPerPage || 6;

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
  
  // Reset page when category changes
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setCurrentPage(1);
  };

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

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + postsPerPage);

  // Categories for filter (including 'all')
  const filterCategories = ['all', ...categories.map(c => c.id)];

  return (
    <div style={{ maxWidth: 1200, margin: '60px auto 80px', padding: '0 12px' }}>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 16,
          background: 'rgba(12,12,16,0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
          padding: 'clamp(32px, 6vw, 48px) clamp(20px, 4vw, 40px)',
        }}
      >
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
                gap: 8, 
                justifyContent: 'center', 
                marginBottom: 32, 
                flexWrap: 'wrap',
                padding: '0 8px',
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
                    onClick={() => handleCategoryChange(catId)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="blog-category-btn"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: `1px solid ${isActive ? '#F5D393' : 'rgba(255,255,255,0.15)'}`,
                      background: isActive 
                        ? '#F5D393' 
                        : 'rgba(30,30,35,0.9)',
                      color: isActive ? '#111' : 'rgba(255,255,255,0.85)',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
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
        <>
          <div
            className="blog-list-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: 24,
              paddingBottom: 32,
            }}
          >
            <AnimatePresence mode="sync">
              {paginatedPosts.map((post, idx) => {
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
        
        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              marginTop: 32,
              paddingBottom: 48,
            }}
          >
            {/* Previous Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.15)',
                background: currentPage === 1 ? 'rgba(30,30,35,0.5)' : 'rgba(30,30,35,0.9)',
                color: currentPage === 1 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.85)',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <i className="ri-arrow-left-s-line" />
              Trước
            </motion.button>

            {/* Page Numbers */}
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <motion.button
                  key={page}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    border: page === currentPage ? '1px solid #F5D393' : '1px solid rgba(255,255,255,0.15)',
                    background: page === currentPage ? '#F5D393' : 'rgba(30,30,35,0.9)',
                    color: page === currentPage ? '#111' : 'rgba(255,255,255,0.85)',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: page === currentPage ? 600 : 500,
                  }}
                >
                  {page}
                </motion.button>
              ))}
            </div>

            {/* Next Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.15)',
                background: currentPage === totalPages ? 'rgba(30,30,35,0.5)' : 'rgba(30,30,35,0.9)',
                color: currentPage === totalPages ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.85)',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Sau
              <i className="ri-arrow-right-s-line" />
            </motion.button>
          </motion.div>
        )}
        </>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Mobile: horizontal scroll for category filters */
        @media (max-width: 640px) {
          .blog-category-filters {
            flex-wrap: nowrap !important;
            justify-content: flex-start !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
            padding-bottom: 8px !important;
            margin-left: -8px !important;
            margin-right: -8px !important;
            padding-left: 8px !important;
            padding-right: 8px !important;
          }
          .blog-category-filters::-webkit-scrollbar {
            display: none;
          }
          .blog-category-btn {
            flex-shrink: 0;
            padding: 6px 12px !important;
            font-size: 12px !important;
          }
        }
      `}</style>
      </div>
    </div>
  );
}

