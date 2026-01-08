/**
 * Print Support Components
 *
 * Provides print functionality for project and bid details.
 * - PrintButton: Triggers browser print dialog
 * - PrintHeader: Header shown only in print view
 * - PrintFooter: Footer shown only in print view
 * - PrintSection: Section wrapper with page break control
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 27.1, 27.2, 27.3, 27.4**
 */

import { useCallback } from 'react';

/**
 * Print Button Component
 * Triggers the browser's print dialog
 * Requirements: 27.1, 27.2
 */
interface PrintButtonProps {
  /** Optional custom label */
  label?: string;
  /** Optional custom class name */
  className?: string;
  /** Optional custom styles */
  style?: React.CSSProperties;
  /** Document title for print (sets document.title temporarily) */
  documentTitle?: string;
  /** Callback before print */
  onBeforePrint?: () => void;
  /** Callback after print */
  onAfterPrint?: () => void;
}

export type { PrintButtonProps };

export function PrintButton({
  label = 'In',
  className = '',
  style,
  documentTitle,
  onBeforePrint,
  onAfterPrint,
}: PrintButtonProps) {
  const handlePrint = useCallback(() => {
    // Store original title
    const originalTitle = document.title;
    
    // Set custom title if provided
    if (documentTitle) {
      document.title = documentTitle;
    }
    
    // Call before print callback
    onBeforePrint?.();
    
    // Trigger print
    window.print();
    
    // Restore original title
    if (documentTitle) {
      document.title = originalTitle;
    }
    
    // Call after print callback
    onAfterPrint?.();
  }, [documentTitle, onBeforePrint, onAfterPrint]);

  return (
    <button
      type="button"
      className={`print-btn no-print ${className}`}
      style={style}
      onClick={handlePrint}
      aria-label={label}
    >
      <i className="ri-printer-line" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

/**
 * Print Header Component
 * Displays a header only visible in print view
 * Requirements: 27.3, 27.4
 */
interface PrintHeaderProps {
  /** Main title */
  title: string;
  /** Subtitle (e.g., document type) */
  subtitle?: string;
  /** Document code/reference */
  code?: string;
  /** Show current date */
  showDate?: boolean;
  /** Custom date string */
  dateString?: string;
}

export function PrintHeader({
  title,
  subtitle,
  code,
  showDate = true,
  dateString,
}: PrintHeaderProps) {
  const currentDate = dateString || new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="print-header print-only">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="print-header-logo">NỘI THẤT NHANH</div>
          {subtitle && <div className="print-header-subtitle">{subtitle}</div>}
        </div>
        {code && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Mã tham chiếu</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{code}</div>
          </div>
        )}
      </div>
      <h1 style={{ fontSize: '20px', fontWeight: 700, marginTop: '16px', marginBottom: '8px' }}>
        {title}
      </h1>
      {showDate && (
        <div className="print-header-date">
          Ngày in: {currentDate}
        </div>
      )}
    </div>
  );
}

/**
 * Print Footer Component
 * Displays a footer only visible in print view
 * Requirements: 27.3, 27.4
 */
interface PrintFooterProps {
  /** Show page numbers (handled by CSS @page) */
  showPageInfo?: boolean;
  /** Custom footer text */
  text?: string;
  /** Contact information */
  contactInfo?: string;
}

export function PrintFooter({
  showPageInfo = true,
  text,
  contactInfo = 'Liên hệ: support@noithatnhanh.vn | Hotline: 1900-xxxx',
}: PrintFooterProps) {
  return (
    <div className="print-footer print-only">
      {text && <div style={{ marginBottom: '8px' }}>{text}</div>}
      <div>{contactInfo}</div>
      {showPageInfo && (
        <div style={{ marginTop: '8px', fontSize: '10px' }}>
          Tài liệu này được tạo tự động từ hệ thống NỘI THẤT NHANH
        </div>
      )}
    </div>
  );
}

/**
 * Print Section Component
 * Wrapper for content sections with page break control
 * Requirements: 27.3
 */
interface PrintSectionProps {
  /** Section title */
  title?: string;
  /** Children content */
  children: React.ReactNode;
  /** Avoid page break inside this section */
  avoidBreak?: boolean;
  /** Force page break before this section */
  breakBefore?: boolean;
  /** Force page break after this section */
  breakAfter?: boolean;
  /** Custom class name */
  className?: string;
}

export function PrintSection({
  title,
  children,
  avoidBreak = true,
  breakBefore = false,
  breakAfter = false,
  className = '',
}: PrintSectionProps) {
  const classNames = [
    'print-section',
    avoidBreak ? 'avoid-break' : '',
    breakBefore ? 'page-break-before' : '',
    breakAfter ? 'page-break-after' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames}>
      {title && <h3 className="print-section-title">{title}</h3>}
      {children}
    </div>
  );
}

/**
 * Print Info Grid Component
 * Displays key-value pairs in a grid layout for print
 * Requirements: 27.3
 */
interface PrintInfoItem {
  label: string;
  value: string | number | undefined | null;
}

interface PrintInfoGridProps {
  items: PrintInfoItem[];
  columns?: 2 | 3 | 4;
}

export function PrintInfoGrid({ items, columns = 2 }: PrintInfoGridProps) {
  return (
    <div 
      className="print-info-grid"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {items.filter(item => item.value !== undefined && item.value !== null).map((item, index) => (
        <div key={index} className="print-info-item">
          <span className="print-info-label">{item.label}</span>
          <span className="print-info-value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Print Table Component
 * Renders a table optimized for print
 * Requirements: 27.3
 */
interface PrintTableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  width?: string;
}

interface PrintTableProps<T> {
  columns: PrintTableColumn<T>[];
  data: T[];
  emptyMessage?: string;
}

export function PrintTable<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = 'Không có dữ liệu',
}: PrintTableProps<T>) {
  if (data.length === 0) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', color: '#666' }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <table className="print-table">
      <thead>
        <tr>
          {columns.map((col, index) => (
            <th key={index} style={{ width: col.width }}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((col, colIndex) => (
              <td key={colIndex}>
                {col.render 
                  ? col.render(item, rowIndex)
                  : String(item[col.key as keyof T] ?? '-')
                }
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Print Status Badge Component
 * Displays status with print-friendly styling
 */
interface PrintStatusProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
}

export function PrintStatus({ label, variant = 'default' }: PrintStatusProps) {
  const variantClasses: Record<string, string> = {
    success: 'status-matched',
    warning: 'status-pending',
    error: 'status-rejected',
    info: 'status-open',
    default: 'status-draft',
  };

  return (
    <span className={`print-status ${variantClasses[variant]}`}>
      {label}
    </span>
  );
}

/**
 * Utility function to format currency for print
 */
export function formatCurrencyForPrint(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Utility function to format date for print
 */
export function formatDateForPrint(dateString: string): string {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
