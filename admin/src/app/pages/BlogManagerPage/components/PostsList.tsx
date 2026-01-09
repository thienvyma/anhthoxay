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
      <div style={{ padding: 60, textAlign: 'center' }}>
        <motion.i
          className="ri-loader-4-line"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ fontSize: 40, color: tokens.color.primary }}
        />
        <p style={{ color: tokens.color.muted, marginTop: 16 }}>Đang tải bài viết...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: `${tokens.color.primary}10`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <i className="ri-article-line" style={{ fontSize: 36, color: tokens.color.primary }} />
        </div>
        <h3 style={{ color: tokens.color.text, fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>
          Chưa có bài viết nào
        </h3>
        <p style={{ color: tokens.color.muted, marginBottom: 20, fontSize: 14 }}>
          Bắt đầu tạo nội dung cho blog của bạn
        </p>
        <Button onClick={onCreateNew} icon="ri-add-line">
          Viết bài đầu tiên
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
      transition={{ delay: index * 0.03 }}
      onClick={() => onEdit(post)}
      style={{
        padding: 16,
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: tokens.radius.lg,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      whileHover={{
        borderColor: tokens.color.primary,
        boxShadow: `0 4px 12px ${tokens.color.primary}15`,
      }}
    >
      <div style={{ display: 'flex', gap: 16 }}>
        {/* Thumbnail */}
        {post.featuredImage ? (
          <img
            src={resolveMediaUrl(post.featuredImage)}
            alt={post.title}
            style={{
              width: 100,
              height: 100,
              objectFit: 'cover',
              borderRadius: tokens.radius.md,
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: tokens.radius.md,
              background: tokens.color.surfaceAlt,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <i className="ri-image-line" style={{ fontSize: 32, color: tokens.color.border }} />
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title & Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: tokens.color.text,
                  margin: '0 0 4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {post.title}
              </h3>
              <p
                style={{
                  fontSize: 12,
                  color: tokens.color.muted,
                  fontFamily: tokens.font.mono,
                  margin: 0,
                }}
              >
                /{post.slug}
              </p>
            </div>

            {/* Action Buttons */}
            <div
              style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onEdit(post)}
                style={{
                  padding: 8,
                  background: `${tokens.color.primary}15`,
                  border: `1px solid ${tokens.color.primary}30`,
                  borderRadius: tokens.radius.md,
                  color: tokens.color.primary,
                  cursor: 'pointer',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Chỉnh sửa"
              >
                <i className="ri-edit-line" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onDelete(post.id)}
                style={{
                  padding: 8,
                  background: `${tokens.color.error}15`,
                  border: `1px solid ${tokens.color.error}30`,
                  borderRadius: tokens.radius.md,
                  color: tokens.color.error,
                  cursor: 'pointer',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Xóa"
              >
                <i className="ri-delete-bin-line" />
              </motion.button>
            </div>
          </div>

          {/* Excerpt */}
          {post.excerpt && (
            <p
              style={{
                color: tokens.color.textMuted,
                fontSize: 13,
                marginBottom: 12,
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
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
              gap: 12,
              fontSize: 12,
              color: tokens.color.muted,
              flexWrap: 'wrap',
            }}
          >
            <StatusBadge status={post.status} />
            {post.isFeatured && <FeaturedBadge />}

            {post.category && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 10px',
                  background: tokens.color.surfaceAlt,
                  borderRadius: tokens.radius.pill,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: post.category.color || tokens.color.primary,
                  }}
                />
                {post.category.name}
              </span>
            )}

            {post.publishedAt && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className="ri-calendar-line" />
                {new Date(post.publishedAt).toLocaleDateString('vi-VN')}
              </span>
            )}

            {post.author && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className="ri-user-line" />
                {post.author.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
