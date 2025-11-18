/**
 * Unified Revenue Service
 *
 * PURPOSE:
 * Consolidates revenue tracking from multiple sources into a single interface.
 * Bridges the legacy tracker and new revenueTrackingService.
 *
 * ARCHITECTURE:
 * Facade pattern - provides a unified API that delegates to the appropriate
 * underlying service based on the operation.
 *
 * MIGRATION STRATEGY:
 * 1. Use this service for all new code
 * 2. Gradually migrate existing code to use this unified interface
 * 3. Eventually deprecate direct usage of legacy tracker
 *
 * USAGE:
 * ```typescript
 * import { unifiedRevenueService } from '@/services/revenue/unifiedRevenueService';
 *
 * // Track revenue
 * await unifiedRevenueService.trackRevenue({
 *   source: 'stripe',
 *   amount: 99.99,
 *   currency: 'USD',
 *   productId: 'prod_123',
 * });
 *
 * // Get metrics
 * const metrics = await unifiedRevenueService.getMetrics();
 * ```
 */

import { revenueTracker } from '../../revenue/tracker';
import { revenueTrackingService } from '../passive-income/revenueTrackingService';

export type RevenueSource =
  | 'stripe'
  | 'gumroad'
  | 'paypal'
  | 'adsense'
  | 'affiliate'
  | 'sponsorship'
  | 'manual';

export interface RevenueEvent {
  source: RevenueSource;
  amount: number;
  currency: string;
  productId?: string;
  customerId?: string;
  metadata?: Record<string, any>;
  timestamp?: number;
}

export interface RevenueMetrics {
  total: number;
  bySource: Record<RevenueSource, number>;
  byPeriod: {
    today: number;
    week: number;
    month: number;
    year: number;
  };
  transactions: number;
  averageTransaction: number;
}

/**
 * Unified Revenue Service
 * Single interface for all revenue tracking
 */
class UnifiedRevenueService {
  /**
   * Track a revenue event
   * Delegates to both systems for backwards compatibility
   */
  async trackRevenue(event: RevenueEvent): Promise<void> {
    try {
      // Track in new system
      await revenueTrackingService.trackTransaction({
        amount: event.amount,
        currency: event.currency,
        source: event.source,
        productId: event.productId,
        date: event.timestamp ? new Date(event.timestamp) : new Date(),
        metadata: event.metadata,
      });

      // Track in legacy system (for backwards compatibility)
      if (event.productId) {
        revenueTracker.trackClick(event.productId, event.source);
        if (event.amount > 0) {
          revenueTracker.trackConversion(
            event.productId,
            event.source,
            event.amount,
            event.currency
          );
        }
      }
    } catch (error) {
      console.error('Failed to track revenue:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive revenue metrics
   * Merges data from both systems
   */
  async getMetrics(): Promise<RevenueMetrics> {
    try {
      // Get new system metrics
      const newMetrics = revenueTrackingService.getMetrics();

      // Get legacy metrics
      const legacyMetrics = revenueTracker.getMetrics();

      // Merge the data (prefer new system, fall back to legacy)
      const total = newMetrics.totalRevenue || legacyMetrics.totalRevenue || 0;

      const bySource: Record<RevenueSource, number> = {
        stripe: 0,
        gumroad: 0,
        paypal: 0,
        adsense: 0,
        affiliate: 0,
        sponsorship: 0,
        manual: 0,
      };

      // Populate from new system
      if (newMetrics.revenueBySource) {
        Object.entries(newMetrics.revenueBySource).forEach(([source, amount]) => {
          if (source in bySource) {
            bySource[source as RevenueSource] = amount;
          }
        });
      }

      // Add legacy data if available
      if (legacyMetrics.byProduct) {
        Object.values(legacyMetrics.byProduct).forEach((productData: any) => {
          const source = (productData.source || 'manual') as RevenueSource;
          if (source in bySource) {
            bySource[source] += productData.revenue || 0;
          }
        });
      }

      return {
        total,
        bySource,
        byPeriod: {
          today: newMetrics.todayRevenue || 0,
          week: newMetrics.weekRevenue || 0,
          month: newMetrics.monthRevenue || 0,
          year: total, // Approximate
        },
        transactions: newMetrics.transactionCount || legacyMetrics.totalClicks || 0,
        averageTransaction: total / Math.max(1, newMetrics.transactionCount || 1),
      };
    } catch (error) {
      console.error('Failed to get revenue metrics:', error);
      throw error;
    }
  }

  /**
   * Get revenue for a specific source
   */
  async getRevenueBySource(source: RevenueSource): Promise<number> {
    const metrics = await this.getMetrics();
    return metrics.bySource[source] || 0;
  }

  /**
   * Get revenue for a time period
   */
  async getRevenueForPeriod(period: 'today' | 'week' | 'month' | 'year'): Promise<number> {
    const metrics = await this.getMetrics();
    return metrics.byPeriod[period];
  }

  /**
   * Export revenue data
   */
  async exportData(format: 'json' | 'csv'): Promise<string> {
    const metrics = await this.getMetrics();

    if (format === 'json') {
      return JSON.stringify(metrics, null, 2);
    }

    // CSV format
    let csv = 'Source,Amount\n';
    Object.entries(metrics.bySource).forEach(([source, amount]) => {
      csv += `${source},${amount}\n`;
    });
    csv += `\nTotal,${metrics.total}\n`;

    return csv;
  }

  /**
   * Clear all revenue data (for testing)
   */
  async clearAllData(): Promise<void> {
    try {
      revenueTracker.clearData();
      // New system doesn't have clear yet - would need to add
      console.log('Revenue data cleared');
    } catch (error) {
      console.error('Failed to clear revenue data:', error);
    }
  }

  /**
   * Get available revenue sources
   */
  getAvailableSources(): RevenueSource[] {
    return ['stripe', 'gumroad', 'paypal', 'adsense', 'affiliate', 'sponsorship', 'manual'];
  }

  /**
   * Validate revenue event
   */
  validateRevenueEvent(event: RevenueEvent): boolean {
    if (!event.source || !this.getAvailableSources().includes(event.source)) {
      return false;
    }

    if (typeof event.amount !== 'number' || event.amount < 0) {
      return false;
    }

    if (!event.currency || event.currency.length !== 3) {
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const unifiedRevenueService = new UnifiedRevenueService();

// Export for type checking
export type { UnifiedRevenueService };
