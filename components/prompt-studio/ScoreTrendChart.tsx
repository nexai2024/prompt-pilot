'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface ScoreTrendPoint {
  id: string;
  date: string;
  overall: number;
  clarity?: number;
  specificity?: number;
  structure?: number;
  variables?: number;
  robustness?: number;
}

interface ScoreTrendChartProps {
  data: ScoreTrendPoint[];
  height?: number;
}

export function ScoreTrendChart({ data, height = 220 }: ScoreTrendChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-gray-500 border rounded-lg bg-gray-50"
        style={{ height }}
      >
        Score history will appear after you run scoring on a saved prompt.
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              fontSize: 12,
            }}
            formatter={(value: number) => [`${value}`, 'Overall']}
          />
          <Line
            type="monotone"
            dataKey="overall"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#6366f1' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
