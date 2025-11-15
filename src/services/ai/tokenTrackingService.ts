/**
 * Token Tracking Service
 * Tracks token usage by provider and date for cost analysis
 */

import { logger } from '../logging/loggerService';

export interface TokenUsageEntry {
  provider: string;
  tokens: number;
  cost?: number;
  timestamp: number;
  model?: string;
}

export interface TokenUsageStats {
  provider: string;
  totalTokens: number;
  totalCost: number;
  count: number;
}

class TokenTrackingService {
  private storageKey = 'llm-token-usage';
  private maxEntries = 10000; // Keep last 10k entries

  /**
   * Record token usage for a provider
   */
  recordUsage(provider: string, tokens: number, cost?: number, model?: string): void {
    try {
      const entry: TokenUsageEntry = {
        provider,
        tokens,
        cost,
        timestamp: Date.now(),
        model,
      };

      const entries = this.getAllEntries();
      entries.push(entry);

      // Keep only recent entries
      if (entries.length > this.maxEntries) {
        entries.splice(0, entries.length - this.maxEntries);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(entries));
    } catch (error) {
      logger.warn('Failed to record token usage:', { error });
    }
  }

  /**
   * Get all token usage entries
   */
  getAllEntries(): TokenUsageEntry[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return [];
      return JSON.parse(data) as TokenUsageEntry[];
    } catch (error) {
      logger.warn('Failed to load token usage:', { error });
      return [];
    }
  }

  /**
   * Get token usage for a date range
   */
  getUsageForRange(startDate: Date, endDate: Date): TokenUsageEntry[] {
    const entries = this.getAllEntries();
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    return entries.filter(
      (entry) => entry.timestamp >= startTime && entry.timestamp <= endTime
    );
  }

  /**
   * Get usage stats by provider for a date range
   */
  getStatsByProvider(startDate: Date, endDate: Date): TokenUsageStats[] {
    const entries = this.getUsageForRange(startDate, endDate);
    const statsMap = new Map<string, TokenUsageStats>();

    entries.forEach((entry) => {
      const existing = statsMap.get(entry.provider) || {
        provider: entry.provider,
        totalTokens: 0,
        totalCost: 0,
        count: 0,
      };

      existing.totalTokens += entry.tokens || 0;
      existing.totalCost += entry.cost || 0;
      existing.count += 1;

      statsMap.set(entry.provider, existing);
    });

    return Array.from(statsMap.values());
  }

  /**
   * Get daily usage for a date range
   */
  getDailyUsage(startDate: Date, endDate: Date): Map<string, { tokens: number; cost: number }> {
    const entries = this.getUsageForRange(startDate, endDate);
    const dailyMap = new Map<string, { tokens: number; cost: number }>();

    entries.forEach((entry) => {
      const date = new Date(entry.timestamp).toISOString().split('T')[0];
      const existing = dailyMap.get(date) || { tokens: 0, cost: 0 };

      existing.tokens += entry.tokens || 0;
      existing.cost += entry.cost || 0;

      dailyMap.set(date, existing);
    });

    return dailyMap;
  }

  /**
   * Get total usage for a date range
   */
  getTotalUsage(startDate: Date, endDate: Date): { tokens: number; cost: number } {
    const entries = this.getUsageForRange(startDate, endDate);

    return entries.reduce(
      (acc, entry) => ({
        tokens: acc.tokens + (entry.tokens || 0),
        cost: acc.cost + (entry.cost || 0),
      }),
      { tokens: 0, cost: 0 }
    );
  }

  /**
   * Clear old entries (older than specified days)
   */
  clearOldEntries(daysToKeep: number = 90): void {
    try {
      const entries = this.getAllEntries();
      const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
      const filtered = entries.filter((entry) => entry.timestamp >= cutoffTime);

      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    } catch (error) {
      logger.warn('Failed to clear old token usage entries:', { error });
    }
  }

  /**
   * Clear all token usage data
   */
  clearAll(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      logger.warn('Failed to clear token usage:', { error });
    }
  }
}

export const tokenTrackingService = new TokenTrackingService();

