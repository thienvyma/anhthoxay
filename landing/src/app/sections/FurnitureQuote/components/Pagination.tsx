/**
 * Pagination Component for FurnitureQuote
 * Provides pagination with page transition animation
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
}

export const Pagination = memo(function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Always show first page
    pages.push(1);

    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    // Show pages around current
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

    // Always show last page
    if (!pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        marginTop: '1rem',
        flexWrap: 'wrap',
      }}
    >
      {/* Previous Button */}
      <motion.button
        whileHover={{ scale: currentPage > 1 ? 1.05 : 1 }}
        whileTap={{ scale: currentPage > 1 ? 0.95 : 1 }}
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          padding: '0.5rem 0.75rem',
          borderRadius: tokens.radius.sm,
          border: `1px solid ${tokens.color.border}`,
          background: currentPage === 1 ? 'transparent' : tokens.color.surface,
          color: currentPage === 1 ? tokens.color.muted : tokens.color.text,
          fontSize: '0.875rem',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          opacity: currentPage === 1 ? 0.5 : 1,
        }}
      >
        <i className="ri-arrow-left-s-line" />
      </motion.button>

      {/* Page Numbers */}
      {visiblePages.map((page, idx) =>
        page === 'ellipsis' ? (
          <span
            key={`ellipsis-${idx}`}
            style={{
              padding: '0.5rem',
              color: tokens.color.muted,
              fontSize: '0.875rem',
            }}
          >
            ...
          </span>
        ) : (
          <motion.button
            key={page}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onPageChange(page)}
            style={{
              minWidth: 36,
              height: 36,
              borderRadius: tokens.radius.sm,
              border: `1px solid ${currentPage === page ? tokens.color.primary : tokens.color.border}`,
              background: currentPage === page ? tokens.color.primary : 'transparent',
              color: currentPage === page ? '#111' : tokens.color.text,
              fontSize: '0.875rem',
              fontWeight: currentPage === page ? 600 : 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {page}
          </motion.button>
        )
      )}

      {/* Next Button */}
      <motion.button
        whileHover={{ scale: currentPage < totalPages ? 1.05 : 1 }}
        whileTap={{ scale: currentPage < totalPages ? 0.95 : 1 }}
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          padding: '0.5rem 0.75rem',
          borderRadius: tokens.radius.sm,
          border: `1px solid ${tokens.color.border}`,
          background: currentPage === totalPages ? 'transparent' : tokens.color.surface,
          color: currentPage === totalPages ? tokens.color.muted : tokens.color.text,
          fontSize: '0.875rem',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          opacity: currentPage === totalPages ? 0.5 : 1,
        }}
      >
        <i className="ri-arrow-right-s-line" />
      </motion.button>

      {/* Items info */}
      {itemsPerPage && totalItems && (
        <span
          style={{
            marginLeft: '0.75rem',
            fontSize: '0.75rem',
            color: tokens.color.muted,
          }}
        >
          {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} / {totalItems}
        </span>
      )}
    </div>
  );
});
