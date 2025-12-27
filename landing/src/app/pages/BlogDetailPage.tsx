import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { tokens, resolveMediaUrl } from '@app/shared';
import { OptimizedImage } from '../components/OptimizedImage';
import { ReadingProgressBar, ReadingProgressIndicator } from '../components/ReadingProgressBar';
import { SocialShareButtons, FloatingSocialShare } from '../components/SocialShare';
import { RelatedPosts } from '../components/RelatedPosts';
import { NewsletterSignup } from '../components/NewsletterSignup';
import { BlogImageThumbnail } from '../components/BlogImageThumbnail';
import { useToast } from '../components/Toast';
import { blogAPI } from '../api';
import { sanitizeSchema } from '../utils/markdown';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  categoryId: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
}

// Shared styles
const glassCardStyle = {
  background: 'rgba(12,12,16,0.85)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '24px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  color: 'white',
  fontSize: 15,
  outline: 'none',
  transition: 'all 0.3s',
  boxSizing: 'border-box' as const,
};

export function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentForm, setCommentForm] = useState({ name: '', email: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    blogAPI.getPost(slug)
      .then(setPost)
      .catch((err) => console.error('Failed to load post:', err))
      .finally(() => setLoading(false));
  }, [slug]);

  // Close lightbox on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxImage) setLightboxImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    try {
      setSubmitting(true);
      await blogAPI.addComment(post.id, {
        name: commentForm.name,
        email: commentForm.email,
        content: commentForm.content,
      });
      toast.success('Bình luận đã được gửi! Đang chờ duyệt.');
      setCommentForm({ name: '', email: '', content: '' });
    } catch {
      toast.error('Gửi bình luận thất bại. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateReadTime = (text: string) => {
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = `${tokens.color.primary}80`;
    e.target.style.background = 'rgba(255,255,255,0.08)';
    e.target.style.boxShadow = `0 0 0 4px ${tokens.color.primary}1A`;
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'rgba(255,255,255,0.08)';
    e.target.style.background = 'rgba(255,255,255,0.05)';
    e.target.style.boxShadow = 'none';
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b0c0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ ...glassCardStyle, padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          <div style={{ position: 'relative', width: '64px', height: '64px' }}>
            <div style={{ position: 'absolute', inset: 0, borderWidth: '4px', borderStyle: 'solid', borderColor: `${tokens.color.primary}33`, borderRadius: '50%' }} />
            <div style={{ position: 'absolute', inset: 0, borderWidth: '4px', borderStyle: 'solid', borderColor: `transparent transparent transparent ${tokens.color.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>Đang tải bài viết...</p>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Vui lòng chờ trong giây lát</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b0c0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ ...glassCardStyle, padding: '48px', maxWidth: '480px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: `linear-gradient(135deg, ${tokens.color.primary}26, ${tokens.color.primary}1A)`, border: `1px solid ${tokens.color.primary}4D`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ri-file-search-line" style={{ fontSize: '40px', color: tokens.color.primary }} />
          </div>
          <div>
            <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', fontWeight: 700, color: 'white', marginBottom: '12px' }}>Không tìm thấy bài viết</h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>Bài viết không tồn tại hoặc đã bị xóa</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/blog')} style={{ padding: '12px 24px', borderRadius: '12px', background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent || tokens.color.primary})`, border: 'none', color: '#0b0b0c', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="ri-arrow-left-line" /> Quay lại danh sách
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const readTime = calculateReadTime(post.content);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <ReadingProgressBar />
      <ReadingProgressIndicator totalMinutes={readTime} />
      <FloatingSocialShare title={post.title} url={currentUrl} excerpt={post.excerpt || undefined} />

      {/* Back Button */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 24px' }}>
        <motion.button onClick={() => navigate('/blog')} whileHover={{ x: -4 }} whileTap={{ scale: 0.95 }} style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 18px', color: tokens.color.primary, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          <i className="ri-arrow-left-line" style={{ fontSize: '20px' }} />
          Quay lại danh sách
        </motion.button>
      </div>

      {/* Featured Image */}
      {post.featuredImage && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} style={{ position: 'relative', maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: '100%', aspectRatio: '21/9', background: '#0a0a0c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <OptimizedImage src={post.featuredImage} alt={post.title} loading="eager" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
            </div>
          </div>
          <div style={{ position: 'absolute', inset: 0, margin: '0 24px', borderRadius: '20px', background: 'linear-gradient(to top, rgba(11,11,12,0.5), transparent 40%)' }} />
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ position: 'absolute', bottom: '20px', left: '44px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '50px', fontSize: '13px', fontWeight: 700, backdropFilter: 'blur(12px)', background: `linear-gradient(135deg, ${tokens.color.primary}DD, ${tokens.color.primary}BB)`, color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
              <i className="ri-price-tag-3-line" style={{ fontSize: '14px' }} />
              Blog
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Main Content */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '40px', alignItems: 'start' }} className="blog-detail-grid">
          <article>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
              {/* Title */}
              <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, color: 'white', marginBottom: '24px', lineHeight: 1.15, background: `linear-gradient(135deg, #ffffff 0%, ${tokens.color.primary} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {post.title}
              </h1>

              {/* Excerpt */}
              {post.excerpt && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} style={{ background: `${tokens.color.primary}14`, backdropFilter: 'blur(12px)', border: `1px solid ${tokens.color.primary}33`, borderLeft: `4px solid ${tokens.color.primary}`, borderRadius: '16px', padding: 'clamp(20px, 4vw, 32px)', marginBottom: '32px' }}>
                  <p style={{ fontSize: 'clamp(1.125rem, 2.5vw, 1.25rem)', lineHeight: 1.7, color: 'rgba(255,255,255,0.9)', fontStyle: 'italic', margin: 0 }}>{post.excerpt}</p>
                </motion.div>
              )}

              {/* Meta Info */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', paddingBottom: '32px', marginBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', ...glassCardStyle, borderRadius: '12px', padding: '10px 16px' }}>
                  <i className="ri-calendar-line" style={{ fontSize: '20px', color: tokens.color.primary }} />
                  <div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>Ngày đăng</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Chưa xuất bản'}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Content */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ ...glassCardStyle, padding: 'clamp(24px, 5vw, 48px)', marginBottom: '48px', fontSize: 'clamp(1rem, 2vw, 1.125rem)', lineHeight: 1.8 }}>
                <ReactMarkdown
                  rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
                  components={{
                    h1: (props) => <h1 style={{ fontWeight: 700, color: 'white', marginBottom: '24px', marginTop: '48px', paddingBottom: '12px', borderBottom: '1px solid rgba(128,128,128,0.5)', fontSize: 'clamp(1.75rem, 4vw, 2.25rem)' }} {...props} />,
                    h2: (props) => <h2 style={{ fontWeight: 700, color: 'white', marginBottom: '20px', marginTop: '40px', fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', paddingLeft: '16px', borderLeft: `4px solid ${tokens.color.primary}` }} {...props} />,
                    h3: (props) => <h3 style={{ fontWeight: 700, color: 'white', marginBottom: '16px', marginTop: '32px', fontSize: 'clamp(1.25rem, 3vw, 1.5rem)' }} {...props} />,
                    p: (props) => <p style={{ color: '#d4d4d8', marginBottom: '24px', lineHeight: 1.7, fontSize: 'clamp(1rem, 2vw, 1.125rem)' }} {...props} />,
                    ul: (props) => <ul style={{ listStyle: 'none', color: '#d4d4d8', marginBottom: '32px', marginLeft: 0, display: 'flex', flexDirection: 'column', gap: '12px' }} {...props} />,
                    ol: (props) => <ol style={{ listStylePosition: 'inside', color: '#d4d4d8', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }} {...props} />,
                    li: (props) => <li style={{ color: '#d4d4d8', display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: 'clamp(1rem, 2vw, 1.125rem)' }} {...props} />,
                    a: (props) => <a style={{ color: tokens.color.primary, textDecoration: 'underline', textUnderlineOffset: '4px', fontWeight: 500 }} {...props} />,
                    blockquote: (props) => <blockquote style={{ margin: '32px 0', borderRadius: '12px', fontStyle: 'italic', background: `${tokens.color.primary}14`, border: `1px solid ${tokens.color.primary}33`, borderLeft: `4px solid ${tokens.color.primary}`, padding: 'clamp(20px, 4vw, 32px)', color: 'rgba(255,255,255,0.85)' }} {...props} />,
                    code: (props) => <code style={{ fontFamily: 'monospace', fontSize: '14px', background: `${tokens.color.primary}26`, color: tokens.color.primary, padding: '2px 8px', borderRadius: '6px' }} {...props} />,
                    pre: (props) => <pre style={{ overflowX: 'auto', marginBottom: '32px', borderRadius: '12px', background: 'rgba(0,0,0,0.4)', padding: 'clamp(16px, 3vw, 24px)' }} {...props} />,
                    strong: (props) => <strong style={{ color: 'white', fontWeight: 600 }} {...props} />,
                    img: (props) => {
                      const imgSrc = props.src as string;
                      const resolvedSrc = resolveMediaUrl(imgSrc);
                      return <BlogImageThumbnail src={imgSrc} alt={props.alt as string} onClick={() => setLightboxImage(resolvedSrc)} />;
                    },
                  }}
                >
                  {post.content}
                </ReactMarkdown>
              </motion.div>

              {/* Social Share */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} style={{ marginBottom: '48px' }}>
                <SocialShareButtons title={post.title} url={currentUrl} excerpt={post.excerpt || undefined} />
              </motion.div>

              {/* Newsletter */}
              <div style={{ marginTop: '48px', marginBottom: '48px' }}>
                <NewsletterSignup variant="inline" />
              </div>

              {/* Comment Form */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} style={{ ...glassCardStyle, padding: 'clamp(24px, 5vw, 40px)', marginTop: 48 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ width: '56px', height: '56px', background: `linear-gradient(135deg, ${tokens.color.primary}33, ${tokens.color.primary}1A)`, borderRadius: '16px', border: `1px solid ${tokens.color.primary}4D`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ri-message-3-line" style={{ fontSize: '28px', color: tokens.color.primary }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', fontWeight: 700, color: 'white', marginBottom: '4px' }}>Để lại bình luận</h3>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Chia sẻ suy nghĩ của bạn về bài viết này</p>
                  </div>
                </div>
                <form onSubmit={handleCommentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>Tên của bạn *</label>
                      <input type="text" value={commentForm.name} onChange={(e) => setCommentForm({ ...commentForm, name: e.target.value })} placeholder="Nhập tên của bạn" required style={inputStyle} onFocus={handleInputFocus} onBlur={handleInputBlur} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>Email *</label>
                      <input type="email" value={commentForm.email} onChange={(e) => setCommentForm({ ...commentForm, email: e.target.value })} placeholder="email@example.com" required style={inputStyle} onFocus={handleInputFocus} onBlur={handleInputBlur} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>Nội dung bình luận *</label>
                    <textarea value={commentForm.content} onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })} placeholder="Chia sẻ suy nghĩ của bạn..." required rows={5} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} onFocus={handleInputFocus} onBlur={handleInputBlur} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: `${tokens.color.primary}14`, border: `1px solid ${tokens.color.primary}33`, borderRadius: '12px' }}>
                      <i className="ri-information-line" style={{ fontSize: '18px', color: tokens.color.primary }} />
                      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>Bình luận sẽ được kiểm duyệt trước khi hiển thị</p>
                    </div>
                    <motion.button type="submit" disabled={submitting} whileHover={{ scale: submitting ? 1 : 1.02 }} whileTap={{ scale: submitting ? 1 : 0.98 }} style={{ padding: '16px 32px', background: submitting ? `${tokens.color.primary}80` : `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent || tokens.color.primary})`, color: '#0b0b0c', fontWeight: 700, fontSize: '15px', borderRadius: 12, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, alignSelf: 'flex-start' }}>
                      {submitting ? 'Đang gửi...' : <><i className="ri-send-plane-fill" style={{ fontSize: '18px' }} /> Gửi bình luận</>}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          </article>

          {/* Sidebar */}
          <aside className="blog-sidebar" style={{ position: 'sticky', top: '120px', alignSelf: 'start' }}>
            <RelatedPosts currentPostId={post.id} categoryId={post.categoryId} limit={3} onPostClick={(slug) => navigate(`/blog/${slug}`)} />
          </aside>
        </div>
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 1024px) {
          .blog-detail-grid { grid-template-columns: 1fr !important; }
          .blog-sidebar { position: relative !important; top: 0 !important; }
        }
      `}</style>

      {/* Lightbox */}
      {lightboxImage && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightboxImage(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', zIndex: 10005, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', cursor: 'zoom-out' }}>
          <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setLightboxImage(null)} style={{ position: 'absolute', top: '20px', right: '20px', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10006 }}>
            <i className="ri-close-line" />
          </motion.button>
          <motion.img initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} src={lightboxImage} alt="Fullscreen" style={{ maxWidth: '95%', maxHeight: '95vh', objectFit: 'contain', borderRadius: '12px' }} onClick={(e) => e.stopPropagation()} />
          <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', borderRadius: '12px', padding: '12px 24px', color: 'rgba(255,255,255,0.8)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="ri-information-line" /> Nhấn <kbd style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '4px', margin: '0 4px' }}>ESC</kbd> để đóng
          </div>
        </motion.div>
      )}
    </div>
  );
}
