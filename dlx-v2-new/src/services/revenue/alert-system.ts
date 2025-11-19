/**
 * Alert System
 * Real-time revenue alerts and notifications
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RevenueStream, RevenueSource } from '../../types/revenue';
import { logger } from '../foundation/logger';
import { toast } from '../../../src/components/ui/Toast';

export type AlertType = 'milestone' | 'threshold' | 'anomaly' | 'goal' | 'inactivity' | 'trend';
export type AlertSeverity = 'info' | 'warning' | 'critical' | 'success';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date;
  source?: RevenueSource;
  amount?: number;
  metadata?: Record<string, any>;
  dismissed: boolean;
  actionUrl?: string;
}

export interface AlertRule {
  id: string;
  type: AlertType;
  enabled: boolean;
  config: {
    threshold?: number; // For threshold alerts
    period?: 'hour' | 'day' | 'week'; // For inactivity alerts
    sources?: RevenueSource[]; // Filter by specific sources
    minChange?: number; // For anomaly detection (percentage)
  };
}

export interface AlertState {
  alerts: Alert[];
  rules: AlertRule[];
  mutedUntil: Date | null;

  // Actions
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'dismissed'>) => void;
  dismissAlert: (id: string) => void;
  dismissAll: () => void;
  checkRevenue: (streams: RevenueStream[]) => void;
  addRule: (rule: Omit<AlertRule, 'id'>) => string;
  updateRule: (id: string, updates: Partial<AlertRule>) => void;
  deleteRule: (id: string) => void;
  muteAlerts: (durationMs: number) => void;
  unmuteAlerts: () => void;
}

export const useAlertStore = create<AlertState>()(
  persist(
    (set, get) => ({
      alerts: [],
      rules: [
        // Default rules
        {
          id: 'milestone-100',
          type: 'milestone',
          enabled: true,
          config: { threshold: 10000 }, // $100 (in cents)
        },
        {
          id: 'threshold-daily',
          type: 'threshold',
          enabled: true,
          config: { threshold: 5000, period: 'day' }, // $50/day
        },
        {
          id: 'inactivity-24h',
          type: 'inactivity',
          enabled: true,
          config: { period: 'day' },
        },
        {
          id: 'anomaly-detection',
          type: 'anomaly',
          enabled: true,
          config: { minChange: 50 }, // 50% change
        },
      ],
      mutedUntil: null,

      addAlert: (alertData) => {
        const { mutedUntil } = get();

        // Check if alerts are muted
        if (mutedUntil && new Date() < mutedUntil) {
          logger.info('Alerts muted - skipping', { until: mutedUntil });
          return;
        }

        const alert: Alert = {
          ...alertData,
          id: crypto.randomUUID(),
          timestamp: new Date(),
          dismissed: false,
        };

        set(state => ({
          alerts: [alert, ...state.alerts].slice(0, 50), // Keep last 50
        }));

        // Show toast notification
        const toastOptions = {
          description: alert.message,
          duration: alert.severity === 'critical' ? 10000 : 5000,
        };

        switch (alert.severity) {
          case 'success':
            toast.success(alert.title, toastOptions);
            break;
          case 'warning':
            toast.warning(alert.title, toastOptions);
            break;
          case 'critical':
            toast.error(alert.title, toastOptions);
            break;
          default:
            toast.info(alert.title, toastOptions);
        }

        logger.info(`🔔 Alert: ${alert.title}`, { type: alert.type, severity: alert.severity });
      },

      dismissAlert: (id) => {
        set(state => ({
          alerts: state.alerts.map(a => (a.id === id ? { ...a, dismissed: true } : a)),
        }));
      },

      dismissAll: () => {
        set(state => ({
          alerts: state.alerts.map(a => ({ ...a, dismissed: true })),
        }));
      },

      checkRevenue: (streams) => {
        const { rules, addAlert } = get();
        const enabledRules = rules.filter(r => r.enabled);

        logger.info('🔍 Checking revenue alerts', { streams: streams.length, rules: enabledRules.length });

        for (const rule of enabledRules) {
          try {
            switch (rule.type) {
              case 'milestone':
                checkMilestone(streams, rule, addAlert);
                break;
              case 'threshold':
                checkThreshold(streams, rule, addAlert);
                break;
              case 'inactivity':
                checkInactivity(streams, rule, addAlert);
                break;
              case 'anomaly':
                checkAnomaly(streams, rule, addAlert);
                break;
            }
          } catch (error) {
            logger.error('Alert check failed', { rule: rule.type, error });
          }
        }
      },

      addRule: (ruleData) => {
        const rule: AlertRule = {
          ...ruleData,
          id: crypto.randomUUID(),
        };

        set(state => ({
          rules: [...state.rules, rule],
        }));

        logger.info('Alert rule added', { type: rule.type });
        return rule.id;
      },

      updateRule: (id, updates) => {
        set(state => ({
          rules: state.rules.map(r => (r.id === id ? { ...r, ...updates } : r)),
        }));
      },

      deleteRule: (id) => {
        set(state => ({
          rules: state.rules.filter(r => r.id !== id),
        }));
      },

      muteAlerts: (durationMs) => {
        const mutedUntil = new Date(Date.now() + durationMs);
        set({ mutedUntil });
        logger.info('Alerts muted', { until: mutedUntil });
        toast.info('Alerts muted', { description: `Until ${mutedUntil.toLocaleTimeString()}` });
      },

      unmuteAlerts: () => {
        set({ mutedUntil: null });
        logger.info('Alerts unmuted');
        toast.info('Alerts unmuted');
      },
    }),
    {
      name: 'dlx-alerts',
      version: 1,
    }
  )
);

// Alert check functions

function checkMilestone(
  streams: RevenueStream[],
  rule: AlertRule,
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'dismissed'>) => void
) {
  const { threshold } = rule.config;
  if (!threshold) return;

  const total = streams.reduce((sum, s) => sum + s.amount, 0);

  // Check if we just crossed a milestone (within last stream)
  if (streams.length > 0 && total >= threshold) {
    const previousTotal = total - streams[streams.length - 1].amount;

    if (previousTotal < threshold) {
      addAlert({
        type: 'milestone',
        severity: 'success',
        title: `🎉 Milestone Reached!`,
        message: `You've earned $${(threshold / 100).toFixed(2)} in total revenue!`,
        amount: threshold,
      });
    }
  }
}

function checkThreshold(
  streams: RevenueStream[],
  rule: AlertRule,
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'dismissed'>) => void
) {
  const { threshold, period } = rule.config;
  if (!threshold || !period) return;

  const now = Date.now();
  const periodMs = {
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
  }[period];

  const periodStreams = streams.filter(
    s => now - new Date(s.timestamp).getTime() <= periodMs
  );

  const total = periodStreams.reduce((sum, s) => sum + s.amount, 0);

  if (total >= threshold) {
    addAlert({
      type: 'threshold',
      severity: 'success',
      title: `${period} Revenue Goal Met!`,
      message: `You've earned $${(total / 100).toFixed(2)} this ${period} (goal: $${(threshold / 100).toFixed(2)})`,
      amount: total,
    });
  }
}

function checkInactivity(
  streams: RevenueStream[],
  rule: AlertRule,
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'dismissed'>) => void
) {
  const { period } = rule.config;
  if (!period) return;

  const now = Date.now();
  const periodMs = {
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
  }[period];

  const recentStreams = streams.filter(
    s => now - new Date(s.timestamp).getTime() <= periodMs
  );

  if (recentStreams.length === 0 && streams.length > 0) {
    addAlert({
      type: 'inactivity',
      severity: 'warning',
      title: `No Revenue in ${period}`,
      message: `You haven't generated any revenue in the last ${period}. Check your automation pipelines.`,
    });
  }
}

function checkAnomaly(
  streams: RevenueStream[],
  rule: AlertRule,
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'dismissed'>) => void
) {
  const { minChange } = rule.config;
  if (!minChange || streams.length < 10) return;

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  // Compare last 24h to previous 24h
  const recent = streams.filter(s => now - new Date(s.timestamp).getTime() <= day);
  const previous = streams.filter(s => {
    const age = now - new Date(s.timestamp).getTime();
    return age > day && age <= day * 2;
  });

  if (recent.length === 0 || previous.length === 0) return;

  const recentTotal = recent.reduce((sum, s) => sum + s.amount, 0);
  const previousTotal = previous.reduce((sum, s) => sum + s.amount, 0);

  if (previousTotal === 0) return;

  const change = ((recentTotal - previousTotal) / previousTotal) * 100;

  if (Math.abs(change) >= minChange) {
    const severity = change > 0 ? 'success' : 'warning';
    const emoji = change > 0 ? '📈' : '📉';

    addAlert({
      type: 'anomaly',
      severity,
      title: `${emoji} Revenue ${change > 0 ? 'Spike' : 'Drop'} Detected`,
      message: `Revenue is ${change > 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(0)}% compared to yesterday`,
      amount: recentTotal,
    });
  }
}
