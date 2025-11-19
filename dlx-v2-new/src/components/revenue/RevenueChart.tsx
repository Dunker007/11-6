/**
 * Revenue Chart
 * Visual revenue breakdown with cyberpunk styling
 */

import { useMemo, memo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useRevenueStore } from '../../services/revenue/revenue-engine';
import { useAnalyticsStore } from '../../services/revenue/analytics';
import type { RevenuePeriod } from '../../types/revenue';

interface RevenueChartProps {
  period?: RevenuePeriod;
  type?: 'line' | 'pie';
}

const COLORS = {
  stripe: '#00f0ff',
  'idle-compute': '#ff00f7',
  content: '#7000ff',
  crypto: '#00ff88',
  affiliate: '#ffa500',
  ads: '#ff0055',
  manual: '#888899',
};

export const RevenueChart = memo(function RevenueChart({ period = 'week', type = 'line' }: RevenueChartProps) {
  const { streams } = useRevenueStore();
  const { getTimeSeries, sourceMetrics } = useAnalyticsStore();

  const chartData = useMemo(() => {
    if (type === 'line') {
      const timeSeries = getTimeSeries(period);
      return timeSeries.map(point => ({
        time: new Date(point.timestamp).toLocaleDateString(),
        revenue: point.value / 100, // Convert cents to dollars
      }));
    } else {
      return sourceMetrics.map(metric => ({
        name: metric.source,
        value: metric.total / 100,
        percentage: metric.percentage,
      }));
    }
  }, [streams, period, type, getTimeSeries, sourceMetrics]);

  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            label={(entry: any) => `${entry.name} ${entry.percentage.toFixed(0)}%`}
          >
            {chartData.map((entry: any, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#888899'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'rgba(10, 10, 15, 0.95)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: number) => `$${value.toFixed(2)}`}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#00f0ff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="time"
          stroke="#888"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke="#888"
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          contentStyle={{
            background: 'rgba(10, 10, 15, 0.95)',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            borderRadius: '8px',
            color: '#fff',
          }}
          formatter={(value: number) => `$${value.toFixed(2)}`}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#00f0ff"
          strokeWidth={2}
          fill="url(#revenueGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});
