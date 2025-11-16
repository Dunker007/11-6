import type { Coin, MarketData } from '@/types/crypto';

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const CACHE_TTL = 60000; // 1 minute cache

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class MarketDataService {
  private static instance: MarketDataService;
  private cache: Map<string, CacheEntry<any>> = new Map();

  private constructor() {}

  static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService();
    }
    return MarketDataService.instance;
  }

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const age = Date.now() - entry.timestamp;
    if (age > CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private async fetchWithCache<T>(key: string, url: string): Promise<T> {
    const cached = this.getCached<T>(key);
    if (cached) return cached;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      const data = await response.json();
      this.setCache(key, data);
      return data;
    } catch (error) {
      console.error(`Failed to fetch ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get top coins by market cap
   */
  async getTopCoins(limit: number = 100): Promise<Coin[]> {
    const url = `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d`;
    return this.fetchWithCache<Coin[]>(`top_coins_${limit}`, url);
  }

  /**
   * Get trending coins
   */
  async getTrendingCoins(): Promise<Coin[]> {
    try {
      const url = `${COINGECKO_API_BASE}/search/trending`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      const data = await response.json();
      
      // Extract coin IDs from trending data
      const coinIds = data.coins.map((coin: any) => coin.item.id).join(',');
      
      // Fetch full coin data
      const coinsUrl = `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d`;
      return this.fetchWithCache<Coin[]>(`trending_coins`, coinsUrl);
    } catch (error) {
      console.error('Failed to fetch trending coins:', error);
      throw error;
    }
  }

  /**
   * Get coin price history for charts
   */
  async getPriceHistory(coinId: string, days: number = 7): Promise<number[][]> {
    const url = `${COINGECKO_API_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
    try {
      const data = await this.fetchWithCache<any>(`price_history_${coinId}_${days}`, url);
      return data.prices || [];
    } catch (error) {
      console.error(`Failed to fetch price history for ${coinId}:`, error);
      return [];
    }
  }

  /**
   * Get market data summary
   */
  async getMarketData(): Promise<MarketData> {
    try {
      const [coins, trending] = await Promise.all([
        this.getTopCoins(100),
        this.getTrendingCoins(),
      ]);

      return {
        coins,
        trending,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      throw error;
    }
  }

  /**
   * Search for coins
   */
  async searchCoins(query: string): Promise<Coin[]> {
    try {
      const url = `${COINGECKO_API_BASE}/search?query=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      const data = await response.json();
      
      if (!data.coins || data.coins.length === 0) {
        return [];
      }

      // Get full coin data for first 10 results
      const coinIds = data.coins.slice(0, 10).map((coin: any) => coin.id).join(',');
      const coinsUrl = `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&per_page=10&page=1&sparkline=false`;
      
      return this.fetchWithCache<Coin[]>(`search_${query}`, coinsUrl);
    } catch (error) {
      console.error(`Failed to search coins:`, error);
      return [];
    }
  }

  /**
   * Get global market metrics
   */
  async getGlobalMetrics(): Promise<{
    totalMarketCap: number;
    totalVolume: number;
    bitcoinDominance: number;
    ethereumDominance: number;
  }> {
    try {
      const url = `${COINGECKO_API_BASE}/global`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      const data = await response.json();
      
      return {
        totalMarketCap: data.data.total_market_cap?.usd || 0,
        totalVolume: data.data.total_volume?.usd || 0,
        bitcoinDominance: data.data.market_cap_percentage?.btc || 0,
        ethereumDominance: data.data.market_cap_percentage?.eth || 0,
      };
    } catch (error) {
      console.error('Failed to fetch global metrics:', error);
      return {
        totalMarketCap: 0,
        totalVolume: 0,
        bitcoinDominance: 0,
        ethereumDominance: 0,
      };
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const marketDataService = MarketDataService.getInstance();

