import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CardImage } from './OptimizedImage';
import { blogAPI } from '../api';

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  categoryId: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
}

interface RelatedPostsProps {
  currentPostId: string;
  categoryId?: string;
  limit?: number;
  onPostClick: (slug: string) => void;
}

export function RelatedPosts({
  currentPostId,
  categoryId,
  limit = 3,
  onPostClick
}: RelatedPostsProps) {
  const [posts, setPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRelatedPosts();
  }, [currentPostId, categoryId]);

  const loadRelatedPosts = async () => {
    try {
      setLoading(true);
      const data = await blogAPI.getPosts({
        status: 'PUBLISHED',
        limit: limit + 1,
      });
      
      const filtered = data
        .filter((post: RelatedPost) => post.id !== currentPostId)
        .slice(0, limit);
      
      setPosts(filtered);
    } catch (error) {
      console.error('Failed to load related posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        background: 'rgba(18,18,22,0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '20px',
      }}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{
            width: '32px',
            height: '32px',
            margin: '0 auto',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: 'rgba(245,211,147,0.2) rgba(245,211,147,0.2) rgba(245,211,147,0.2) #f5d393',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        background: 'rgba(18,18,22,0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(245,211,147,0.2), rgba(239,182,121,0.1))',
          border: '1px solid rgba(245,211,147,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <i className="ri-article-line" style={{ fontSize: '20px', color: '#f5d393' }} />
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white', margin: 0 }}>
          Bài viết liên quan
        </h3>
      </div>

      {/* Posts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {posts.map((post, index) => (
          <motion.article
            key={post.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ x: 4, background: 'rgba(255,255,255,0.06)' }}
            onClick={() => onPostClick(post.slug)}
            style={{
              display: 'flex',
              gap: '12px',
              padding: '12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            {/* Thumbnail */}
            <div style={{ 
              width: '72px', 
              height: '72px', 
              borderRadius: '10px', 
              overflow: 'hidden',
              flexShrink: 0,
              background: '#111827'
            }}>
              {post.featuredImage ? (
                <CardImage
                  src={post.featuredImage}
                  alt={post.title}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #1f2937, #111827)'
                }}>
                  <i className="ri-image-line" style={{ fontSize: '24px', color: '#374151' }} />
                </div>
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'white',
                margin: 0,
                marginBottom: '6px',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {post.title}
              </h4>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <i className="ri-calendar-line" style={{ fontSize: '12px' }} />
                {post.publishedAt 
                  ? new Date(post.publishedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' })
                  : 'Chưa xuất bản'
                }
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </motion.div>
  );
}
