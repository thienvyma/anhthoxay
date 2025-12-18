import { tokens } from '@app/shared';

interface ConversionRateCardProps {
  rate: number;
  totalLeads: number;
  convertedLeads: number;
}

export function ConversionRateCard({ rate, totalLeads, convertedLeads }: ConversionRateCardProps) {
  // Calculate stroke dasharray for progress ring
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (rate / 100) * circumference;

  // Color based on rate
  const getColor = () => {
    if (rate >= 30) return '#10b981'; // green
    if (rate >= 15) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      gap: 24,
      padding: 20,
    }}>
      {/* Progress Ring */}
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="10"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        {/* Center text */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: getColor() }}>
            {rate.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Stats */}
      <div>
        <div style={{ color: tokens.color.text, fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          Tỷ lệ chuyển đổi
        </div>
        <div style={{ color: tokens.color.muted, fontSize: 14 }}>
          {convertedLeads} / {totalLeads} leads
        </div>
        <div style={{ 
          marginTop: 12, 
          padding: '4px 12px', 
          background: `${getColor()}20`,
          borderRadius: 20,
          color: getColor(),
          fontSize: 13,
          fontWeight: 500,
          display: 'inline-block',
        }}>
          {rate >= 30 ? 'Tốt' : rate >= 15 ? 'Trung bình' : 'Cần cải thiện'}
        </div>
      </div>
    </div>
  );
}
