/**
 * revenueTrackingService.ts
 *
 * PURPOSE:
 * Comprehensive revenue tracking and analytics for passive income streams.
 * Monitors multiple revenue sources (affiliate marketing, content monetization,
 * ad revenue, subscriptions) and provides detailed analytics, forecasting, and
 * optimization recommendations.
 *
 * ARCHITECTURE:
 * - Tracks revenue from multiple sources
 * - Provides real-time analytics and dashboards
 * - Generates revenue forecasts using historical data
 * - Integrates with webhook APIs for automated tracking
 * - Exports data for tax/accounting purposes
 *
 * FEATURES:
 * ✅ Multi-source revenue tracking
 * ✅ Real-time analytics dashboards
 * ✅ Revenue forecasting and projections
 * ✅ Goal setting and progress tracking
 * ✅ Webhook integration for automated updates
 * ✅ Export to CSV/JSON for accounting
 * ✅ Tax preparation support
 *
 * DEPENDENCIES:
 * - logger: Activity logging
 * - activityService: User activity tracking
 */

import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';

export type RevenueSource =
  | 'affiliate'
  | 'content-ads'
  | 'subscription'
  | 'one-time'
  | 'sponsorship'
  | 'other';

export interface RevenueEntry {
  id: string;
  source: RevenueSource;
  amount: number;
  currency: string;
  description: string;
  date: Date;
  metadata?: {
    transactionId?: string;
    platform?: string;
    productId?: string;
    customerId?: string;
    [key: string]: any;
  };
}

export interface RevenueGoal {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: Date;
  source?: RevenueSource; // Optional: goal for specific source
  currentAmount: number;
  isActive: boolean;
  createdAt: Date;
}

export interface RevenueForecast {
  period: string; // e.g., "2025-01", "2025-Q1"
  predictedAmount: number;
  confidence: number; // 0-100
  basedOnDays: number; // Historical days used for forecast
}

export interface WebhookConfig {
  id: string;
  url: string;
  events: ('revenue-added' | 'goal-reached' | 'milestone')[];
  headers?: Record<string, string>;
  isActive: boolean;
}

class RevenueTrackingService {
  private entries: RevenueEntry[] = [];
  private goals: RevenueGoal[] = [];
  private webhooks: WebhookConfig[] = [];

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Load data from localStorage
   */
  private loadFromStorage() {
    try {
      // Load revenue entries
      const entriesData = localStorage.getItem('revenue-entries');
      if (entriesData) {
        this.entries = JSON.parse(entriesData, (key, value) => {
          if (key === 'date') return new Date(value);
          return value;
        });
        logger.info('Revenue entries loaded', { count: this.entries.length });
      }

      // Load goals
      const goalsData = localStorage.getItem('revenue-goals');
      if (goalsData) {
        this.goals = JSON.parse(goalsData, (key, value) => {
          if (key === 'targetDate' || key === 'createdAt') return new Date(value);
          return value;
        });
        logger.info('Revenue goals loaded', { count: this.goals.length });
      }

      // Load webhooks
      const webhooksData = localStorage.getItem('revenue-webhooks');
      if (webhooksData) {
        this.webhooks = JSON.parse(webhooksData);
      }
    } catch (error) {
      logger.error('Failed to load revenue data from storage', { error });
    }
  }

  /**
   * Save data to localStorage
   */
  private saveToStorage() {
    try {
      localStorage.setItem('revenue-entries', JSON.stringify(this.entries));
      localStorage.setItem('revenue-goals', JSON.stringify(this.goals));
      localStorage.setItem('revenue-webhooks', JSON.stringify(this.webhooks));
    } catch (error) {
      logger.error('Failed to save revenue data to storage', { error });
    }
  }

  /**
   * Add revenue entry
   */
  async addRevenue(
    source: RevenueSource,
    amount: number,
    description: string,
    metadata?: RevenueEntry['metadata']
  ): Promise<RevenueEntry> {
    const entry: RevenueEntry = {
      id: crypto.randomUUID(),
      source,
      amount,
      currency: 'USD',
      description,
      date: new Date(),
      metadata,
    };

    this.entries.push(entry);
    this.saveToStorage();

    // Update goals
    this.updateGoals(source, amount);

    // Trigger webhooks
    await this.triggerWebhooks('revenue-added', entry);

    // Log activity
    activityService.addActivity({
      type: 'revenue',
      action: 'Revenue Added',
      description: `+$${amount.toFixed(2)} from ${source}`,
      metadata: { amount, source },
    });

    logger.info('Revenue entry added', {
      id: entry.id,
      source,
      amount,
    });

    return entry;
  }

  /**
   * Update goals based on new revenue
   */
  private updateGoals(source: RevenueSource, amount: number) {
    let goalsUpdated = 0;

    this.goals.forEach((goal) => {
      if (!goal.isActive) return;

      // Update if goal is for all sources or matches specific source
      if (!goal.source || goal.source === source) {
        goal.currentAmount += amount;

        // Check if goal reached
        if (
          goal.currentAmount >= goal.targetAmount &&
          goal.currentAmount - amount < goal.targetAmount
        ) {
          this.triggerWebhooks('goal-reached', goal);

          activityService.addActivity({
            type: 'revenue',
            action: 'Goal Reached',
            description: `🎉 Reached goal: ${goal.name}`,
            metadata: { goalId: goal.id, targetAmount: goal.targetAmount },
          });

          logger.info('Revenue goal reached', {
            goalId: goal.id,
            name: goal.name,
            amount: goal.currentAmount,
          });
        }

        goalsUpdated++;
      }
    });

    if (goalsUpdated > 0) {
      this.saveToStorage();
    }
  }

  /**
   * Create revenue goal
   */
  createGoal(
    name: string,
    targetAmount: number,
    targetDate: Date,
    source?: RevenueSource
  ): RevenueGoal {
    const goal: RevenueGoal = {
      id: crypto.randomUUID(),
      name,
      targetAmount,
      targetDate,
      source,
      currentAmount: 0,
      isActive: true,
      createdAt: new Date(),
    };

    this.goals.push(goal);
    this.saveToStorage();

    logger.info('Revenue goal created', { id: goal.id, name });

    activityService.addActivity({
      type: 'revenue',
      action: 'Goal Created',
      description: `Set goal: ${name} ($${targetAmount})`,
    });

    return goal;
  }

  /**
   * Get all revenue entries
   */
  getEntries(filter?: {
    source?: RevenueSource;
    startDate?: Date;
    endDate?: Date;
  }): RevenueEntry[] {
    let filtered = [...this.entries];

    if (filter) {
      if (filter.source) {
        filtered = filtered.filter((e) => e.source === filter.source);
      }
      if (filter.startDate) {
        filtered = filtered.filter((e) => e.date >= filter.startDate!);
      }
      if (filter.endDate) {
        filtered = filtered.filter((e) => e.date <= filter.endDate!);
      }
    }

    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Get revenue analytics
   */
  getAnalytics(period: 'day' | 'week' | 'month' | 'year' | 'all' = 'month') {
    const now = new Date();
    const startDate = this.getStartDate(now, period);

    const entries = this.getEntries({
      startDate: period === 'all' ? undefined : startDate,
    });

    const totalRevenue = entries.reduce((sum, e) => sum + e.amount, 0);

    const bySource = entries.reduce((acc, entry) => {
      acc[entry.source] = (acc[entry.source] || 0) + entry.amount;
      return acc;
    }, {} as Record<RevenueSource, number>);

    const entryCount = entries.length;

    // Calculate growth (compare to previous period)
    const previousPeriodStart = this.getPreviousPeriodStart(startDate, period);
    const previousEntries = this.getEntries({
      startDate: previousPeriodStart,
      endDate: startDate,
    });
    const previousRevenue = previousEntries.reduce((sum, e) => sum + e.amount, 0);

    const growth =
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    // Top sources
    const topSources = Object.entries(bySource)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([source, amount]) => ({ source: source as RevenueSource, amount }));

    return {
      period,
      totalRevenue,
      entryCount,
      averagePerEntry: entryCount > 0 ? totalRevenue / entryCount : 0,
      growth: growth.toFixed(2) + '%',
      bySource,
      topSources,
    };
  }

  /**
   * Get revenue forecast
   */
  getForecast(months: number = 3): RevenueForecast[] {
    if (this.entries.length < 7) {
      logger.warn('Not enough data for accurate forecast');
      return [];
    }

    // Calculate daily average from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentEntries = this.getEntries({ startDate: thirtyDaysAgo });
    const totalRecent = recentEntries.reduce((sum, e) => sum + e.amount, 0);
    const dailyAverage = totalRecent / 30;

    const forecasts: RevenueForecast[] = [];
    const now = new Date();

    for (let i = 1; i <= months; i++) {
      const forecastDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const daysInMonth = new Date(
        forecastDate.getFullYear(),
        forecastDate.getMonth() + 1,
        0
      ).getDate();

      const predictedAmount = dailyAverage * daysInMonth;

      // Confidence decreases for further months
      const confidence = Math.max(50, 90 - i * 10);

      forecasts.push({
        period: `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`,
        predictedAmount: Math.round(predictedAmount * 100) / 100,
        confidence,
        basedOnDays: 30,
      });
    }

    return forecasts;
  }

  /**
   * Get active goals
   */
  getGoals(): RevenueGoal[] {
    return this.goals.filter((g) => g.isActive);
  }

  /**
   * Get goal progress
   */
  getGoalProgress(goalId: string): number {
    const goal = this.goals.find((g) => g.id === goalId);
    if (!goal) return 0;

    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    return Math.min(100, Math.max(0, progress));
  }

  /**
   * Delete goal
   */
  deleteGoal(goalId: string): boolean {
    const index = this.goals.findIndex((g) => g.id === goalId);
    if (index !== -1) {
      this.goals.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Add webhook
   */
  addWebhook(config: Omit<WebhookConfig, 'id'>): WebhookConfig {
    const webhook: WebhookConfig = {
      id: crypto.randomUUID(),
      ...config,
    };

    this.webhooks.push(webhook);
    this.saveToStorage();

    logger.info('Webhook added', { id: webhook.id, url: webhook.url });

    return webhook;
  }

  /**
   * Trigger webhooks for event
   */
  private async triggerWebhooks(
    event: WebhookConfig['events'][number],
    data: any
  ): Promise<void> {
    const activeWebhooks = this.webhooks.filter(
      (w) => w.isActive && w.events.includes(event)
    );

    for (const webhook of activeWebhooks) {
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...webhook.headers,
          },
          body: JSON.stringify({
            event,
            data,
            timestamp: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error(`Webhook failed: ${response.statusText}`);
        }

        logger.debug('Webhook triggered successfully', {
          webhookId: webhook.id,
          event,
        });
      } catch (error) {
        logger.error('Webhook trigger failed', {
          webhookId: webhook.id,
          event,
          error,
        });
      }
    }
  }

  /**
   * Export revenue data to CSV
   */
  exportToCSV(): string {
    const headers = ['Date', 'Source', 'Amount', 'Description', 'Transaction ID'];
    const rows = this.entries.map((entry) => [
      entry.date.toISOString().split('T')[0],
      entry.source,
      entry.amount.toString(),
      entry.description,
      entry.metadata?.transactionId || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    return csv;
  }

  /**
   * Export revenue data to JSON
   */
  exportToJSON(): string {
    return JSON.stringify(
      {
        entries: this.entries,
        goals: this.goals,
        analytics: this.getAnalytics('all'),
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }

  /**
   * Helper: Get start date for period
   */
  private getStartDate(now: Date, period: string): Date {
    const date = new Date(now);

    switch (period) {
      case 'day':
        date.setHours(0, 0, 0, 0);
        break;
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() - 1);
        break;
    }

    return date;
  }

  /**
   * Helper: Get previous period start date
   */
  private getPreviousPeriodStart(startDate: Date, period: string): Date {
    const date = new Date(startDate);

    switch (period) {
      case 'day':
        date.setDate(date.getDate() - 1);
        break;
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() - 1);
        break;
    }

    return date;
  }

  /**
   * Get total lifetime revenue
   */
  getTotalRevenue(): number {
    return this.entries.reduce((sum, entry) => sum + entry.amount, 0);
  }

  /**
   * Clear all data (use with caution)
   */
  clearAll(): void {
    this.entries = [];
    this.goals = [];
    this.saveToStorage();
    logger.warn('All revenue data cleared');
  }
}

// Export singleton instance
export const revenueTrackingService = new RevenueTrackingService();
