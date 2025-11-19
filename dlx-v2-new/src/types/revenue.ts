/**
 * Revenue Types
 * Core data models for the revenue tracking system
 */

export type RevenueSource =
  | 'stripe'
  | 'idle-compute'
  | 'content'
  | 'crypto'
  | 'affiliate'
  | 'ads'
  | 'manual';

export type RevenuePeriod = 'hour' | 'day' | 'week' | 'month' | 'year' | 'all-time';

export interface RevenueStream {
  id: string;
  source: RevenueSource;
  name: string;
  amount: number; // in cents
  currency: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface RevenueStats {
  total: number; // in cents
  change: number; // percentage
  period: RevenuePeriod;
  breakdown: Record<RevenueSource, number>;
  trend: 'up' | 'down' | 'stable';
}

export interface RevenueGoal {
  id: string;
  target: number; // in cents
  period: RevenuePeriod;
  current: number;
  progress: number; // percentage
}

export interface RevenueAlert {
  id: string;
  type: 'drop' | 'milestone' | 'opportunity' | 'error';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: Date;
  actionable: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

export interface RevenueOpportunity {
  id: string;
  title: string;
  description: string;
  estimatedRevenue: number; // monthly estimate in cents
  difficulty: 'easy' | 'medium' | 'hard';
  timeToImplement: string; // e.g., "5 minutes", "1 hour"
  action: {
    label: string;
    handler: () => void;
  };
}
