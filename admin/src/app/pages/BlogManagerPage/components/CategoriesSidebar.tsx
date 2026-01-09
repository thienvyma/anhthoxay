import { motion } from 'framer-motion';
import { tokens } from '../../../../theme';
import type { BlogCategory } from '../../../types';

interface CategoriesSidebarProps {
  categories: BlogCategory[];
  loading: boolean;
  selectedId: string | null;
  totalPosts: number;
  onSelect: (id: string | null) => void;
  onAdd: () => void;
  onEdit: (cat: BlogCategory) => void;
  onDelete: (id: string) => void;
  isMobile: boolean;
}

export function CategoriesSidebar({ 
  categories, 
  loading, 
  selectedId, 
  totalPosts, 
  onSelect, 
  onAdd, 
  onEdit, 
  onDelete,
  isMobile,
}: CategoriesSidebarProps) {
  return (
    <div style={{
      background: tokens.color.surfaceAlt,
      minHeight: isMobile ? 'auto' : 500,
    }}>
      {/* Header */}
      <div style={{ 
        padding: '14px 16px', 
        borderBottom: `1px solid ${tokens.color.border}`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: tokens.color.surfaceAlt,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ri-price-tag-3-line" style={{ fontSize: 16, color: tokens.color.primary }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: tokens.color.text }}>Danh mục</span>
        </div>
        <motion.button 
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.9 }} 
          onClick={onAdd} 
          style={{
            width: 26, height: 26, borderRadius: '6px', 
            background: `${tokens.color.primary}15`,
            border: `1px solid ${tokens.color.primary}30`, 
            color: tokens.color.primary, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
          }}
        >
          <i className="ri-add-line" />
        </motion.button>
      </div>

      {/* All Posts Item */}
      <button
        onClick={() => onSelect(null)}
        style={{
          width: '100%', padding: '10px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: selectedId === null ? `${tokens.color.primary}10` : 'transparent',
          border: 'none',
          borderLeft: selectedId === null ? `3px solid ${tokens.color.primary}` : '3px solid transparent',
          cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        <span style={{ 
          fontSize: 13, 
          color: selectedId === null ? tokens.color.primary : tokens.color.text,
          fontWeight: selectedId === null ? 600 : 400,
        }}>
          Tất cả bài viết
        </span>
        <span style={{ 
          fontSize: 11, color: tokens.color.muted,
          background: tokens.color.surfaceHover, padding: '2px 6px', borderRadius: 8,
        }}>
          {totalPosts}
        </span>
      </button>

      {/* Loading */}
      {loading && (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <motion.i
            className="ri-loader-4-line"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ fontSize: 20, color: tokens.color.muted }}
          />
        </div>
      )}

      {/* Categories List */}
      {!loading && categories.map((cat) => (
        <CategoryItem 
          key={cat.id} 
          category={cat} 
          isSelected={selectedId === cat.id}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}

      {/* Empty State */}
      {!loading && categories.length === 0 && (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: tokens.color.muted, margin: 0 }}>
            Chưa có danh mục nào
          </p>
        </div>
      )}
    </div>
  );
}

// Category Item sub-component
interface CategoryItemProps {
  category: BlogCategory;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
  onEdit: (cat: BlogCategory) => void;
  onDelete: (id: string) => void;
}

function CategoryItem({ category, isSelected, onSelect, onEdit, onDelete }: CategoryItemProps) {
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => onSelect(category.id)}
        style={{
          width: '100%', padding: '10px 16px', paddingRight: 60,
          display: 'flex', alignItems: 'center', gap: 8,
          background: isSelected ? `${tokens.color.primary}10` : 'transparent',
          border: 'none',
          borderLeft: isSelected ? `3px solid ${tokens.color.primary}` : '3px solid transparent',
          cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: category.color || tokens.color.primary, flexShrink: 0,
        }} />
        <span style={{ 
          fontSize: 13, 
          color: isSelected ? tokens.color.primary : tokens.color.text,
          fontWeight: isSelected ? 600 : 400,
          flex: 1, textAlign: 'left',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {category.name}
        </span>
        <span style={{ 
          fontSize: 11, color: tokens.color.muted,
          background: tokens.color.surfaceHover, padding: '2px 6px', borderRadius: 8,
        }}>
          {category._count?.posts || 0}
        </span>
      </button>

      {/* Action buttons */}
      <div style={{
        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', gap: 2, opacity: 0.5,
      }}>
        <motion.button
          whileHover={{ scale: 1.1, opacity: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); onEdit(category); }}
          style={{
            width: 22, height: 22, borderRadius: 4,
            background: 'transparent', border: 'none',
            color: tokens.color.muted, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
          }}
        >
          <i className="ri-edit-line" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1, opacity: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); onDelete(category.id); }}
          style={{
            width: 22, height: 22, borderRadius: 4,
            background: 'transparent', border: 'none',
            color: tokens.color.error, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
          }}
        >
          <i className="ri-delete-bin-line" />
        </motion.button>
      </div>
    </div>
  );
}
