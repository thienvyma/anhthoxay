import type { PreviewProps } from './types';

export function MarketplacePreview({ data }: PreviewProps) {
  return (
    <div style={{ background: 'transparent', borderRadius: 8, padding: 24 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#F4F4F5', marginBottom: 8 }}>{data.title || 'Công trình đang tìm nhà thầu'}</h2>
        <p style={{ fontSize: 14, color: '#A1A1AA' }}>{data.subtitle || 'Khám phá các dự án xây dựng đang chờ báo giá'}</p>
      </div>
      
      {/* Stats */}
      {data.showStats !== false && <StatsSection />}
      
      {/* Project Cards */}
      <ProjectCards />
      
      {/* CTA Buttons */}
      <CTAButtons data={data} />
    </div>
  );
}

function StatsSection() {
  const stats = [
    { value: '25', label: 'Công trình đang mở' },
    { value: '200+', label: 'Nhà thầu xác minh' },
    { value: '98%', label: 'Khách hàng hài lòng' },
  ];
  
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20, padding: '16px 24px', background: '#131316', borderRadius: 12, border: '1px solid #27272A' }}>
      {stats.map((stat, i) => (
        <div key={i} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#f5d393' }}>{stat.value}</div>
          <div style={{ fontSize: 11, color: '#A1A1AA' }}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

function ProjectCards() {
  const projects = [
    { title: 'Sơn lại căn hộ 3PN', region: 'Quận 7', budget: '50-80 triệu', bids: 5 },
    { title: 'Cải tạo nhà phố', region: 'Bình Thạnh', budget: '100-150 triệu', bids: 8 },
    { title: 'Ốp lát sàn nhà', region: 'Quận 1', budget: '30-50 triệu', bids: 3 },
  ];
  
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      {projects.map((project, idx) => (
        <div key={idx} style={{ background: '#131316', borderRadius: 12, border: '1px solid #27272A', padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 500 }}>Đang mở</span>
            <span style={{ fontSize: 10, color: '#71717a' }}>PRJ-2024-{idx + 1}</span>
          </div>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: '#F4F4F5', margin: '0 0 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.title}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 9, color: '#71717a' }}>Khu vực</div>
              <div style={{ fontSize: 11, color: '#F4F4F5' }}>{project.region}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: '#71717a' }}>Ngân sách</div>
              <div style={{ fontSize: 11, color: '#f5d393' }}>{project.budget}</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid #27272A' }}>
            <span style={{ fontSize: 10, color: '#71717a' }}>
              <i className="ri-file-list-3-line" style={{ marginRight: 4 }} />{project.bids}/20 đề xuất
            </span>
            <span style={{ fontSize: 10, color: '#f59e0b' }}>
              <i className="ri-time-line" style={{ marginRight: 4 }} />Còn 5 ngày
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CTAButtons({ data }: PreviewProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
      <button style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #f5d393, #efb679)', border: 'none', borderRadius: 20, color: '#111', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
        <i className="ri-arrow-right-line" />{data.ctaText || 'Xem tất cả công trình'}
      </button>
      <button style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #27272A', borderRadius: 20, color: '#F4F4F5', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
        <i className="ri-user-add-line" />{data.registerText || 'Đăng ký làm nhà thầu'}
      </button>
    </div>
  );
}
