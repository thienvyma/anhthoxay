/**
 * ResponsiveFilters Component for Portal
 * Filter controls that adapt to screen size
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4 - Collapsible filters on mobile
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResponsive } from '../../hooks/useResponsive';
import { tokens } from '@app/shared';

export interface FilterOption {
  /** Unique filter identifier */
  id: string;

  /** Filter label */
  label: string;

  /** Filter type */
  type: 'select' | 'search' | 'date' | 'custom';

  /** Options for select type */
  options?: Array<{ value: string; label: string }>;

  /** Current value */
  value: string;

  /** Placeholder text */
  placeholder?: string;

  /** Custom render function */
  render?: (value: string, onChange: (value: string) => void) => React.ReactNode;
}

export interface ResponsiveFiltersProps {
  /** Array of filter configurations */
  filters: FilterOption[];

  /** Callback when any filter changes */
  onFilterChange: (filterId: string, value: string) => void;

  /** Callback to clear all filters */
  onClearAll?: () => void;

  /** Show active filter count badge */
  showActiveCount?: boolean;

  /** Collapsible on mobile */
  collapsibleMobile?: boolean;

  /** Additional CSS class */
  className?: string;

  /** Test ID for testing */
  testId?: string;
}

/**
 * ResponsiveFilters - Filter controls that adapt to screen size
 * Property 5: Filters collapse on mobile
 * Property 6: Filter badge shows active count
 *
 * @example
 * <ResponsiveFilters
 *   filters={[
 *     { id: 'search', label: 'Tìm kiếm', type: 'search', value: search, placeholder: 'Tìm công trình...' },
 *     { id: 'status', label: 'Trạng thái', type: 'select', value: status, options: statusOptions },
 *   ]}
 *   onFilterChange={(id, value) => handleFilterChange(id, value)}
 *   onClearAll={() => clearFilters()}
 * />
 */
export function ResponsiveFilters({
  filters,
  onFilterChange,
  onClearAll,
  showActiveCount = true,
  collapsibleMobile = true,
  className = '',
  testId,
}: ResponsiveFiltersProps) {
  const { isMobile } = useResponsive();
  const [isExpanded, setIsExpanded] = useState(false);

  // Count active filters - Property 6
  const activeCount = useMemo(
    () => filters.filter((f) => f.value && f.value.trim() !== '').length,
    [filters]
  );

  // Render individual filter
  const renderFilter = (filter: FilterOption) => {
    switch (filter.type) {
      case 'search':
        return (
          <div key={filter.id} style={{ position: 'relative', flex: isMobile ? '1 1 100%' : '1 1 250px' }}>
            <i
              className="ri-search-line"
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: tokens.color.textMuted,
                fontSize: 16,
              }}
            />
            <input
              type="text"
              value={filter.value}
              onChange={(e) => onFilterChange(filter.id, e.target.value)}
              placeholder={filter.placeholder || filter.label}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                backgroundColor: tokens.color.surface,
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.md,
                color: tokens.color.text,
                fontSize: tokens.font.size.sm,
                minHeight: '44px',
              }}
            />
            {filter.value && (
              <button
                onClick={() => onFilterChange(filter.id, '')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: tokens.color.textMuted,
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <i className="ri-close-line" />
              </button>
            )}
          </div>
        );

      case 'select':
        return (
          <select
            key={filter.id}
            value={filter.value}
            onChange={(e) => onFilterChange(filter.id, e.target.value)}
            style={{
              flex: isMobile ? '1 1 100%' : '0 0 auto',
              padding: '10px 32px 10px 12px',
              backgroundColor: tokens.color.surface,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.md,
              color: tokens.color.text,
              fontSize: tokens.font.size.sm,
              minHeight: '44px',
              minWidth: isMobile ? '100%' : 150,
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
            }}
          >
            <option value="">{filter.placeholder || `Tất cả ${filter.label.toLowerCase()}`}</option>
            {filter.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            key={filter.id}
            type="date"
            value={filter.value}
            onChange={(e) => onFilterChange(filter.id, e.target.value)}
            style={{
              flex: isMobile ? '1 1 100%' : '0 0 auto',
              padding: '10px 12px',
              backgroundColor: tokens.color.surface,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.md,
              color: tokens.color.text,
              fontSize: tokens.font.size.sm,
              minHeight: '44px',
              minWidth: isMobile ? '100%' : 150,
            }}
          />
        );

      case 'custom':
        return filter.render ? (
          <div key={filter.id} style={{ flex: isMobile ? '1 1 100%' : '0 0 auto' }}>
            {filter.render(filter.value, (value) => onFilterChange(filter.id, value))}
          </div>
        ) : null;

      default:
        return null;
    }
  };

  // Mobile collapsible view - Property 5
  if (isMobile && collapsibleMobile) {
    return (
      <div className={className} data-testid={testId}>
        {/* Toggle button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: `${tokens.space.sm} ${tokens.space.md}`,
            backgroundColor: tokens.color.surface,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.md,
            color: tokens.color.text,
            fontSize: tokens.font.size.sm,
            cursor: 'pointer',
            minHeight: '44px',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: tokens.space.sm }}>
            <i className="ri-filter-3-line" style={{ fontSize: 18 }} />
            Bộ lọc
            {showActiveCount && activeCount > 0 && (
              <span
                style={{
                  padding: '2px 8px',
                  backgroundColor: tokens.color.primary,
                  color: '#111',
                  borderRadius: tokens.radius.pill,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {activeCount}
              </span>
            )}
          </span>
          <i
            className={isExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}
            style={{ fontSize: 20, color: tokens.color.textMuted }}
          />
        </button>

        {/* Expandable filter panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                overflow: 'hidden',
                marginTop: tokens.space.sm,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: tokens.space.sm,
                  padding: tokens.space.md,
                  backgroundColor: tokens.color.surface,
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: tokens.radius.md,
                }}
              >
                {filters.map(renderFilter)}

                {/* Clear all button - Property 4.4 */}
                {onClearAll && activeCount > 0 && (
                  <button
                    onClick={onClearAll}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: tokens.space.xs,
                      padding: tokens.space.sm,
                      backgroundColor: 'transparent',
                      border: `1px solid ${tokens.color.border}`,
                      borderRadius: tokens.radius.md,
                      color: tokens.color.textMuted,
                      fontSize: tokens.font.size.sm,
                      cursor: 'pointer',
                      minHeight: '44px',
                    }}
                  >
                    <i className="ri-close-line" />
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop inline view
  return (
    <div
      className={className}
      data-testid={testId}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: tokens.space.md,
        alignItems: 'center',
      }}
    >
      {filters.map(renderFilter)}

      {/* Clear all button */}
      {onClearAll && activeCount > 0 && (
        <button
          onClick={onClearAll}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: tokens.space.xs,
            padding: `${tokens.space.sm} ${tokens.space.md}`,
            backgroundColor: 'transparent',
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.md,
            color: tokens.color.textMuted,
            fontSize: tokens.font.size.sm,
            cursor: 'pointer',
            minHeight: '44px',
          }}
        >
          <i className="ri-close-line" />
          Xóa bộ lọc ({activeCount})
        </button>
      )}
    </div>
  );
}

export default ResponsiveFilters;
