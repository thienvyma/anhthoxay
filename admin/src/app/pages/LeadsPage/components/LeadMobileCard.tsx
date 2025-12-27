import { tokens } from '@app/shared';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { statusColors, statusLabels } from '../types';
import type { CustomerLead } from '../types';

interface LeadMobileCardProps {
  lead: CustomerLead;
  onSelect: (lead: CustomerLead) => void;
}

/**
 * LeadMobileCard - Mobile-optimized card view for a lead
 */
export function LeadMobileCard({ lead, onSelect }: LeadMobileCardProps) {
  const colors = statusColors[lead.status];
  
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ color: tokens.color.text, fontWeight: 600, fontSize: 16 }}>{lead.name}</div>
          <div style={{ color: tokens.color.muted, fontSize: 13, marginTop: 4 }}>{lead.phone}</div>
          {lead.email && <div style={{ color: tokens.color.muted, fontSize: 12 }}>{lead.email}</div>}
        </div>
        <span style={{
          padding: '4px 10px',
          borderRadius: 20,
          background: colors?.bg || 'rgba(255,255,255,0.1)',
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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            padding: '2px 6px',
            borderRadius: 4,
            background: 'rgba(255,255,255,0.05)',
            color: tokens.color.muted,
            fontSize: 11,
          }}>
            {lead.source}
          </span>
          {lead.quoteData && (
            <span style={{ fontSize: 11, color: tokens.color.primary }}>
              <i className="ri-calculator-line" /> Báo giá
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
