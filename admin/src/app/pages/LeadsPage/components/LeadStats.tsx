import { tokens } from '@app/shared';
import { Card } from '../../../components/Card';
import { ResponsiveGrid } from '../../../../components/responsive/ResponsiveGrid';
import { statusColors, statusLabels } from '../types';

export interface LeadStatsProps {
  stats: Record<string, number>;
  isMobile: boolean;
}

export function LeadStats({ stats, isMobile }: LeadStatsProps) {
  return (
    <ResponsiveGrid 
      cols={{ mobile: 2, tablet: 4, desktop: 4 }} 
      gap={{ mobile: 12, tablet: 16, desktop: 16 }} 
      style={{ marginBottom: 24 }}
    >
      {Object.entries(statusLabels).map(([status, label]) => {
        const count = stats[status] || 0;
        const colors = statusColors[status];
        return (
          <Card key={status} style={{ padding: isMobile ? 12 : 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
              <div style={{ 
                width: isMobile ? 40 : 48, 
                height: isMobile ? 40 : 48, 
                borderRadius: 12, 
                background: colors.bg, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <span style={{ fontSize: isMobile ? 18 : 24, fontWeight: 700, color: colors.text }}>{count}</span>
              </div>
              <div>
                <div style={{ color: tokens.color.muted, fontSize: isMobile ? 11 : 13 }}>{label}</div>
                <div style={{ color: tokens.color.text, fontSize: isMobile ? 14 : 18, fontWeight: 600 }}>{count} leads</div>
              </div>
            </div>
          </Card>
        );
      })}
    </ResponsiveGrid>
  );
}
