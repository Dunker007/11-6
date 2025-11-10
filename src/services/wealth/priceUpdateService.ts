/**
 * Real-Time Price Update Service
 * 
 * Manages WebSocket connections for real-time price updates
 * Supports different update intervals for different asset types:
 * - Crypto: 1 second
 * - Stocks: 15 seconds
 * - ETFs: 1 minute
 */

import { wealthMarketDataService } from './marketDataService';
import type { Asset } from '@/types/wealth';

export type PriceUpdateInterval = '1s' | '15s' | '1m' | '5m' | '15m' | '1h';

export interface PriceUpdate {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume?: number;
  marketCap?: number;
  timestamp: Date;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  direction: 'above' | 'below';
  triggered: boolean;
  triggeredAt?: Date;
  callback?: (alert: PriceAlert, update: PriceUpdate) => void;
}

class PriceUpdateService {
  private static instance: PriceUpdateService;
  private websockets: Map<string, WebSocket> = new Map();
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  private subscribers: Map<string, Set<(update: PriceUpdate) => void>> = new Map();
  private alerts: Map<string, PriceAlert[]> = new Map();
  private isActive = false;

  // Update intervals by asset type
  private readonly INTERVALS: Record<string, PriceUpdateInterval> = {
    crypto: '1s',
    stock: '15s',
    etf: '1m',
    mutual_fund: '1m',
    bond: '5m',
    other: '15m',
  };

  private constructor() {}

  static getInstance(): PriceUpdateService {
    if (!PriceUpdateService.instance) {
      PriceUpdateService.instance = new PriceUpdateService();
    }
    return PriceUpdateService.instance;
  }

  /**
   * Start real-time price updates for a symbol
   */
  subscribe(symbol: string, assetType: string, callback: (update: PriceUpdate) => void): () => void {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }
    this.subscribers.get(symbol)!.add(callback);

    // Determine update interval based on asset type
    const interval = this.INTERVALS[assetType] || this.INTERVALS.other;
    const intervalMs = this.intervalToMs(interval);

    // Start polling if not already started
    if (!this.updateIntervals.has(symbol)) {
      this.startPolling(symbol, intervalMs);
    }

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(symbol);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.stopPolling(symbol);
          this.subscribers.delete(symbol);
        }
      }
    };
  }

  /**
   * Start polling for price updates
   */
  private startPolling(symbol: string, intervalMs: number): void {
    // Initial fetch
    this.fetchPrice(symbol);

    // Set up interval
    const interval = setInterval(() => {
      this.fetchPrice(symbol);
    }, intervalMs);

    this.updateIntervals.set(symbol, interval);
  }

  /**
   * Stop polling for a symbol
   */
  private stopPolling(symbol: string): void {
    const interval = this.updateIntervals.get(symbol);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(symbol);
    }

    const ws = this.websockets.get(symbol);
    if (ws) {
      ws.close();
      this.websockets.delete(symbol);
    }
  }

  /**
   * Fetch current price and notify subscribers
   */
  private async fetchPrice(symbol: string): Promise<void> {
    try {
      const priceData = await wealthMarketDataService.getRealTimePrice(symbol);
      
      const update: PriceUpdate = {
        symbol,
        price: priceData.price,
        change24h: priceData.change24h,
        changePercent24h: priceData.changePercent24h,
        volume: priceData.volume,
        marketCap: priceData.marketCap,
        timestamp: priceData.lastUpdated,
      };

      // Notify subscribers
      const subscribers = this.subscribers.get(symbol);
      if (subscribers) {
        subscribers.forEach(callback => {
          try {
            callback(update);
          } catch (error) {
            console.error(`Error in price update callback for ${symbol}:`, error);
          }
        });
      }

      // Check alerts
      this.checkAlerts(symbol, update);
    } catch (error) {
      console.error(`Failed to fetch price for ${symbol}:`, error);
    }
  }

  /**
   * Add a price alert
   */
  addAlert(alert: Omit<PriceAlert, 'id' | 'triggered'>): string {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullAlert: PriceAlert = {
      ...alert,
      id: alertId,
      triggered: false,
    };

    if (!this.alerts.has(alert.symbol)) {
      this.alerts.set(alert.symbol, []);
    }
    this.alerts.get(alert.symbol)!.push(fullAlert);

    // Ensure we're polling this symbol
    if (!this.updateIntervals.has(alert.symbol)) {
      // Default to 15s interval for alerts
      this.startPolling(alert.symbol, 15000);
    }

    return alertId;
  }

  /**
   * Remove a price alert
   */
  removeAlert(alertId: string): boolean {
    for (const [symbol, alerts] of this.alerts.entries()) {
      const index = alerts.findIndex(a => a.id === alertId);
      if (index >= 0) {
        alerts.splice(index, 1);
        if (alerts.length === 0) {
          this.alerts.delete(symbol);
        }
        return true;
      }
    }
    return false;
  }

  /**
   * Get all alerts for a symbol
   */
  getAlerts(symbol: string): PriceAlert[] {
    return this.alerts.get(symbol) || [];
  }

  /**
   * Check if any alerts should be triggered
   */
  private checkAlerts(symbol: string, update: PriceUpdate): void {
    const alerts = this.alerts.get(symbol);
    if (!alerts) return;

    alerts.forEach(alert => {
      if (alert.triggered) return;

      const shouldTrigger =
        (alert.direction === 'above' && update.price >= alert.targetPrice) ||
        (alert.direction === 'below' && update.price <= alert.targetPrice);

      if (shouldTrigger) {
        alert.triggered = true;
        alert.triggeredAt = new Date();

        if (alert.callback) {
          try {
            alert.callback(alert, update);
          } catch (error) {
            console.error(`Error in alert callback for ${alert.id}:`, error);
          }
        }

        // Emit alert event (could be used for notifications)
        this.emitAlertTriggered(alert, update);
      }
    });
  }

  /**
   * Emit alert triggered event (for notifications)
   */
  private emitAlertTriggered(alert: PriceAlert, update: PriceUpdate): void {
    // This could dispatch a custom event or call a notification service
    const event = new CustomEvent('priceAlertTriggered', {
      detail: { alert, update },
    });
    window.dispatchEvent(event);
  }

  /**
   * Convert interval string to milliseconds
   */
  private intervalToMs(interval: PriceUpdateInterval): number {
    const multipliers: Record<string, number> = {
      '1s': 1000,
      '15s': 15000,
      '1m': 60000,
      '5m': 300000,
      '15m': 900000,
      '1h': 3600000,
    };
    return multipliers[interval] || 60000;
  }

  /**
   * Start the service (called when Wealth Lab is opened)
   */
  start(): void {
    this.isActive = true;
  }

  /**
   * Stop the service (called when Wealth Lab is closed)
   */
  stop(): void {
    this.isActive = false;
    
    // Clear all intervals
    this.updateIntervals.forEach(interval => clearInterval(interval));
    this.updateIntervals.clear();

    // Close all WebSocket connections
    this.websockets.forEach(ws => ws.close());
    this.websockets.clear();

    // Clear subscribers
    this.subscribers.clear();
  }

  /**
   * Get active subscriptions count
   */
  getActiveSubscriptions(): number {
    return this.subscribers.size;
  }

  /**
   * Get active alerts count
   */
  getActiveAlerts(): number {
    let count = 0;
    this.alerts.forEach(alerts => {
      count += alerts.filter(a => !a.triggered).length;
    });
    return count;
  }
}

export const priceUpdateService = PriceUpdateService.getInstance();

