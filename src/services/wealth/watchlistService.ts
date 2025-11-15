/**
 * Watchlist Service
 * 
 * Manages watchlists and price/news alerts
 */

import { wealthMarketDataService } from './marketDataService';
import type { Watchlist, Alert } from '@/types/wealth';

const WATCHLISTS_KEY = 'dlx_wealth_watchlists';
const ALERTS_KEY = 'dlx_wealth_alerts';

class WatchlistService {
  private static instance: WatchlistService;
  private watchlists: Map<string, Watchlist> = new Map();
  private alerts: Map<string, Alert> = new Map();

  private constructor() {
    this.loadData();
    this.startAlertChecker();
  }

  static getInstance(): WatchlistService {
    if (!WatchlistService.instance) {
      WatchlistService.instance = new WatchlistService();
    }
    return WatchlistService.instance;
  }

  private loadData(): void {
    try {
      const watchlistsData = localStorage.getItem(WATCHLISTS_KEY);
      if (watchlistsData) {
        const watchlists: Watchlist[] = JSON.parse(watchlistsData);
        watchlists.forEach(watchlist => {
          watchlist.createdAt = new Date(watchlist.createdAt);
          watchlist.updatedAt = new Date(watchlist.updatedAt);
          watchlist.alerts.forEach(alert => {
            alert.createdAt = new Date(alert.createdAt);
            if (alert.priceAlert?.triggeredAt) {
              alert.priceAlert.triggeredAt = new Date(alert.priceAlert.triggeredAt);
            }
            if (alert.newsAlert?.triggeredAt) {
              alert.newsAlert.triggeredAt = new Date(alert.newsAlert.triggeredAt);
            }
          });
          this.watchlists.set(watchlist.id, watchlist);
        });
      }

      const alertsData = localStorage.getItem(ALERTS_KEY);
      if (alertsData) {
        const alerts: Alert[] = JSON.parse(alertsData);
        alerts.forEach(alert => {
          alert.createdAt = new Date(alert.createdAt);
          if (alert.priceAlert?.triggeredAt) {
            alert.priceAlert.triggeredAt = new Date(alert.priceAlert.triggeredAt);
          }
          if (alert.newsAlert?.triggeredAt) {
            alert.newsAlert.triggeredAt = new Date(alert.newsAlert.triggeredAt);
          }
          this.alerts.set(alert.id, alert);
        });
      }
    } catch (error) {
      console.error('Failed to load watchlists:', error);
    }
  }

  private saveWatchlists(): void {
    try {
      localStorage.setItem(WATCHLISTS_KEY, JSON.stringify(Array.from(this.watchlists.values())));
    } catch (error) {
      console.error('Failed to save watchlists:', error);
    }
  }

  private saveAlerts(): void {
    try {
      localStorage.setItem(ALERTS_KEY, JSON.stringify(Array.from(this.alerts.values())));
    } catch (error) {
      console.error('Failed to save alerts:', error);
    }
  }

  createWatchlist(name: string): Watchlist {
    const watchlist: Watchlist = {
      id: crypto.randomUUID(),
      name,
      symbols: [],
      alerts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.watchlists.set(watchlist.id, watchlist);
    this.saveWatchlists();
    return watchlist;
  }

  addToWatchlist(watchlistId: string, symbol: string): boolean {
    const watchlist = this.watchlists.get(watchlistId);
    if (!watchlist) return false;

    if (!watchlist.symbols.includes(symbol)) {
      watchlist.symbols.push(symbol);
      watchlist.updatedAt = new Date();
      this.saveWatchlists();
    }

    return true;
  }

  removeFromWatchlist(watchlistId: string, symbol: string): boolean {
    const watchlist = this.watchlists.get(watchlistId);
    if (!watchlist) return false;

    const index = watchlist.symbols.indexOf(symbol);
    if (index !== -1) {
      watchlist.symbols.splice(index, 1);
      watchlist.updatedAt = new Date();
      this.saveWatchlists();
    }

    return true;
  }

  async getWatchlistAsync(watchlistId: string): Promise<Watchlist | null> {
    const watchlist = this.watchlists.get(watchlistId);
    if (!watchlist) return null;

    // Update prices for symbols (in production, batch fetch)
    // For now, return as-is
    return watchlist;
  }

  setPriceAlert(
    symbol: string,
    targetPrice: number,
    direction: 'above' | 'below'
  ): Alert {
    const alert: Alert = {
      id: crypto.randomUUID(),
      symbol,
      type: 'price',
      priceAlert: {
        targetPrice,
        direction,
        triggered: false,
      },
      createdAt: new Date(),
    };

    this.alerts.set(alert.id, alert);
    this.saveAlerts();
    return alert;
  }

  setNewsAlert(symbol: string, keywords: string[]): Alert {
    const alert: Alert = {
      id: crypto.randomUUID(),
      symbol,
      type: 'news',
      newsAlert: {
        keywords,
        triggered: false,
      },
      createdAt: new Date(),
    };

    this.alerts.set(alert.id, alert);
    this.saveAlerts();
    return alert;
  }

  async checkAlerts(): Promise<Alert[]> {
    const triggeredAlerts: Alert[] = [];

    for (const alert of this.alerts.values()) {
      if (alert.type === 'price' && alert.priceAlert && !alert.priceAlert.triggered) {
        try {
          const priceData = await wealthMarketDataService.getRealTimePrice(alert.symbol);
          const currentPrice = priceData.price;
          const shouldTrigger = 
            (alert.priceAlert.direction === 'above' && currentPrice >= alert.priceAlert.targetPrice) ||
            (alert.priceAlert.direction === 'below' && currentPrice <= alert.priceAlert.targetPrice);

          if (shouldTrigger) {
            alert.priceAlert.triggered = true;
            alert.priceAlert.triggeredAt = new Date();
            triggeredAlerts.push(alert);
            this.saveAlerts();
          }
        } catch (error) {
          console.error(`Failed to check price alert for ${alert.symbol}:`, error);
        }
      }

      // News alerts would be checked when news is fetched
    }

    return triggeredAlerts;
  }

  getWatchlist(id: string): Watchlist | undefined {
    return this.watchlists.get(id);
  }

  getWatchlists(): Watchlist[] {
    return Array.from(this.watchlists.values());
  }

  updateWatchlist(id: string, updates: Partial<Watchlist>): Watchlist | null {
    const watchlist = this.watchlists.get(id);
    if (!watchlist) return null;

    Object.assign(watchlist, updates);
    watchlist.updatedAt = new Date();
    this.saveWatchlists();
    return watchlist;
  }

  deleteWatchlist(id: string): boolean {
    const deleted = this.watchlists.delete(id);
    if (deleted) {
      this.saveWatchlists();
    }
    return deleted;
  }

  getAlert(id: string): Alert | undefined {
    return this.alerts.get(id);
  }

  getAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  deleteAlert(id: string): boolean {
    const deleted = this.alerts.delete(id);
    if (deleted) {
      this.saveAlerts();
    }
    return deleted;
  }

  private startAlertChecker(): void {
    // Check alerts every 60 seconds
    setInterval(() => {
      this.checkAlerts().then(triggered => {
        if (triggered.length > 0) {
          // In production, emit events or show notifications
          console.log(`Triggered ${triggered.length} alerts`);
        }
      });
    }, 60000);
  }
}

export const watchlistService = WatchlistService.getInstance();

