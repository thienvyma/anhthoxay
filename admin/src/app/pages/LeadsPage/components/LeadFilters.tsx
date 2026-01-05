import { tokens } from '../../../../theme';
import { Button } from '../../../components/Button';
import { ResponsiveStack } from '../../../../components/responsive/ResponsiveStack';
import { statusLabels } from '../types';

export interface SourceStats {
  FURNITURE_QUOTE: number;
  QUOTE_FORM: number;
  CONTACT_FORM: number;
  withFurnitureQuotation: number;
  withoutFurnitureQuotation: number;
}

export interface LeadFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterStatus: string;
  onStatusChange: (status: string) => void;
  filterSource: string;
  onSourceChange: (source: string) => void;
  sourceStats: SourceStats;
  totalLeads: number;
  isMobile: boolean;
}

export function LeadFilters({
  searchQuery,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterSource,
  onSourceChange,
  sourceStats,
  totalLeads,
  isMobile,
}: LeadFiltersProps) {
  return (
    <>
      {/* Search & Status Filters */}
      <ResponsiveStack
        direction={{ mobile: 'column', tablet: 'row', desktop: 'row' }}
        gap={16}
        style={{ marginBottom: 16 }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: isMobile ? '100%' : 250 }}>
          <i className="ri-search-line" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: tokens.color.muted }} />
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT, email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              background: tokens.color.surfaceHover,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: 8,
              color: tokens.color.text,
              fontSize: 14,
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: tokens.color.muted, cursor: 'pointer' }}
            >
              <i className="ri-close-line" />
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', overflowX: isMobile ? 'auto' : undefined, paddingBottom: isMobile ? 4 : 0 }}>
          {['', 'NEW', 'CONTACTED', 'CONVERTED', 'CANCELLED'].map(status => (
            <Button
              key={status || 'ALL'}
              variant={filterStatus === status ? 'primary' : 'outline'}
              size="small"
              onClick={() => onStatusChange(status)}
            >
              {status === '' ? 'Tất cả' : (isMobile ? statusLabels[status].slice(0, 3) : statusLabels[status])}
            </Button>
          ))}
        </div>
      </ResponsiveStack>

      {/* Source Filter */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        flexWrap: 'wrap', 
        marginBottom: 24,
        padding: 12,
        background: tokens.color.surfaceAlt,
        borderRadius: 8,
        border: `1px solid ${tokens.color.border}`,
      }}>
        <span style={{ color: tokens.color.muted, fontSize: 13, display: 'flex', alignItems: 'center', marginRight: 8 }}>
          <i className="ri-filter-3-line" style={{ marginRight: 4 }} /> Nguồn:
        </span>
        <Button
          variant={filterSource === '' ? 'primary' : 'outline'}
          size="small"
          onClick={() => onSourceChange('')}
        >
          Tất cả ({totalLeads})
        </Button>
        <Button
          variant={filterSource === 'FURNITURE_QUOTE' ? 'primary' : 'outline'}
          size="small"
          onClick={() => onSourceChange('FURNITURE_QUOTE')}
          style={filterSource === 'FURNITURE_QUOTE' ? { background: tokens.color.accent } : { borderColor: tokens.color.accent, color: tokens.color.accent }}
        >
          <i className="ri-sofa-line" /> Nội thất ({sourceStats.FURNITURE_QUOTE})
        </Button>
        <Button
          variant={filterSource === 'QUOTE_FORM' ? 'primary' : 'outline'}
          size="small"
          onClick={() => onSourceChange('QUOTE_FORM')}
        >
          <i className="ri-calculator-line" /> Báo giá ({sourceStats.QUOTE_FORM})
        </Button>
        <Button
          variant={filterSource === 'CONTACT_FORM' ? 'primary' : 'outline'}
          size="small"
          onClick={() => onSourceChange('CONTACT_FORM')}
        >
          <i className="ri-mail-line" /> Liên hệ ({sourceStats.CONTACT_FORM})
        </Button>
        
        {/* Furniture quotation status indicator */}
        {filterSource === 'FURNITURE_QUOTE' && (
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            marginLeft: 'auto',
            alignItems: 'center',
          }}>
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4, 
              fontSize: 12,
              color: tokens.color.success,
            }}>
              <i className="ri-checkbox-circle-fill" /> Đã báo giá: {sourceStats.withFurnitureQuotation}
            </span>
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4, 
              fontSize: 12,
              color: tokens.color.warning,
            }}>
              <i className="ri-time-line" /> Chưa báo giá: {sourceStats.withoutFurnitureQuotation}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
