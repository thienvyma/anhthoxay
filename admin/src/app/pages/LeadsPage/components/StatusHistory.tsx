import { tokens } from '@app/shared';
import { statusColors, statusLabels } from '../types';
import type { StatusHistoryProps, StatusHistoryEntry } from '../types';

/**
 * StatusHistory - Timeline display of status changes
 */
export function StatusHistory({ history }: StatusHistoryProps) {
  if (!history) return null;
  
  try {
    const entries: StatusHistoryEntry[] = JSON.parse(history);
    if (entries.length === 0) return null;
    
    return (
      <div style={{ marginTop: 16 }}>
        <label style={{ color: tokens.color.muted, fontSize: 13, marginBottom: 8, display: 'block' }}>
          Lịch sử trạng thái
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map((entry, idx) => (
            <div 
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 6,
                fontSize: 13,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ color: statusColors[entry.from]?.text || tokens.color.muted }}>
                {statusLabels[entry.from] || entry.from}
              </span>
              <i className="ri-arrow-right-line" style={{ color: tokens.color.muted }} />
              <span style={{ color: statusColors[entry.to]?.text || tokens.color.text }}>
                {statusLabels[entry.to] || entry.to}
              </span>
              <span style={{ color: tokens.color.muted, marginLeft: 'auto', fontSize: 12 }}>
                {new Date(entry.changedAt).toLocaleString('vi-VN')}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  } catch {
    return null;
  }
}
