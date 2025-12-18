import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { tokens } from '@app/shared';

interface DailyLead {
  date: string;
  count: number;
}

interface LeadsLineChartProps {
  data: DailyLead[];
}

export function LeadsLineChart({ data }: LeadsLineChartProps) {
  // Format date for display
  const formattedData = data.map(item => ({
    ...item,
    displayDate: new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formattedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis 
          dataKey="displayDate" 
          stroke={tokens.color.muted}
          fontSize={12}
          tickLine={false}
        />
        <YAxis 
          stroke={tokens.color.muted}
          fontSize={12}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: 8,
            color: tokens.color.text,
          }}
          labelStyle={{ color: tokens.color.muted }}
          formatter={(value) => [value ?? 0, 'Leads']}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke={tokens.color.primary}
          strokeWidth={2}
          dot={{ fill: tokens.color.primary, strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6, fill: tokens.color.accent }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
