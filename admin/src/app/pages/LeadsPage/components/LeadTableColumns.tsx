import { tokens } from '../../../../theme';
import { TableColumn } from '../../../../components/responsive/ResponsiveTable';
import { statusColors, statusLabels, sourceLabels, sourceColors } from '../types';
import type { CustomerLead } from '../types';

/**
 * getLeadTableColumns - Returns table column definitions for leads
 * @param leadsWithFurnitureQuotes - Set of lead IDs that have furniture quotation history
 */
export function getLeadTableColumns(leadsWithFurnitureQuotes?: Set<string>): TableColumn<CustomerLead>[] {
  return [
    {
      key: 'name',
      header: 'Khách hàng',
      priority: 1,
      render: (_, row) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: tokens.color.text, fontWeight: 500 }}>{row.name}</span>
            {/* Duplicate indicators */}
            {row.isPotentialDuplicate && (
              <span 
                title="Có thể trùng lặp"
                style={{ 
                  color: tokens.color.warning,
                  fontSize: 14,
                }}
              >
                <i className="ri-error-warning-fill" />
              </span>
            )}
            {row.hasRelatedLeads && (
              <span 
                title={`Có ${row.relatedLeadCount} leads liên quan`}
                style={{ 
                  color: tokens.color.info,
                  fontSize: 14,
                }}
              >
                <i className="ri-links-fill" />
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            {row.submissionCount > 1 && (
              <span style={{ 
                fontSize: 10, 
                color: tokens.color.warning,
                background: `${tokens.color.warning}20`,
                padding: '2px 6px',
                borderRadius: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}>
                <i className="ri-repeat-line" /> {row.submissionCount}x submit
              </span>
            )}
            {row.quoteData && row.source !== 'FURNITURE_QUOTE' && (
              <span style={{ 
                fontSize: 10, 
                color: tokens.color.primary,
                background: 'rgba(245, 211, 147, 0.15)',
                padding: '2px 6px',
                borderRadius: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}>
                <i className="ri-calculator-line" /> Có báo giá
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Liên hệ',
      priority: 2,
      render: (_, row) => (
        <div>
          <div style={{ color: tokens.color.text }}>{row.phone}</div>
          {row.email && <div style={{ color: tokens.color.muted, fontSize: 13 }}>{row.email}</div>}
          {row.normalizedPhone && row.normalizedPhone !== row.phone && (
            <div style={{ color: tokens.color.muted, fontSize: 11 }}>
              → {row.normalizedPhone}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'content',
      header: 'Nội dung',
      hideOnMobile: true,
      render: (value) => (
        <div style={{ 
          color: tokens.color.muted, 
          fontSize: 13, 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          maxWidth: 200,
        }}>
          {String(value)}
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Nguồn',
      hideOnMobile: true,
      render: (value) => {
        const source = String(value);
        const colors = sourceColors[source];
        return (
          <span style={{
            padding: '4px 8px',
            borderRadius: 6,
            background: colors?.bg || tokens.color.surfaceHover,
            color: colors?.text || tokens.color.muted,
            fontSize: 12,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <i className={colors?.icon || 'ri-file-list-line'} />
            {sourceLabels[source] || source}
          </span>
        );
      },
    },
    {
      key: 'id' as keyof CustomerLead,
      header: 'Trạng thái báo giá',
      hideOnMobile: true,
      render: (_, row) => {
        // Only show for furniture leads
        if (row.source !== 'FURNITURE_QUOTE') {
          return (
            <span style={{ color: tokens.color.muted, fontSize: 12 }}>—</span>
          );
        }
        
        const hasQuotation = leadsWithFurnitureQuotes?.has(row.id) ?? false;
        
        return (
          <span style={{
            padding: '4px 10px',
            borderRadius: 6,
            background: hasQuotation ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            color: hasQuotation ? tokens.color.success : tokens.color.warning,
            fontSize: 12,
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <i className={hasQuotation ? 'ri-checkbox-circle-fill' : 'ri-time-line'} />
            {hasQuotation ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Trạng thái',
      priority: 3,
      render: (value) => {
        const status = String(value);
        const colors = statusColors[status];
        return (
          <span style={{
            padding: '4px 12px',
            borderRadius: 20,
            background: colors?.bg || tokens.color.surfaceHover,
            color: colors?.text || tokens.color.text,
            fontSize: 13,
            fontWeight: 500,
          }}>
            {statusLabels[status] || status}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      hideOnMobile: true,
      render: (value) => (
        <span style={{ color: tokens.color.muted, fontSize: 13 }}>
          {new Date(String(value)).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
  ];
}
