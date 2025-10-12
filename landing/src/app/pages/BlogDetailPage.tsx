import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { OptimizedImage } from '../components/OptimizedImage';
import { ReadingProgressBar, ReadingProgressIndicator } from '../components/ReadingProgressBar';
import { SocialShareButtons, FloatingSocialShare } from '../components/SocialShare';
import { RelatedPosts } from '../components/RelatedPosts';
import { NewsletterSignup } from '../components/NewsletterSignup';
import { blogAPI } from '../api';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
  };
  author: {
    name: string;
    email: string;
  };
  tags: string | null;
  publishedAt: string;
  _count: {
    comments: number;
  };
}

interface Comment {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  status: string;
}

// TEST: Sample markdown with image for debugging
const TEST_MARKDOWN_WITH_IMAGE = `
# Test Article with Image

This is a test paragraph before the image.

![Test Image](https://images.unsplash.com/photo-1518770660439-4636190af475?w=800)

This is a test paragraph after the image. The hover effect should work on the image above.

Another paragraph here to test scrolling and layout.
`;

// Blog Image Thumbnail - Banner style with lightbox
function BlogImageThumbnail({ src, alt, onClick }: { src?: string; alt?: string; onClick?: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  
  // DEBUG: Only log on mount, not on every render
  useEffect(() => {
    console.log('🖼️ BlogImageThumbnail MOUNTED:', { src, alt });
  }, []);
  
  return (
    <div 
      onMouseEnter={(e) => {
        console.log('🎯 Mouse ENTER - Hover activated!', e.currentTarget);
        setIsHovered(true);
      }}
      onMouseLeave={(e) => {
        console.log('🎯 Mouse LEAVE - Hover deactivated!', e.currentTarget);
        setIsHovered(false);
      }}
      onClick={(e) => {
        console.log('🖱️ Image clicked!', e.currentTarget);
        onClick?.();
      }}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '800px',
        height: '200px',
        margin: '32px auto',
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        border: isHovered 
          ? '3px solid rgba(255, 215, 0, 0.9)' 
          : '2px solid rgba(255,255,255,0.2)',
        boxShadow: isHovered
          ? '0 0 40px rgba(255, 215, 0, 0.6), 0 8px 32px rgba(0,0,0,0.4)'
          : '0 8px 32px rgba(0,0,0,0.4)',
        transition: 'all 0.3s ease',
        background: isHovered ? 'rgba(255, 215, 0, 0.05)' : 'transparent'
      }}
    >
      {/* Image - render first (bottom layer) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          backgroundImage: `url(${src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 0.5s ease',
          pointerEvents: 'none'
        }}
      />
      
      {/* Overlay gradient - middle layer - REMOVED pointerEvents none to ensure it doesn't block */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: isHovered 
          ? 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.3))' 
          : 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.2))',
        zIndex: 1,
        transition: 'all 0.3s ease'
      }} />
      
      {/* Hover Icon - top layer */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${isHovered ? 1 : 0.8})`,
        opacity: isHovered ? 1 : 0,
        zIndex: 10,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(12px)',
        border: '2px solid rgba(255, 215, 0, 0.6)',
        borderRadius: '50%',
        width: '72px',
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        pointerEvents: 'none',
        fontSize: '32px',
        color: 'white',
        boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
      }}>
        🔍
      </div>
      
      {/* Hint badge - top layer */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 215, 0, 0.5)',
        borderRadius: '8px',
        padding: '8px 14px',
        fontSize: '13px',
        color: 'rgba(255,255,255,0.95)',
        fontWeight: 500,
        zIndex: 10,
        opacity: isHovered ? 1 : 0,
        transform: isHovered ? 'translateY(0)' : 'translateY(10px)',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        pointerEvents: 'none',
        boxShadow: '0 0 15px rgba(255, 215, 0, 0.2)'
      }}>
        🔍 Click để xem full
      </div>
      
      {/* DEBUG: Hover state indicator */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        background: isHovered ? 'rgba(0, 255, 0, 0.9)' : 'rgba(255, 0, 0, 0.9)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: 'bold',
        zIndex: 100,
        pointerEvents: 'none'
      }}>
        HOVER: {isHovered ? 'TRUE ✅' : 'FALSE ❌'}
      </div>
    </div>
  );
}

export function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentForm, setCommentForm] = useState({
    name: '',
    email: '',
    content: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    loadPost();
  }, [slug]);

  // Close lightbox on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxImage) {
        setLightboxImage(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage]);

  const loadPost = async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const data = await blogAPI.getPost(slug);
      setPost(data);
    } catch (error) {
      console.error('Failed to load post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;

    try {
      setSubmitting(true);
      await blogAPI.addComment(post.id, {
        author: commentForm.name,
        email: commentForm.email,
        content: commentForm.content,
      });
      alert('Comment submitted! Đang chờ duyệt.');
      setCommentForm({ name: '', email: '', content: '' });
      await loadPost();
    } catch (error) {
      console.error('Failed to submit comment:', error);
      alert('Gửi comment thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateReadTime = (text: string) => {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b0c0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            padding: '48px',
            background: 'rgba(12,12,16,0.85)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}>
          <div style={{ position: 'relative', width: '64px', height: '64px' }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              border: '4px solid rgba(245,211,147,0.2)',
              borderRadius: '50%'
            }} />
            <div style={{
              position: 'absolute',
              inset: 0,
              border: '4px solid transparent',
              borderTopColor: '#f5d393',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{
              position: 'absolute',
              inset: '8px',
              background: 'radial-gradient(circle, rgba(245,211,147,0.2), transparent)',
              borderRadius: '50%',
              animation: 'pulse 2s ease-in-out infinite'
            }} />
          </div>
          <div>
            <p style={{ 
              fontSize: '16px', 
              fontWeight: 600, 
              color: 'white',
              marginBottom: '8px'
            }}>
              Đang tải bài viết...
            </p>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
              Vui lòng chờ trong giây lát
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b0c0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            padding: '48px',
            background: 'rgba(12,12,16,0.85)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            maxWidth: '480px',
            textAlign: 'center'
          }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(245,211,147,0.15), rgba(239,182,121,0.1))',
            border: '1px solid rgba(245,211,147,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(245,211,147,0.2)'
          }}>
            <i className="ri-file-search-line" style={{ fontSize: '40px', color: '#f5d393' }} />
          </div>
          <div>
            <h2 style={{ 
              fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', 
              fontWeight: 700, 
              color: 'white',
              marginBottom: '12px'
            }}>
              Không tìm thấy bài viết
            </h2>
            <p style={{ 
              fontSize: '14px', 
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.6
            }}>
              Bài viết không tồn tại hoặc đã bị xóa
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/blog')}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f5d393, #efb679)',
              border: 'none',
              color: '#0b0b0c',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(245,211,147,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <i className="ri-arrow-left-line" style={{ fontSize: '16px' }} />
            Quay lại danh sách
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const tags = post.tags ? post.tags.split(',').map((t) => t.trim()) : [];
  const readTime = calculateReadTime(post.content);

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      {/* Reading Progress Bar */}
      <ReadingProgressBar />
      
      {/* Reading Progress Indicator */}
      <ReadingProgressIndicator totalMinutes={readTime} />
      
      {/* Floating Social Share (Desktop) */}
      <FloatingSocialShare 
        title={post.title} 
        url={typeof window !== 'undefined' ? window.location.href : ''}
        excerpt={post.excerpt || undefined}
      />

      {/* Back Button - Glass Style */}
      <div style={{
        background: 'rgba(11,12,15,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky',
        top: '68px',
        zIndex: 9998,
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        marginTop: '-4px'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '12px 16px' }}>
          <motion.button
            onClick={() => navigate('/blog')}
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '8px 16px',
              color: '#F5D393',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <i className="ri-arrow-left-line" style={{ fontSize: '20px' }} />
            Quay lại danh sách
          </motion.button>
        </div>
      </div>

      {/* Featured Image - Enhanced with Glass Overlay */}
      {post.featuredImage && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          style={{ position: 'relative', height: '450px', background: '#1a1a1a', overflow: 'hidden' }}
        >
          <OptimizedImage
            src={post.featuredImage}
            alt={post.title}
            loading="eager"
            style={{ 
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center'
            }}
          />
          {/* Multi-layer Gradient Overlay - Blend with body background */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0b0b0c, rgba(11,11,12,0.7), transparent)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, transparent, #0b0b0c)' }} />
          
          {/* Floating Category Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ position: 'absolute', bottom: '32px', left: '32px' }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '50px',
                fontSize: '14px',
                fontWeight: 700,
                backdropFilter: 'blur(12px)',
                boxShadow: `0 8px 24px ${post.category.color || '#f5d393'}60`,
                background: `linear-gradient(135deg, ${post.category.color || '#f5d393'}dd, ${post.category.color || '#efb679'}bb)`,
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <i className="ri-price-tag-3-line" style={{ fontSize: '16px' }} />
              {post.category.name}
        </div>
          </motion.div>
        </motion.div>
      )}

      {/* Article */}
      <article style={{ maxWidth: '1024px', margin: '0 auto', padding: '64px 24px' }}>
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Title - Enhanced Typography */}
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            color: 'white',
            marginBottom: '24px',
            lineHeight: 1.15,
            background: 'linear-gradient(135deg, #ffffff 0%, #f5d393 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em'
          }}>
            {post.title}
          </h1>

          {/* Excerpt - Glass Card */}
          {post.excerpt && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                background: 'rgba(245,211,147,0.08)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(245,211,147,0.2)',
                borderLeft: '4px solid #f5d393',
                borderRadius: '16px',
                padding: 'clamp(20px, 4vw, 32px)',
                marginBottom: '32px',
                boxShadow: '0 4px 16px rgba(245,211,147,0.1)'
              }}
            >
              <p style={{
                fontSize: 'clamp(1.125rem, 2.5vw, 1.25rem)',
                lineHeight: 1.7,
                color: 'rgba(255,255,255,0.9)',
                fontStyle: 'italic',
                margin: 0
              }}>
                {post.excerpt}
              </p>
            </motion.div>
          )}

          {/* Meta Info - Enhanced Glass Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              paddingBottom: '32px',
              marginBottom: '32px',
              borderBottom: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(12,12,16,0.7)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '10px 16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f5d393, #efb679)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 700,
                color: '#0b0b0c',
                boxShadow: '0 4px 12px rgba(245,211,147,0.3)'
              }}>
                {post.author.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>
                  Tác giả
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>
                  {post.author.name}
                </div>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(12,12,16,0.7)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '10px 16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              <i className="ri-calendar-line" style={{ fontSize: '20px', color: '#f5d393' }} />
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>
                  Ngày đăng
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>
                  {new Date(post.publishedAt).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: 'short',
                year: 'numeric',
                  })}
                </div>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(12,12,16,0.7)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '10px 16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              <i className="ri-message-3-line" style={{ fontSize: '20px', color: '#f5d393' }} />
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>
                  Bình luận
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>
                  {post._count.comments}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content - Enhanced Typography with Glass Background */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              maxWidth: '100%',
              marginBottom: '48px',
              fontSize: 'clamp(1rem, 2vw, 1.125rem)',
              lineHeight: 1.8,
              background: 'rgba(12,12,16,0.75)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '24px',
              padding: 'clamp(24px, 5vw, 48px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
            }}
          >
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => (
                  <h1 
                    style={{ 
                      fontWeight: 700, 
                      color: 'white', 
                      marginBottom: '24px', 
                      marginTop: '48px', 
                      paddingBottom: '12px', 
                      borderBottom: '1px solid rgba(128,128,128,0.5)',
                      fontSize: 'clamp(1.75rem, 4vw, 2.25rem)' 
                    }}
                    {...props} 
                  />
                ),
                h2: ({ node, ...props }) => (
                  <h2 
                    style={{ 
                      fontWeight: 700, 
                      color: 'white', 
                      marginBottom: '20px', 
                      marginTop: '40px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
                      paddingLeft: '16px',
                      borderLeft: '4px solid #f5d393'
                    }}
                    {...props} 
                  />
                ),
                h3: ({ node, ...props }) => (
                  <h3 
                    style={{ 
                      fontWeight: 700, 
                      color: 'white', 
                      marginBottom: '16px', 
                      marginTop: '32px',
                      fontSize: 'clamp(1.25rem, 3vw, 1.5rem)' 
                    }}
                    {...props} 
                  />
                ),
                p: ({ node, ...props }) => (
                  <p 
                    style={{ 
                      color: '#d4d4d8', 
                      marginBottom: '24px', 
                      lineHeight: 1.7,
                      fontSize: 'clamp(1rem, 2vw, 1.125rem)' 
                    }}
                    {...props} 
                  />
                ),
                ul: ({ node, ...props }) => (
                  <ul style={{ listStyle: 'none', color: '#d4d4d8', marginBottom: '32px', marginLeft: 0, display: 'flex', flexDirection: 'column', gap: '12px' }} {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol style={{ listStylePosition: 'inside', color: '#d4d4d8', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }} {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li 
                    style={{ 
                      color: '#d4d4d8', 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '12px',
                      fontSize: 'clamp(1rem, 2vw, 1.125rem)' 
                    }}
                    {...props} 
                  />
                ),
                a: ({ node, ...props }) => (
                  <a 
                    style={{ 
                      color: '#f5d393', 
                      textDecoration: 'underline', 
                      textUnderlineOffset: '4px', 
                      textDecorationThickness: '2px',
                      fontWeight: 500,
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#efb679'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#f5d393'}
                    {...props} 
                  />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote 
                    style={{
                      margin: '32px 0',
                      borderRadius: '12px',
                      fontStyle: 'italic',
                      background: 'rgba(245,211,147,0.08)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(245,211,147,0.2)',
                      borderLeft: '4px solid #f5d393',
                      padding: 'clamp(20px, 4vw, 32px)',
                      color: 'rgba(255,255,255,0.85)',
                      boxShadow: '0 4px 16px rgba(245,211,147,0.1)'
                    }}
                    {...props} 
                  />
                ),
                code: ({ node, ...props }) => (
                  <code 
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      background: 'rgba(245,211,147,0.15)',
                      color: '#f5d393',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(245,211,147,0.3)'
                    }}
                    {...props} 
                  />
                ),
                pre: ({ node, ...props }) => (
                  <pre 
                    style={{
                      overflowX: 'auto',
                      marginBottom: '32px',
                      borderRadius: '12px',
                      background: 'rgba(0,0,0,0.4)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: 'clamp(16px, 3vw, 24px)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
                    }}
                    {...props} 
                  />
                ),
                strong: ({ node, ...props }) => (
                  <strong style={{ color: 'white', fontWeight: 600 }} {...props} />
                ),
                em: ({ node, ...props }) => (
                  <em style={{ color: '#e4e4e7', fontStyle: 'italic' }} {...props} />
                ),
                img: ({ node, ...props }) => (
                  <BlogImageThumbnail 
                    src={props.src as string}
                    alt={props.alt as string}
                    onClick={() => setLightboxImage(props.src as string)}
                  />
                ),
              }}
            >
              {/* TEST MODE: Use slug 'test' to render test markdown with image */}
              {slug === 'test' ? TEST_MARKDOWN_WITH_IMAGE : post.content}
            </ReactMarkdown>
          </motion.div>

          {/* Tags - Glass Style */}
          {tags.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={{
                marginBottom: '48px',
                background: 'rgba(12,12,16,0.85)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                padding: 'clamp(20px, 4vw, 32px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px'
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
                  boxShadow: '0 4px 16px rgba(245,211,147,0.2)'
                }}>
                  <i className="ri-price-tag-3-line" style={{ fontSize: '20px', color: '#f5d393' }} />
                </div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'white',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                Tags
              </h3>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {tags.map((tag, i) => (
                  <motion.span
                    key={i}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(245,211,147,0.1)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(245,211,147,0.3)',
                      borderRadius: '12px',
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(245,211,147,0.2)';
                      e.currentTarget.style.borderColor = 'rgba(245,211,147,0.5)';
                      e.currentTarget.style.color = '#f5d393';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(245,211,147,0.1)';
                      e.currentTarget.style.borderColor = 'rgba(245,211,147,0.3)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                    }}
                  >
                    <span style={{ fontSize: '12px', opacity: 0.7 }}>#</span>
                    {tag}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Social Share Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            style={{ marginBottom: '48px' }}
          >
            <SocialShareButtons
              title={post.title}
              url={typeof window !== 'undefined' ? window.location.href : ''}
              excerpt={post.excerpt || undefined}
            />
          </motion.div>

          {/* Related Posts */}
          <RelatedPosts
            currentPostId={post.id}
            categoryId={post.category.id}
            limit={3}
            onPostClick={() => navigate('/blog')}
          />

          {/* Newsletter Signup */}
          <div style={{ marginTop: '48px', marginBottom: '48px' }}>
            <NewsletterSignup variant="inline" />
          </div>

          {/* Comment Form - Enhanced Glass Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            style={{
              background: 'rgba(12,12,16,0.85)',
              backdropFilter: 'blur(20px)',
              borderRadius: 24,
              border: '1px solid rgba(255,255,255,0.08)',
              padding: 'clamp(24px, 5vw, 40px)',
              marginTop: 48,
              boxShadow: '0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px', 
              marginBottom: '32px' 
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, rgba(245,211,147,0.2), rgba(239,182,121,0.1))',
                borderRadius: '16px',
                border: '1px solid rgba(245,211,147,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(245,211,147,0.2)'
              }}>
                <i className="ri-message-3-line" style={{ fontSize: '28px', color: '#F5D393' }} />
              </div>
              <div>
                <h3 style={{ 
                  fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', 
                  fontWeight: 700, 
                  color: 'white',
                  marginBottom: '4px'
                }}>
              Để lại bình luận
            </h3>
                <p style={{ 
                  fontSize: '14px', 
                  color: 'rgba(255,255,255,0.5)' 
                }}>
                  Chia sẻ suy nghĩ của bạn về bài viết này
                </p>
              </div>
            </div>
            <form onSubmit={handleCommentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '16px' 
              }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    color: 'rgba(255,255,255,0.7)', 
                    marginBottom: '8px' 
                  }}>
                    Tên của bạn *
                  </label>
                <input
                  type="text"
                  value={commentForm.name}
                  onChange={(e) => setCommentForm({ ...commentForm, name: e.target.value })}
                    placeholder="Nhập tên của bạn"
                  required
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: 'rgba(255,255,255,0.05)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      color: 'white',
                      fontSize: 15,
                      outline: 'none',
                      transition: 'all 0.3s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(245,211,147,0.5)';
                      e.target.style.background = 'rgba(255,255,255,0.08)';
                      e.target.style.boxShadow = '0 0 0 4px rgba(245,211,147,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                      e.target.style.background = 'rgba(255,255,255,0.05)';
                      e.target.style.boxShadow = 'none';
                    }}
                    className="placeholder-gray-500"
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    color: 'rgba(255,255,255,0.7)', 
                    marginBottom: '8px' 
                  }}>
                    Email *
                  </label>
                <input
                  type="email"
                  value={commentForm.email}
                  onChange={(e) => setCommentForm({ ...commentForm, email: e.target.value })}
                    placeholder="email@example.com"
                  required
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: 'rgba(255,255,255,0.05)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      color: 'white',
                      fontSize: 15,
                      outline: 'none',
                      transition: 'all 0.3s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(245,211,147,0.5)';
                      e.target.style.background = 'rgba(255,255,255,0.08)';
                      e.target.style.boxShadow = '0 0 0 4px rgba(245,211,147,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                      e.target.style.background = 'rgba(255,255,255,0.05)';
                      e.target.style.boxShadow = 'none';
                    }}
                    className="placeholder-gray-500"
                  />
                </div>
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  color: 'rgba(255,255,255,0.7)', 
                  marginBottom: '8px' 
                }}>
                  Nội dung bình luận *
                </label>
              <textarea
                value={commentForm.content}
                onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
                  placeholder="Chia sẻ suy nghĩ của bạn về bài viết này..."
                required
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    color: 'white',
                    fontSize: 15,
                    outline: 'none',
                    resize: 'vertical',
                    transition: 'all 0.3s',
                    lineHeight: 1.6
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(245,211,147,0.5)';
                    e.target.style.background = 'rgba(255,255,255,0.08)';
                    e.target.style.boxShadow = '0 0 0 4px rgba(245,211,147,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.target.style.background = 'rgba(255,255,255,0.05)';
                    e.target.style.boxShadow = 'none';
                  }}
                  className="placeholder-gray-500"
                />
              </div>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '16px',
                paddingTop: '8px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  background: 'rgba(245,211,147,0.08)',
                  border: '1px solid rgba(245,211,147,0.2)',
                  borderRadius: '12px'
                }}>
                  <i className="ri-information-line" style={{ fontSize: '18px', color: '#f5d393' }} />
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                    Bình luận sẽ được kiểm duyệt trước khi hiển thị công khai
                  </p>
                </div>
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={{ scale: submitting ? 1 : 1.02, y: submitting ? 0 : -2 }}
                  whileTap={{ scale: submitting ? 1 : 0.98 }}
                  style={{
                    padding: '16px 32px',
                    background: submitting 
                      ? 'rgba(245,211,147,0.5)' 
                      : 'linear-gradient(135deg, #F5D393, #EFB679)',
                    color: '#0b0b0c',
                    fontWeight: 700,
                    fontSize: '15px',
                    borderRadius: 12,
                    border: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    boxShadow: submitting 
                      ? 'none' 
                      : '0 8px 24px rgba(245,211,147,0.35)',
                    transition: 'all 0.3s',
                    alignSelf: 'flex-start'
                  }}
                >
                  {submitting ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(11,11,12,0.3)',
                        borderTopColor: '#0b0b0c',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }} />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <i className="ri-send-plane-fill" style={{ fontSize: '18px' }} />
                      Gửi bình luận
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </article>

      {/* Image Lightbox */}
      {lightboxImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.95)',
            backdropFilter: 'blur(20px)',
            zIndex: 10005,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            cursor: 'zoom-out'
          }}
        >
          {/* Close Button */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setLightboxImage(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              fontSize: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10006,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
          >
            <i className="ri-close-line" />
          </motion.button>

          {/* Image */}
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            src={lightboxImage}
            alt="Fullscreen"
            style={{
              maxWidth: '95%',
              maxHeight: '95vh',
              objectFit: 'contain',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Helper Text */}
          <div style={{
            position: 'absolute',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            padding: '12px 24px',
            color: 'rgba(255,255,255,0.8)',
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="ri-information-line" style={{ fontSize: '16px' }} />
            Nhấn <kbd style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px',
              margin: '0 4px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>ESC</kbd> hoặc click bên ngoài để đóng
          </div>
        </motion.div>
      )}
    </div>
  );
}

