import { motion } from 'framer-motion';
import { resolveMediaUrl } from '@app/shared';
import { tokens } from '../../../../theme';
import { Button } from '../../../components/Button';
import { StatusBadge, FeaturedBadge } from './Badges';
import type { BlogPost } from '../../../types';

interface PostsListProps {
  posts: BlogPost[];
  loading: boolean;
  onEdit: (post: BlogPost) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

export function PostsList({ posts, loading, onEdit, onDelete, onCreateNew }: PostsListProps) {
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <motion.i
          className="ri-loader-4-line"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ fontSize: 32, color: tokens.color.muted }}
        />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <i className="ri-article-line" style={{ 
          fontSize: 48, color: tokens.color.border, marginBottom: 12, display: 'block' 
        }} />
        <p style={{ color: tokens.color.muted, marginBottom: 16, fontSize: 14 }}>
          Chưa có bài viết nào
        </p>
        <Button onClick={onCreateNew} icon="ri-add-line" variant="secondary" size="small">
          Tạo bài viết đầu tiên
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {posts.map((post, index) => (
        <PostCard key={post.id} post={post} index={index} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}

// Post Card Component
interface PostCardProps {
  post: BlogPost;
  index: number;
  onEdit: (post: BlogPost) => void;
  onDelete: (id: string) => void;
}

export function PostCard({ post, index, onEdit, onDelete }: PostCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      style={{
        padding: 12,
        background: tokens.color.surfaceAlt,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: tokens.radius.md,
        cursor: 'default',
        transition: 'all 0.2s',
      }}
      whileHover={{ background: tokens.color.surfaceHover }}
    >
      <div style={{ display: 'flex', gap: 12 }}>
        {post.featuredImage && (
          <img
            src={resolveMediaUrl(post.featuredImage)}
            alt={post.title}
            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ 
                fontSize: 14, fontWeight: 600, color: tokens.color.text, marginBottom: 2,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {post.title}
              </h3>
              <p style={{ fontSize: 11, color: tokens.color.muted, fontFamily: tokens.font.mono }}>
                /{post.slug}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 8 }}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onEdit(post)}
                style={{
                  padding: 6, background: tokens.color.surfaceHover,
                  border: `1px solid ${tokens.color.border}`, borderRadius: 6,
                  color: tokens.color.primary, cursor: 'pointer', fontSize: 12,
                }}
              >
                <i className="ri-edit-line" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onDelete(post.id)}
                style={{
                  padding: 6, background: tokens.color.surfaceHover,
                  border: `1px solid ${tokens.color.border}`, borderRadius: 6,
                  color: tokens.color.error, cursor: 'pointer', fontSize: 12,
                }}
              >
                <i className="ri-delete-bin-line" />
              </motion.button>
            </div>
          </div>

          {post.excerpt && (
            <p style={{ 
              color: tokens.color.muted, fontSize: 12, marginBottom: 8, lineHeight: 1.4,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {post.excerpt}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: tokens.color.muted, flexWrap: 'wrap' }}>
            <StatusBadge status={post.status} />
            {post.isFeatured && <FeaturedBadge />}
            {post.category && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: post.category.color || tokens.color.primary }} />
                {post.category.name}
              </span>
            )}
            {post.publishedAt && (
              <span>
                <i className="ri-calendar-line" style={{ marginRight: 4 }} />
                {new Date(post.publishedAt).toLocaleDateString('vi-VN')}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
