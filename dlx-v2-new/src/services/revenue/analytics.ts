/**
 * Analytics Service
 * Revenue analytics, trends, and forecasting
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RevenueStream, RevenuePeriod, RevenueSource } from '../../types/revenue';
import { logger } from '../foundation/logger';

export interface RevenueMetric {
  period: RevenuePeriod;
  total: number;
  change: number; // percentage vs previous period
  trend: 'up' | 'down' | 'stable';
  velocity: number; // $ per hour
  forecast: number; // predicted next period
}

export interface SourceMetric {
  source: RevenueSource;
  total: number;
  count: number;
  average: number;
  percentage: number; // of total revenue
  trend: 'up' | 'down' | 'stable';
  change: number; // percentage change
  lastEvent?: Date;
}

export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
  source?: RevenueSource;
}

export interface AnalyticsState {
  metrics: Record<RevenuePeriod, RevenueMetric>;
  sourceMetrics: SourceMetric[];
  timeSeries: TimeSeriesPoint[];
  topSources: RevenueSource[];
  insights: string[];

  // Actions
  analyze: (streams: RevenueStream[]) => void;
  getMetric: (period: RevenuePeriod) => RevenueMetric | null;
  getSourceBreakdown: () => SourceMetric[];
  getTimeSeries: (period: RevenuePeriod, source?: RevenueSource) => TimeSeriesPoint[];
  generateInsights: () => string[];
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      metrics: {} as Record<RevenuePeriod, RevenueMetric>,
      sourceMetrics: [],
      timeSeries: [],
      topSources: [],
      insights: [],

      analyze: (streams) => {
        logger.info('📊 Analyzing revenue data', { streams: streams.length });

        if (streams.length === 0) {
          return;
        }

        // Calculate metrics for each period
        const periods: RevenuePeriod[] = ['hour', 'day', 'week', 'month', 'year', 'all-time'];
        const newMetrics: Record<string, RevenueMetric> = {};

        for (const period of periods) {
          const metric = calculatePeriodMetric(streams, period);
          newMetrics[period] = metric;
        }

        // Calculate source metrics
        const sourceMetrics = calculateSourceMetrics(streams);

        // Generate time series
        const timeSeries = generateTimeSeries(streams, 'day');

        // Identify top sources
        const topSources = sourceMetrics
          .sort((a, b) => b.total - a.total)
          .slice(0, 5)
          .map(m => m.source);

        set({
          metrics: newMetrics as Record<RevenuePeriod, RevenueMetric>,
          sourceMetrics,
          timeSeries,
          topSources,
        });

        // Generate insights
        get().generateInsights();

        logger.info('✅ Analytics updated', {
          totalRevenue: newMetrics['all-time'].total,
          sources: sourceMetrics.length,
        });
      },

      getMetric: (period) => {
        return get().metrics[period] || null;
      },

      getSourceBreakdown: () => {
        return get().sourceMetrics;
      },

      getTimeSeries: (period, source) => {
        const { timeSeries } = get();

        // Filter by source if specified
        let filtered = source
          ? timeSeries.filter(point => point.source === source)
          : timeSeries;

        // Filter by period
        const now = Date.now();
        const periodMs = getPeriodMilliseconds(period);

        if (periodMs !== Infinity) {
          filtered = filtered.filter(
            point => now - new Date(point.timestamp).getTime() <= periodMs
          );
        }

        return filtered;
      },

      generateInsights: () => {
        const { metrics, sourceMetrics, topSources } = get();
        const insights: string[] = [];

        // Revenue growth insights
        const monthMetric = metrics['month'];
        if (monthMetric) {
          if (monthMetric.change > 20) {
            insights.push(`🚀 Revenue is up ${monthMetric.change.toFixed(0)}% this month - exceptional growth!`);
          } else if (monthMetric.change > 10) {
            insights.push(`📈 Revenue growing ${monthMetric.change.toFixed(0)}% this month - strong performance`);
          } else if (monthMetric.change < -10) {
            insights.push(`⚠️ Revenue down ${Math.abs(monthMetric.change).toFixed(0)}% - consider optimizing top sources`);
          }

          // Velocity insights
          if (monthMetric.velocity > 10) {
            insights.push(`⚡ Current velocity: $${monthMetric.velocity.toFixed(2)}/hour`);
          }

          // Forecast insights
          if (monthMetric.forecast > monthMetric.total * 1.2) {
            insights.push(`🎯 Forecast suggests 20%+ growth next month`);
          }
        }

        // Source concentration insights
        if (topSources.length > 0 && sourceMetrics.length > 0) {
          const topSource = sourceMetrics.find(m => m.source === topSources[0]);
          if (topSource && topSource.percentage > 70) {
            insights.push(`⚠️ ${topSource.percentage.toFixed(0)}% revenue from ${topSource.source} - consider diversifying`);
          }

          // Trending source
          const trendingSource = sourceMetrics.find(m => m.trend === 'up' && m.change > 50);
          if (trendingSource) {
            insights.push(`🌟 ${trendingSource.source} is trending up - potential to optimize`);
          }
        }

        // Activity insights
        const dayMetric = metrics['day'];
        if (dayMetric && dayMetric.velocity === 0) {
          insights.push(`💤 No revenue today - check your automation pipelines`);
        }

        set({ insights });
        return insights;
      },
    }),
    {
      name: 'dlx-analytics',
      version: 1,
    }
  )
);

// Helper functions

function calculatePeriodMetric(streams: RevenueStream[], period: RevenuePeriod): RevenueMetric {
  const now = Date.now();
  const periodMs = getPeriodMilliseconds(period);

  // Filter streams within period
  const periodStreams = streams.filter(stream => {
    if (periodMs === Infinity) return true;
    return now - new Date(stream.timestamp).getTime() <= periodMs;
  });

  // Calculate total
  const total = periodStreams.reduce((sum, stream) => sum + stream.amount, 0);

  // Calculate previous period for comparison
  const previousPeriodStreams = streams.filter(stream => {
    if (periodMs === Infinity) return false;
    const age = now - new Date(stream.timestamp).getTime();
    return age > periodMs && age <= periodMs * 2;
  });

  const previousTotal = previousPeriodStreams.reduce((sum, stream) => sum + stream.amount, 0);

  // Calculate change percentage
  const change = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0;

  // Determine trend
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (change > 5) trend = 'up';
  else if (change < -5) trend = 'down';

  // Calculate velocity ($ per hour)
  const hours = periodMs === Infinity ? 24 * 365 : periodMs / (1000 * 60 * 60);
  const velocity = total / hours;

  // Simple forecast (linear projection based on current velocity)
  const forecast = velocity * hours;

  return {
    period,
    total,
    change,
    trend,
    velocity,
    forecast,
  };
}

function calculateSourceMetrics(streams: RevenueStream[]): SourceMetric[] {
  const sourceMap = new Map<RevenueSource, RevenueStream[]>();

  // Group by source
  for (const stream of streams) {
    const existing = sourceMap.get(stream.source) || [];
    existing.push(stream);
    sourceMap.set(stream.source, existing);
  }

  // Calculate total revenue
  const totalRevenue = streams.reduce((sum, s) => sum + s.amount, 0);

  // Calculate metrics per source
  const metrics: SourceMetric[] = [];

  for (const [source, sourceStreams] of sourceMap) {
    const total = sourceStreams.reduce((sum, s) => sum + s.amount, 0);
    const count = sourceStreams.length;
    const average = total / count;
    const percentage = totalRevenue > 0 ? (total / totalRevenue) * 100 : 0;

    // Calculate trend (last 7 days vs previous 7 days)
    const now = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;

    const recentTotal = sourceStreams
      .filter(s => now - new Date(s.timestamp).getTime() <= week)
      .reduce((sum, s) => sum + s.amount, 0);

    const previousTotal = sourceStreams
      .filter(s => {
        const age = now - new Date(s.timestamp).getTime();
        return age > week && age <= week * 2;
      })
      .reduce((sum, s) => sum + s.amount, 0);

    const change = previousTotal > 0 ? ((recentTotal - previousTotal) / previousTotal) * 100 : 0;
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (change > 10) trend = 'up';
    else if (change < -10) trend = 'down';

    const lastEvent = sourceStreams.length > 0
      ? new Date(Math.max(...sourceStreams.map(s => new Date(s.timestamp).getTime())))
      : undefined;

    metrics.push({
      source,
      total,
      count,
      average,
      percentage,
      trend,
      change,
      lastEvent,
    });
  }

  return metrics.sort((a, b) => b.total - a.total);
}

function generateTimeSeries(streams: RevenueStream[], resolution: 'hour' | 'day'): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const bucketMs = resolution === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  // Group streams into time buckets
  const buckets = new Map<number, number>();

  for (const stream of streams) {
    const timestamp = new Date(stream.timestamp).getTime();
    const bucket = Math.floor(timestamp / bucketMs) * bucketMs;
    buckets.set(bucket, (buckets.get(bucket) || 0) + stream.amount);
  }

  // Convert to time series points
  for (const [timestamp, value] of buckets) {
    points.push({
      timestamp: new Date(timestamp),
      value,
    });
  }

  return points.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

function getPeriodMilliseconds(period: RevenuePeriod): number {
  const periods = {
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
    'all-time': Infinity,
  };
  return periods[period];
}
