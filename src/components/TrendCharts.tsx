'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface TrendChartProps {
  data: { time: string; value: number }[];
  title?: string;
  height?: number;
}

export function TrendChart({ data, title, height = 200 }: TrendChartProps) {
  const formattedData = data.map((d, i) => ({
    ...d,
    time: new Date(parseInt(d.time) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    index: i,
  }));

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      {title && <h3 className="text-sm font-medium text-gray-300 mb-4">{title}</h3>}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="time"
              stroke="#9ca3af"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#9ca3af"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
              labelStyle={{ color: '#9ca3af' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              fillOpacity={1}
              fill="url(#colorValue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface ComparisonChartProps {
  data: { name: string; value: number; color?: string }[];
  title?: string;
  height?: number;
}

export function ComparisonChart({ data, title, height = 200 }: ComparisonChartProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      {title && <h3 className="text-sm font-medium text-gray-300 mb-4">{title}</h3>}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
            <YAxis stroke="#9ca3af" fontSize={10} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ fill: '#6366f1', strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface VelocityChartProps {
  twitterVelocity: number;
  redditVelocity: number;
  newsVelocity: number;
  title?: string;
}

export function VelocityChart({ twitterVelocity, redditVelocity, newsVelocity, title }: VelocityChartProps) {
  const data = [
    { name: 'Twitter', value: Math.min(100, twitterVelocity / 10), color: '#1da1f2' },
    { name: 'Reddit', value: Math.min(100, redditVelocity * 2), color: '#ff4500' },
    { name: 'News', value: Math.min(100, newsVelocity * 10), color: '#6366f1' },
  ];

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      {title && <h3 className="text-sm font-medium text-gray-300 mb-4">{title}</h3>}
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.name} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">{item.name}</span>
              <span className="font-mono text-gray-400">{Math.round(item.value)}</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${item.value}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
