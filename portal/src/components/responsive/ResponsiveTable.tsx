/**
 * ResponsiveTable Component for Portal
 * Table that converts to card layout on mobile
 *
 * Requirements: 1.1, 1.2, 2.1 - Display as cards on mobile
 */

import React, { useMemo } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { tokens } from '@app/shared';

export interface TableColumn<T> {
  /** Column key (must match data property) */
  key: keyof T;

  /** Column header text */
  header: string;

  /** Custom render function */
  render?: (value: T[keyof T], row: T) => React.ReactNode;

  /** Hide on mobile */
  hideOnMobile?: boolean;

  /** Priority for mobile card view (lower = more important) */
  priority?: number;

  /** Column width */
  width?: string;

  /** Text alignment */
  align?: 'left' | 'center' | 'right';
}

export interface ResponsiveTableProps<T> {
  /** Table data */
  data: T[];

  /** Column definitions */
  columns: TableColumn<T>[];

  /** Actions column renderer */
  actions?: (row: T) => React.ReactNode;

  /** Custom mobile card renderer */
  renderMobileCard?: (row: T, index: number) => React.ReactNode;

  /** Loading state */
  loading?: boolean;

  /** Empty state message */
  emptyMessage?: string;

  /** Row key extractor */
  getRowKey?: (row: T, index: number) => string | number;

  /** On row click handler */
  onRowClick?: (row: T) => void;

  /** Additional CSS class */
  className?: string;

  /** Test ID for testing */
  testId?: string;
}

/**
 * Loading skeleton component
 */
function TableSkeleton({ columns }: { columns: number }) {
  return (
    <>
      {[1, 2, 3].map((row) => (
        <tr key={row}>
          {Array.from({ length: columns }).map((_, col) => (
            <td
              key={col}
              style={{
                padding: tokens.space.md,
                borderBottom: `1px solid ${tokens.color.border}`,
              }}
            >
              <div
                style={{
                  height: '20px',
                  backgroundColor: tokens.color.surfaceHover,
                  borderRadius: tokens.radius.sm,
                  animation: 'pulse 1.5s infinite',
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/**
 * Mobile card skeleton
 */
function CardSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            padding: tokens.space.md,
            backgroundColor: tokens.color.surface,
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.border}`,
          }}
        >
          <div
            style={{
              height: '20px',
              width: '60%',
              backgroundColor: tokens.color.surfaceHover,
              borderRadius: tokens.radius.sm,
              marginBottom: tokens.space.sm,
            }}
          />
          <div
            style={{
              height: '16px',
              width: '40%',
              backgroundColor: tokens.color.surfaceHover,
              borderRadius: tokens.radius.sm,
            }}
          />
        </div>
      ))}
    </>
  );
}

/**
 * ResponsiveTable - A table component that adapts to screen size
 * Property 1: Table renders cards on mobile
 *
 * @example
 * // Basic usage
 * <ResponsiveTable
 *   data={projects}
 *   columns={[
 *     { key: 'title', header: 'Tên công trình' },
 *     { key: 'status', header: 'Trạng thái', hideOnMobile: true },
 *     { key: 'budget', header: 'Ngân sách' },
 *   ]}
 *   actions={(row) => <Button onClick={() => view(row)}>Xem</Button>}
 * />
 *
 * @example
 * // Custom mobile card
 * <ResponsiveTable
 *   data={bids}
 *   columns={columns}
 *   renderMobileCard={(bid) => (
 *     <BidCard bid={bid} />
 *   )}
 * />
 */
export function ResponsiveTable<T>({
  data,
  columns,
  actions,
  renderMobileCard,
  loading = false,
  emptyMessage = 'Không có dữ liệu',
  getRowKey = (_, index) => index,
  onRowClick,
  className = '',
  testId,
}: ResponsiveTableProps<T>) {
  const { isMobile, deviceType } = useResponsive();

  // Filter columns for mobile
  const visibleColumns = useMemo(() => {
    if (!isMobile) return columns;
    return columns.filter((col) => !col.hideOnMobile);
  }, [columns, isMobile]);

  // Sort columns by priority for mobile card
  const sortedColumns = useMemo(() => {
    return [...columns]
      .filter((col) => !col.hideOnMobile)
      .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
  }, [columns]);

  // Render cell value
  const renderCell = (column: TableColumn<T>, row: T) => {
    const value = row[column.key];
    if (column.render) {
      return column.render(value, row);
    }
    return String(value ?? '');
  };

  // Render mobile card view
  if (isMobile) {
    return (
      <div
        className={className}
        data-testid={testId}
        data-breakpoint={deviceType}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: tokens.space.sm,
        }}
      >
        {loading ? (
          <CardSkeleton />
        ) : data.length === 0 ? (
          <div
            style={{
              padding: tokens.space.xl,
              textAlign: 'center',
              color: tokens.color.textMuted,
              backgroundColor: tokens.color.surface,
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.border}`,
            }}
          >
            {emptyMessage}
          </div>
        ) : (
          data.map((row, index) => {
            // Use custom card renderer if provided
            if (renderMobileCard) {
              return (
                <div key={getRowKey(row, index)}>
                  {renderMobileCard(row, index)}
                </div>
              );
            }

            // Default card layout
            return (
              <div
                key={getRowKey(row, index)}
                onClick={() => onRowClick?.(row)}
                style={{
                  padding: tokens.space.md,
                  backgroundColor: tokens.color.surface,
                  borderRadius: tokens.radius.md,
                  border: `1px solid ${tokens.color.border}`,
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (onRowClick) {
                    e.currentTarget.style.backgroundColor =
                      tokens.color.surfaceHover;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = tokens.color.surface;
                }}
              >
                {/* Card content */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: tokens.space.xs,
                  }}
                >
                  {sortedColumns.slice(0, 4).map((column, colIndex) => (
                    <div
                      key={String(column.key)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: tokens.space.sm,
                      }}
                    >
                      {colIndex > 0 && (
                        <span
                          style={{
                            fontSize: tokens.font.size.xs,
                            color: tokens.color.textMuted,
                            flexShrink: 0,
                          }}
                        >
                          {column.header}:
                        </span>
                      )}
                      <span
                        style={{
                          fontSize:
                            colIndex === 0
                              ? tokens.font.size.sm
                              : tokens.font.size.xs,
                          fontWeight:
                            colIndex === 0
                              ? tokens.font.weight.medium
                              : tokens.font.weight.normal,
                          color:
                            colIndex === 0
                              ? tokens.color.text
                              : tokens.color.textMuted,
                          textAlign: colIndex === 0 ? 'left' : 'right',
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {renderCell(column, row)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {actions && (
                  <div
                    style={{
                      marginTop: tokens.space.sm,
                      paddingTop: tokens.space.sm,
                      borderTop: `1px solid ${tokens.color.border}`,
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: tokens.space.xs,
                    }}
                  >
                    {actions(row)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  }

  // Render desktop table view
  return (
    <div
      className={className}
      data-testid={testId}
      data-breakpoint={deviceType}
      style={{
        overflowX: 'auto',
        borderRadius: tokens.radius.md,
        border: `1px solid ${tokens.color.border}`,
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: tokens.color.surface,
        }}
      >
        <thead>
          <tr>
            {visibleColumns.map((column) => (
              <th
                key={String(column.key)}
                style={{
                  padding: tokens.space.md,
                  textAlign: column.align || 'left',
                  fontSize: tokens.font.size.xs,
                  fontWeight: tokens.font.weight.medium,
                  color: tokens.color.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: `1px solid ${tokens.color.border}`,
                  backgroundColor: tokens.color.background,
                  width: column.width,
                  whiteSpace: 'nowrap',
                }}
              >
                {column.header}
              </th>
            ))}
            {actions && (
              <th
                style={{
                  padding: tokens.space.md,
                  textAlign: 'right',
                  fontSize: tokens.font.size.xs,
                  fontWeight: tokens.font.weight.medium,
                  color: tokens.color.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: `1px solid ${tokens.color.border}`,
                  backgroundColor: tokens.color.background,
                  width: '1%',
                  whiteSpace: 'nowrap',
                }}
              >
                Thao tác
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeleton columns={visibleColumns.length + (actions ? 1 : 0)} />
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={visibleColumns.length + (actions ? 1 : 0)}
                style={{
                  padding: tokens.space.xl,
                  textAlign: 'center',
                  color: tokens.color.textMuted,
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={getRowKey(row, index)}
                onClick={() => onRowClick?.(row)}
                style={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    tokens.color.surfaceHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {visibleColumns.map((column) => (
                  <td
                    key={String(column.key)}
                    style={{
                      padding: tokens.space.md,
                      textAlign: column.align || 'left',
                      fontSize: tokens.font.size.sm,
                      color: tokens.color.text,
                      borderBottom: `1px solid ${tokens.color.border}`,
                    }}
                  >
                    {renderCell(column, row)}
                  </td>
                ))}
                {actions && (
                  <td
                    style={{
                      padding: tokens.space.md,
                      textAlign: 'right',
                      borderBottom: `1px solid ${tokens.color.border}`,
                      whiteSpace: 'nowrap',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ResponsiveTable;
