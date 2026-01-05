import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { tokens } from '../../../theme';

interface LeadsBarChartProps {
  data: Record<string, number>;
}

const SOURCE_LABELS: Record<string, string> = {
  QUOTE_FORM: 'Form báo giá',
  CONTACT_FORM: 'Form liên hệ',
  NEWSLETTER: 'Newsletter',
  OTHER: 'Khác',
};

export function LeadsBarChart({ data }: LeadsBarChartProps) {
  const chartData = Object.entries(data).map(([source, count]) => ({
    name: SOURCE_LABELS[source] || source,
    count,
  }));

  if (chartData.length === 0) {
    return (
      <div style={{ 
        height: 250, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: tokens.color.muted,
      }}>
        Chưa có dữ liệu
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={tokens.color.surfaceHover} horizontal={false} />
        <XAxis 
          type="number" 
          stroke={tokens.color.muted}
          fontSize={12}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis 
          type="category" 
          dataKey="name" 
          stroke={tokens.color.muted}
          fontSize={12}
          tickLine={false}
          width={75}
        />
        <Tooltip
          contentStyle={{
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: 8,
            color: tokens.color.text,
          }}
          formatter={(value) => [value ?? 0, 'Leads']}
        />
        <Bar 
          dataKey="count" 
          fill={tokens.color.primary}
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
