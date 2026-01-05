import { tokens } from '../../../../theme';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { statusColors, statusLabels, sourceColors, sourceLabels } from '../types';
import type { CustomerLead } from '../types';

interface LeadMobileCardProps {
  lead: CustomerLead;
  onSelect: (lead: CustomerLead) => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  hasFurnitureQuotation?: boolean;
}

/**
 * LeadMobileCard - Mobile-optimized card view for a lead
 */
export function LeadMobileCard({ lead, onSelect, isSelected, onToggleSelect, hasFurnitureQuotation }: LeadMobileCardProps) {
  const colors = statusColors[lead.status];
  const srcColors = sourceColors[lead.source];
  
  return (
    <Card style={{ 
      padding: 16,
      background: isSelected ? tokens.color.errorBg : undefined,
      border: isSelected ? `1px solid ${tokens.color.error}` : undefined,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              onClick={(e) => e.stopPropagation()}
              style={{ cursor: 'pointer', width: 18, height: 18, marginTop: 2 }}
            />
          )}
          <div>
            <div style={{ color: tokens.color.text, fontWeight: 600, fontSize: 16 }}>{lead.name}</div>
            <div style={{ color: tokens.color.muted, fontSize: 13, marginTop: 4 }}>{lead.phone}</div>
            {lead.email && <div style={{ color: tokens.color.muted, fontSize: 12 }}>{lead.email}</div>}
          </div>
        </div>
        <span style={{
          padding: '4px 10px',
          borderRadius: 20,
          background: colors?.bg || tokens.color.surfaceHover,
          color: colors?.text || tokens.color.text,
          fontSize: 12,
          fontWeight: 500,
        }}>
          {statusLabels[lead.status] || lead.status}
        </span>
      </div>
      
      {lead.content && (
        <div style={{ 
          color: tokens.color.muted, 
          fontSize: 13, 
          marginBottom: 12,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {lead.content}
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{
            padding: '2px 6px',
            borderRadius: 4,
            background: srcColors?.bg || tokens.color.surfaceHover,
            color: srcColors?.text || tokens.color.muted,
            fontSize: 11,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
          }}>
            <i className={srcColors?.icon || 'ri-file-list-line'} />
            {sourceLabels[lead.source] || lead.source}
          </span>
          {lead.source === 'FURNITURE_QUOTE' && (
            <span style={{ 
              fontSize: 10, 
              color: hasFurnitureQuotation ? tokens.color.success : tokens.color.warning,
              background: hasFurnitureQuotation ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              padding: '2px 6px',
              borderRadius: 4,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
            }}>
              <i className={hasFurnitureQuotation ? 'ri-checkbox-circle-fill' : 'ri-time-line'} />
              {hasFurnitureQuotation ? 'Đã báo giá' : 'Chưa báo giá'}
            </span>
          )}
          {lead.quoteData && lead.source !== 'FURNITURE_QUOTE' && (
            <span style={{ 
              fontSize: 10, 
              color: tokens.color.primary,
              background: 'rgba(245, 211, 147, 0.15)',
              padding: '2px 6px',
              borderRadius: 4,
            }}>
              <i className="ri-calculator-line" /> Có báo giá
            </span>
          )}
        </div>
        <Button variant="outline" size="small" onClick={() => onSelect(lead)}>
          <i className="ri-eye-line" />
        </Button>
      </div>
    </Card>
  );
}
