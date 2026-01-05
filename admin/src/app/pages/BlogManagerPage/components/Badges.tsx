import { tokens } from '../../../../theme';

// Status Badge
export function StatusBadge({ status }: { status: string }) {
  const colors = {
    PUBLISHED: { bg: 'rgba(52,211,153,0.15)', text: '#34D399' },
    ARCHIVED: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
    DRAFT: { bg: 'rgba(161,161,170,0.15)', text: '#A1A1AA' },
  };
  const labels = {
    PUBLISHED: 'Đã xuất bản',
    ARCHIVED: 'Lưu trữ',
    DRAFT: 'Nháp',
  };
  const c = colors[status as keyof typeof colors] || colors.DRAFT;
  const label = labels[status as keyof typeof labels] || status;
  return (
    <span style={{ 
      padding: '3px 10px', 
      borderRadius: 16, 
      background: c.bg, 
      color: c.text, 
      fontSize: 11, 
      fontWeight: 600 
    }}>
      {label}
    </span>
  );
}

// Featured Badge
export function FeaturedBadge() {
  return (
    <span style={{
      padding: '3px 10px',
      borderRadius: 16,
      background: 'rgba(245,211,147,0.15)',
      color: tokens.color.primary,
      fontSize: 11,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
    }}>
      <i className="ri-star-fill" style={{ fontSize: 10 }} />
      Nổi bật
    </span>
  );
}
