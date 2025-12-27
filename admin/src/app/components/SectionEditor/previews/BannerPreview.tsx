import type { PreviewProps } from './types';

export function BannerPreview({ data }: PreviewProps) {
  return (
    <div style={{ padding: 16, background: '#f5d393', color: '#111', textAlign: 'center', borderRadius: 8, fontWeight: 500 }}>
      {data.text || 'Nội dung thông báo'}
    </div>
  );
}
