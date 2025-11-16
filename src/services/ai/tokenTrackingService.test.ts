import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tokenTrackingService } from './tokenTrackingService';

// Mock logger
vi.mock('../logging/loggerService', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

describe('TokenTrackingService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('recordUsage', () => {
    it('should record token usage', () => {
      tokenTrackingService.recordUsage('gemini', 100, 0.001, 'gemini-pro');
      
      const entries = tokenTrackingService.getAllEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        provider: 'gemini',
        tokens: 100,
        cost: 0.001,
        model: 'gemini-pro',
      });
      expect(entries[0].timestamp).toBeGreaterThan(0);
    });

    it('should record usage without cost or model', () => {
      tokenTrackingService.recordUsage('ollama', 50);
      
      const entries = tokenTrackingService.getAllEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        provider: 'ollama',
        tokens: 50,
      });
      expect(entries[0].cost).toBeUndefined();
      expect(entries[0].model).toBeUndefined();
    });

    it('should limit entries to maxEntries', () => {
      // Record more than maxEntries (10000)
      for (let i = 0; i < 10001; i++) {
        tokenTrackingService.recordUsage('test', 1);
      }
      
      const entries = tokenTrackingService.getAllEntries();
      expect(entries.length).toBeLessThanOrEqual(10000);
    });
  });

  describe('getUsageForRange', () => {
    it('should return entries within date range', () => {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;
      
      // Create entries with specific timestamps
      localStorage.setItem('llm-token-usage', JSON.stringify([
        { provider: 'gemini', tokens: 100, timestamp: now },
        { provider: 'ollama', tokens: 50, timestamp: oneDayAgo },
        { provider: 'lm-studio', tokens: 200, timestamp: twoDaysAgo },
      ]));
      
      const startDate = new Date(oneDayAgo - 1000);
      const endDate = new Date(now + 1000);
      
      const entries = tokenTrackingService.getUsageForRange(startDate, endDate);
      expect(entries).toHaveLength(2);
      expect(entries.map(e => e.provider)).toContain('gemini');
      expect(entries.map(e => e.provider)).toContain('ollama');
    });

    it('should return empty array when no entries in range', () => {
      const now = Date.now();
      const future = now + 24 * 60 * 60 * 1000;
      
      localStorage.setItem('llm-token-usage', JSON.stringify([
        { provider: 'gemini', tokens: 100, timestamp: now },
      ]));
      
      const startDate = new Date(future);
      const endDate = new Date(future + 1000);
      
      const entries = tokenTrackingService.getUsageForRange(startDate, endDate);
      expect(entries).toHaveLength(0);
    });
  });

  describe('getStatsByProvider', () => {
    it('should aggregate stats by provider', () => {
      const now = Date.now();
      localStorage.setItem('llm-token-usage', JSON.stringify([
        { provider: 'gemini', tokens: 100, cost: 0.001, timestamp: now },
        { provider: 'gemini', tokens: 200, cost: 0.002, timestamp: now + 1000 },
        { provider: 'ollama', tokens: 50, timestamp: now + 2000 },
      ]));
      
      const startDate = new Date(now - 1000);
      const endDate = new Date(now + 3000);
      
      const stats = tokenTrackingService.getStatsByProvider(startDate, endDate);
      expect(stats).toHaveLength(2);
      
      const geminiStats = stats.find(s => s.provider === 'gemini');
      expect(geminiStats).toBeDefined();
      expect(geminiStats?.totalTokens).toBe(300);
      expect(geminiStats?.totalCost).toBe(0.003);
      expect(geminiStats?.count).toBe(2);
      
      const ollamaStats = stats.find(s => s.provider === 'ollama');
      expect(ollamaStats).toBeDefined();
      expect(ollamaStats?.totalTokens).toBe(50);
      expect(ollamaStats?.totalCost).toBe(0);
      expect(ollamaStats?.count).toBe(1);
    });
  });

  describe('getAllEntries', () => {
    it('should return empty array when no entries', () => {
      const entries = tokenTrackingService.getAllEntries();
      expect(entries).toEqual([]);
    });

    it('should return all entries', () => {
      localStorage.setItem('llm-token-usage', JSON.stringify([
        { provider: 'gemini', tokens: 100, timestamp: Date.now() },
        { provider: 'ollama', tokens: 50, timestamp: Date.now() },
      ]));
      
      const entries = tokenTrackingService.getAllEntries();
      expect(entries).toHaveLength(2);
    });

    it('should handle corrupted data gracefully', () => {
      localStorage.setItem('llm-token-usage', 'invalid json');
      
      const entries = tokenTrackingService.getAllEntries();
      expect(entries).toEqual([]);
    });
  });
});

