/**
 * Revenue Engine
 * Core service for revenue aggregation and analytics
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  RevenueStream,
  RevenueStats,
  RevenueGoal,
  RevenueAlert,
  RevenueOpportunity,
  RevenueSource,
  RevenuePeriod,
} from '../../types/revenue';
import { logger } from '../foundation/logger';
import { storage } from '../foundation/storage';

interface RevenueState {
  streams: RevenueStream[];
  stats: RevenueStats | null;
  goals: RevenueGoal[];
  alerts: RevenueAlert[];
  opportunities: RevenueOpportunity[];
  isLoading: boolean;

  // Actions
  addStream: (stream: Omit<RevenueStream, 'id'>) => void;
  removeStream: (id: string) => void;
  updateStats: (period: RevenuePeriod) => void;
  addGoal: (goal: Omit<RevenueGoal, 'id' | 'current' | 'progress'>) => void;
  checkAlerts: () => void;
  loadOpportunities: () => void;
  dismissAlert: (id: string) => void;
}

export const useRevenueStore = create<RevenueState>()(
  persist(
    (set, get) => ({
      streams: [],
      stats: null,
      goals: [],
      alerts: [],
      opportunities: [],
      isLoading: false,

      addStream: (stream) => {
        const newStream: RevenueStream = {
          ...stream,
          id: crypto.randomUUID(),
        };

        set((state) => ({
          streams: [...state.streams, newStream],
        }));

        // Save to IndexedDB
        storage.set('revenue', newStream.id, newStream);

        // Update stats
        get().updateStats('month');

        // Check for alerts
        get().checkAlerts();

        logger.info('Revenue stream added', { source: newStream.source, amount: newStream.amount });
      },

      removeStream: (id) => {
        set((state) => ({
          streams: state.streams.filter((s) => s.id !== id),
        }));

        storage.delete('revenue', id);
        get().updateStats('month');
      },

      updateStats: (period) => {
        const streams = get().streams;
        const now = new Date();

        // Define time periods in milliseconds
        const periods = {
          hour: 60 * 60 * 1000,
          day: 24 * 60 * 60 * 1000,
          week: 7 * 24 * 60 * 60 * 1000,
          month: 30 * 24 * 60 * 60 * 1000,
          year: 365 * 24 * 60 * 60 * 1000,
          'all-time': Infinity,
        };

        // Filter streams by period
        const filtered = streams.filter((stream) => {
          const diff = now.getTime() - stream.timestamp.getTime();
          return diff <= periods[period];
        });

        // Calculate total
        const total = filtered.reduce((sum, stream) => sum + stream.amount, 0);

        // Calculate breakdown by source
        const breakdown: Record<RevenueSource, number> = {
          stripe: 0,
          'idle-compute': 0,
          content: 0,
          crypto: 0,
          affiliate: 0,
          ads: 0,
          manual: 0,
        };

        filtered.forEach((stream) => {
          breakdown[stream.source] += stream.amount;
        });

        // Calculate change (compare to previous period)
        const previousPeriodEnd = new Date(now.getTime() - periods[period]);
        const previousStreams = streams.filter((stream) => {
          const timestamp = stream.timestamp.getTime();
          return timestamp >= previousPeriodEnd.getTime() - periods[period] && timestamp < previousPeriodEnd.getTime();
        });
        const previousTotal = previousStreams.reduce((sum, s) => sum + s.amount, 0);
        const change = previousTotal === 0 ? 0 : ((total - previousTotal) / previousTotal) * 100;

        // Determine trend
        const trend: 'up' | 'down' | 'stable' = change > 5 ? 'up' : change < -5 ? 'down' : 'stable';

        const stats: RevenueStats = {
          total,
          change,
          period,
          breakdown,
          trend,
        };

        set({ stats });
        logger.debug('Revenue stats updated', { period, total, change });
      },

      addGoal: (goalData) => {
        const goal: RevenueGoal = {
          ...goalData,
          id: crypto.randomUUID(),
          current: get().stats?.total || 0,
          progress: 0,
        };

        // Calculate progress
        goal.progress = goal.target === 0 ? 0 : (goal.current / goal.target) * 100;

        set((state) => ({
          goals: [...state.goals, goal],
        }));

        logger.info('Revenue goal added', { target: goal.target, period: goal.period });
      },

      checkAlerts: () => {
        const { stats, goals, streams } = get();
        const alerts: RevenueAlert[] = [];

        // Check for revenue drops
        if (stats && stats.trend === 'down' && stats.change < -15) {
          alerts.push({
            id: crypto.randomUUID(),
            type: 'drop',
            message: `Revenue dropped ${Math.abs(stats.change).toFixed(1)}% this ${stats.period}`,
            severity: 'warning',
            timestamp: new Date(),
            actionable: true,
            action: {
              label: 'Analyze',
              handler: () => logger.info('Analyzing revenue drop'),
            },
          });
        }

        // Check for milestone achievements
        goals.forEach((goal) => {
          if (goal.progress >= 100 && goal.progress < 105) {
            alerts.push({
              id: crypto.randomUUID(),
              type: 'milestone',
              message: `🎉 Goal achieved: ${goal.target / 100} ${goal.period}!`,
              severity: 'info',
              timestamp: new Date(),
              actionable: false,
            });
          }
        });

        // Check for inactive streams
        const recentStreams = streams.filter((s) => {
          const daysSinceLastStream = (Date.now() - s.timestamp.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceLastStream < 7;
        });

        if (recentStreams.length === 0 && streams.length > 0) {
          alerts.push({
            id: crypto.randomUUID(),
            type: 'opportunity',
            message: 'No revenue activity in the past week. Check integrations.',
            severity: 'warning',
            timestamp: new Date(),
            actionable: true,
            action: {
              label: 'Check Integrations',
              handler: () => logger.info('Opening integrations'),
            },
          });
        }

        set({ alerts });
      },

      loadOpportunities: async () => {
        // Load revenue opportunities using AI detector
        const { detectOpportunities } = await import('../ai/opportunity-detector');
        const { stats } = get();

        const context = {
          currentRevenue: stats?.breakdown || {
            stripe: 0,
            'idle-compute': 0,
            content: 0,
            crypto: 0,
            affiliate: 0,
            ads: 0,
            manual: 0,
          },
          activeStreams: Object.values(stats?.breakdown || {}).filter(v => v > 0).length,
          hasStripe: false, // Will be updated when Stripe connects
          hasContentPipeline: false,
          hasIdleCompute: false,
        };

        const opportunities = await detectOpportunities(context);
        set({ opportunities });
      },

      _loadOpportunitiesOld: () => {
        // Old static implementation (kept for reference)
        const opportunities: RevenueOpportunity[] = [
          {
            id: '1',
            title: 'Enable Idle Compute',
            description: 'Earn passive income by sharing unused GPU/CPU cycles',
            estimatedRevenue: 540000, // $5,400/mo in cents
            difficulty: 'easy',
            timeToImplement: '5 minutes',
            action: {
              label: 'Setup Idle Compute',
              handler: () => logger.info('Starting idle compute setup'),
            },
          },
          {
            id: '2',
            title: 'Automate Content Publishing',
            description: 'AI-generated blog posts published to Medium, Dev.to, and your blog',
            estimatedRevenue: 180000, // $1,800/mo
            difficulty: 'medium',
            timeToImplement: '15 minutes',
            action: {
              label: 'Setup Content Pipeline',
              handler: () => logger.info('Starting content automation'),
            },
          },
          {
            id: '3',
            title: 'Connect Stripe Subscriptions',
            description: 'Track recurring revenue from subscriptions and invoices',
            estimatedRevenue: 0, // Depends on existing business
            difficulty: 'easy',
            timeToImplement: '3 minutes',
            action: {
              label: 'Connect Stripe',
              handler: () => logger.info('Starting Stripe setup'),
            },
          },
        ];

        set({ opportunities });
      },

      dismissAlert: (id) => {
        set((state) => ({
          alerts: state.alerts.filter((a) => a.id !== id),
        }));
      },
    }),
    {
      name: 'dlx-revenue',
      version: 1,
    }
  )
);

// Helper function for formatting currency
export function formatCurrency(cents: number, currency = 'USD'): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(dollars);
}

// Helper function for formatting percentages
export function formatPercentage(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}
