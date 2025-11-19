/**
 * Unified Market Data Service
 *
 * Integrates multiple data sources:
 * - CoinGecko API (Crypto)
 * - Yahoo Finance API (Stocks, ETFs)
 * - News APIs (NewsAPI.org, Alpha Vantage)
 */

import type { Coin, MarketData } from '@/types/crypto';
import type { CryptoETF, NewsArticle, DividendPayment } from '@/types/wealth';
import type { YahooFinanceResponse, NewsAPIResponse, NewsAPIArticle } from '@/types/marketData';
import { logger } from '../logging/loggerService';

// --- Constants ---
const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const YAHOO_FINANCE_API_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';
const NEWS_API_BASE = 'https://newsapi.org/v2';

const CACHE_TTL_CRYPTO = 60000; // 1 minute
const CACHE_TTL_STOCKS = 30000; // 30 seconds
const CACHE_TTL_NEWS = 300000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class MarketDataService {
  private static instance: MarketDataService;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private rateLimitQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;

  private constructor() { }

  static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService();
    }
    return MarketDataService.instance;
  }

  // --- Caching & Rate Limiting ---

  private getCached<T>(key: string, ttl: number): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > ttl) {
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

  private async rateLimitedFetch<T>(key: string, url: string, ttl: number): Promise<T> {
    const cached = this.getCached<T>(key, ttl);
    if (cached) return cached;

    return new Promise((resolve, reject) => {
      this.rateLimitQueue.push(async () => {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          const data = await response.json();
          this.setCache(key, data);
          resolve(data);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.rateLimitQueue.length === 0) return;

    this.isProcessingQueue = true;
    while (this.rateLimitQueue.length > 0) {
      const task = this.rateLimitQueue.shift();
      if (task) {
        await task();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    this.isProcessingQueue = false;
  }

  // ==================================================================================
  // 🪙 CRYPTO DATA (CoinGecko)
  // ==================================================================================

  async getTopCoins(limit: number = 100): Promise<Coin[]> {
    const url = `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d`;
    return this.rateLimitedFetch<Coin[]>(`top_coins_${limit}`, url, CACHE_TTL_CRYPTO);
  }

  async getTrendingCoins(): Promise<Coin[]> {
    try {
      const url = `${COINGECKO_API_BASE}/search/trending`;
      // Direct fetch for trending to get IDs first
      const response = await fetch(url);
      if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
      const data = await response.json();

      const coinIds = data.coins.map((coin: any) => coin.item.id).join(',');
      const coinsUrl = `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d`;

      return this.rateLimitedFetch<Coin[]>(`trending_coins`, coinsUrl, CACHE_TTL_CRYPTO);
    } catch (error) {
      logger.error('Failed to fetch trending coins:', { error });
      throw error;
    }
  }

  async getPriceHistory(coinId: string, days: number = 7): Promise<number[][]> {
    const url = `${COINGECKO_API_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
    try {
      const data = await this.rateLimitedFetch<any>(`price_history_${coinId}_${days}`, url, CACHE_TTL_CRYPTO);
      return data.prices || [];
    } catch (error) {
      logger.error(`Failed to fetch price history for ${coinId}:`, { error });
      return [];
    }
  }

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
      logger.error('Failed to fetch market data:', { error });
      throw error;
    }
  }

  async searchCoins(query: string): Promise<Coin[]> {
    try {
      const url = `${COINGECKO_API_BASE}/search?query=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
      const data = await response.json();

      if (!data.coins || data.coins.length === 0) return [];

      const coinIds = data.coins.slice(0, 10).map((coin: any) => coin.id).join(',');
      const coinsUrl = `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&per_page=10&page=1&sparkline=false`;

      return this.rateLimitedFetch<Coin[]>(`search_${query}`, coinsUrl, CACHE_TTL_CRYPTO);
    } catch (error) {
      logger.error(`Failed to search coins:`, { error });
      return [];
    }
  }

  // ==================================================================================
  // 📈 STOCK & ETF DATA (Yahoo Finance)
  // ==================================================================================

  async getRealTimePrice(symbol: string): Promise<{
    price: number;
    change24h: number;
    changePercent24h: number;
    volume?: number;
    marketCap?: number;
    lastUpdated: Date;
  }> {
    // Check if it's a crypto symbol first
    const cryptoPattern = /^(BTC|ETH|USDT|BNB|SOL|ADA|XRP|DOT|DOGE|AVAX|SHIB|MATIC|LTC|UNI|LINK|ATOM|ETC|XLM|ALGO|VET|ICP|FIL|TRX|EOS|AAVE|MKR|GRT|SAND|MANA|AXS|THETA|XTZ|FLOW|CHZ|ENJ|BAT|ZEC|DASH|ZRX|COMP|SNX|YFI|CRV|1INCH|SUSHI|ALPHA|REN|KNC|BAND|OCEAN|NMR|COTI|ANKR|BAL|STORJ|OMG|PAXG|SKL)$/i;

    if (cryptoPattern.test(symbol)) {
      try {
        const coins = await this.getTopCoins(250);
        const coin = coins.find((c) => c.symbol.toUpperCase() === symbol.toUpperCase());
        if (coin) {
          return {
            price: coin.current_price,
            change24h: coin.price_change_24h || 0,
            changePercent24h: coin.price_change_percentage_24h || 0,
            volume: coin.total_volume,
            marketCap: coin.market_cap,
            lastUpdated: new Date(),
          };
        }
      } catch (error) {
        logger.error(`Failed to fetch crypto price for ${symbol}`, { error });
      }
    }

    // Fallback to Yahoo Finance
    try {
      const url = `${YAHOO_FINANCE_API_BASE}/${symbol}?interval=1d&range=1d`;
      const data = await this.rateLimitedFetch<YahooFinanceResponse>(`price_${symbol}`, url, CACHE_TTL_STOCKS);

      if (data?.chart?.result?.[0]) {
        const result = data.chart.result[0];
        const quote = result.meta;
        const regularMarketPrice = quote.regularMarketPrice || quote.previousClose || 0;
        const regularMarketChange = quote.regularMarketChange || 0;
        const regularMarketChangePercent = quote.regularMarketChangePercent || 0;

        return {
          price: regularMarketPrice,
          change24h: regularMarketChange,
          changePercent24h: regularMarketChangePercent,
          volume: quote.regularMarketVolume,
          marketCap: quote.marketCap,
          lastUpdated: new Date(),
        };
      }
    } catch (error) {
      logger.error(`Failed to fetch price for ${symbol}`, { error });
    }

    throw new Error(`Unable to fetch price for ${symbol}`);
  }

  async getHistoricalData(
    symbol: string,
    period: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | '10y' | 'ytd' | 'max' = '1y'
  ): Promise<{
    timestamp: number[];
    open: number[];
    high: number[];
    low: number[];
    close: number[];
    volume: number[];
  }> {
    const range = period;
    const interval = period === '1d' || period === '5d' ? '5m' : period === '1mo' ? '1d' : '1d';

    try {
      const url = `${YAHOO_FINANCE_API_BASE}/${symbol}?interval=${interval}&range=${range}`;
      const data = await this.rateLimitedFetch<YahooFinanceResponse>(`history_${symbol}_${period}`, url, CACHE_TTL_STOCKS * 2);

      if (data?.chart?.result?.[0]) {
        const result = data.chart.result[0];
        const timestamps = result.timestamp || [];
        const indicators = result.indicators?.quote?.[0] || {};

        return {
          timestamp: timestamps,
          open: indicators.open || [],
          high: indicators.high || [],
          low: indicators.low || [],
          close: indicators.close || [],
          volume: indicators.volume || [],
        };
      }
    } catch (error) {
      logger.error(`Failed to fetch historical data for ${symbol}`, { error });
    }

    return {
      timestamp: [],
      open: [],
      high: [],
      low: [],
      close: [],
      volume: [],
    };
  }

  async searchAssets(query: string): Promise<Array<{
    symbol: string;
    name: string;
    type: 'stock' | 'etf' | 'crypto';
    exchange?: string;
  }>> {
    const results: Array<{ symbol: string; name: string; type: 'stock' | 'etf' | 'crypto'; exchange?: string }> = [];

    try {
      const cryptoResults = await this.searchCoins(query);
      cryptoResults.forEach((coin) => {
        results.push({
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          type: 'crypto',
        });
      });
    } catch (error) {
      logger.error('Failed to search crypto', { error });
    }

    return results.slice(0, 20);
  }

  async getAssetDetails(symbol: string): Promise<{
    symbol: string;
    name: string;
    type: 'stock' | 'etf' | 'crypto';
    description?: string;
    sector?: string;
    industry?: string;
    logoUrl?: string;
    website?: string;
  }> {
    try {
      const coins = await this.getTopCoins(250);
      const coin = coins.find((c) => c.symbol.toUpperCase() === symbol.toUpperCase());
      if (coin) {
        return {
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          type: 'crypto',
          description: `Cryptocurrency: ${coin.name}`,
          logoUrl: coin.image,
        };
      }
    } catch (error) {
      logger.error(`Failed to get crypto details for ${symbol}`, { error });
    }

    return {
      symbol,
      name: symbol,
      type: 'stock',
    };
  }

  // ==================================================================================
  // 📰 NEWS & EVENTS
  // ==================================================================================

  async getMarketNews(symbols?: string[], limit: number = 20): Promise<NewsArticle[]> {
    const articles: NewsArticle[] = [];
    const apiKey = ''; // Would come from API key management

    if (!apiKey) {
      return this.getMockNews(symbols, limit);
    }

    try {
      const query = symbols && symbols.length > 0 ? symbols.join(' OR ') : 'finance OR stock OR crypto';
      const url = `${NEWS_API_BASE}/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=${limit}&language=en`;

      const data = await this.rateLimitedFetch<NewsAPIResponse>(`news_${query}_${limit}`, url, CACHE_TTL_NEWS);

      if (data?.articles) {
        data.articles.forEach((article: NewsAPIArticle) => {
          articles.push({
            id: crypto.randomUUID(),
            title: article.title,
            summary: article.description || '',
            content: article.content,
            source: article.source.name,
            sourceUrl: article.url,
            publishedAt: new Date(article.publishedAt),
            tags: [],
            sentiment: 'neutral',
            relatedAssets: symbols || [],
            impactScore: 50,
            imageUrl: article.urlToImage,
          });
        });
      }
    } catch (error) {
      logger.error('Failed to fetch market news', { error });
      return this.getMockNews(symbols, limit);
    }

    return articles;
  }

  private getMockNews(symbols?: string[], limit: number = 20): NewsArticle[] {
    const sources = ['Yahoo Finance', 'Seeking Alpha', 'Bloomberg', 'Reuters', 'CoinDesk'];
    const articles: NewsArticle[] = [];

    for (let i = 0; i < limit; i++) {
      articles.push({
        id: crypto.randomUUID(),
        title: `Market Update ${i + 1}`,
        summary: `Latest market news and analysis${symbols ? ` related to ${symbols.join(', ')}` : ''}`,
        source: sources[i % sources.length],
        sourceUrl: `https://example.com/news/${i}`,
        publishedAt: new Date(Date.now() - i * 3600000),
        tags: symbols || [],
        sentiment: i % 3 === 0 ? 'positive' : i % 3 === 1 ? 'negative' : 'neutral',
        relatedAssets: symbols || [],
        impactScore: Math.floor(Math.random() * 100),
      });
    }

    return articles;
  }

  async getDividendHistory(symbol: string, startDate?: Date, endDate?: Date): Promise<DividendPayment[]> {
    const dividends: DividendPayment[] = [];

    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5y&events=div`;
      const data = await this.rateLimitedFetch<YahooFinanceResponse>(`dividends_${symbol}`, url, CACHE_TTL_NEWS);

      if (data?.chart?.result?.[0]?.events?.dividends) {
        const dividendEvents = data.chart.result[0].events.dividends;

        Object.entries(dividendEvents).forEach(([timestamp, div]) => {
          const date = new Date(parseInt(timestamp) * 1000);

          if (startDate && date < startDate) return;
          if (endDate && date > endDate) return;

          dividends.push({
            id: crypto.randomUUID(),
            assetId: '',
            symbol,
            amount: div.amount || 0,
            totalAmount: div.amount || 0,
            quantity: 0,
            exDividendDate: date,
            paymentDate: date,
            recordDate: undefined,
            taxWithheld: undefined,
            qualified: undefined,
          });
        });
      }
    } catch (error) {
      logger.error(`Failed to fetch dividend history for ${symbol}`, { error });
    }

    return dividends.sort((a, b) => b.exDividendDate.getTime() - a.exDividendDate.getTime());
  }

  async getEarningsCalendar(symbol: string): Promise<Array<{
    date: Date;
    estimate?: number;
    actual?: number;
    period: string;
  }>> {
    const earnings: Array<{
      date: Date;
      estimate?: number;
      actual?: number;
      period: string;
    }> = [];

    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2y&events=earnings`;
      const data = await this.rateLimitedFetch<YahooFinanceResponse>(`earnings_${symbol}`, url, CACHE_TTL_NEWS);

      if (data?.chart?.result?.[0]?.events?.earnings) {
        const earningsEvents = data.chart.result[0].events.earnings;

        Object.entries(earningsEvents).forEach(([timestamp, earning]) => {
          const date = new Date(parseInt(timestamp) * 1000);

          earnings.push({
            date,
            estimate: earning.estimate,
            actual: earning.actual,
            period: earning.period || `${date.getFullYear()} Q${Math.floor(date.getMonth() / 3) + 1}`,
          });
        });
      }
    } catch (error) {
      logger.error(`Failed to fetch earnings calendar for ${symbol}`, { error });
    }

    return earnings.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getCryptoETFs(): Promise<CryptoETF[]> {
    return [
      {
        ticker: 'BITO',
        name: 'ProShares Bitcoin Strategy ETF',
        type: 'futures',
        underlyingAssets: ['BTC'],
        expenseRatio: 0.95,
        aum: 2000000000,
        launchDate: new Date('2021-10-19'),
        status: 'live',
        news: [],
        issuer: 'ProShares',
        description: 'First Bitcoin futures ETF',
      },
      {
        ticker: 'GBTC',
        name: 'Grayscale Bitcoin Trust',
        type: 'spot',
        underlyingAssets: ['BTC'],
        expenseRatio: 2.0,
        aum: 15000000000,
        launchDate: new Date('2013-09-25'),
        status: 'live',
        news: [],
        issuer: 'Grayscale',
        description: 'Bitcoin trust',
      },
      {
        ticker: 'ETHE',
        name: 'Grayscale Ethereum Trust',
        type: 'spot',
        underlyingAssets: ['ETH'],
        expenseRatio: 2.5,
        aum: 5000000000,
        launchDate: new Date('2017-03-14'),
        status: 'live',
        news: [],
        issuer: 'Grayscale',
        description: 'Ethereum trust',
      },
    ];
  }

  async getUpcomingETFs(): Promise<CryptoETF[]> {
    return [
      {
        ticker: 'PENDING',
        name: 'Example Pending Bitcoin ETF',
        type: 'spot',
        underlyingAssets: ['BTC'],
        expenseRatio: 0.5,
        aum: 0,
        status: 'pending',
        news: [],
        filingDate: new Date('2024-01-01'),
        issuer: 'Example Issuer',
        description: 'Pending approval',
      },
    ];
  }

  async getGlobalMetrics(): Promise<{
    totalMarketCap: number;
    totalVolume: number;
    bitcoinDominance: number;
    ethereumDominance: number;
  }> {
    try {
      const url = `${COINGECKO_API_BASE}/global`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
      const data = await response.json();

      return {
        totalMarketCap: data.data.total_market_cap?.usd || 0,
        totalVolume: data.data.total_volume?.usd || 0,
        bitcoinDominance: data.data.market_cap_percentage?.btc || 0,
        ethereumDominance: data.data.market_cap_percentage?.eth || 0,
      };
    } catch (error) {
      logger.error('Failed to fetch global metrics:', { error });
      return {
        totalMarketCap: 0,
        totalVolume: 0,
        bitcoinDominance: 0,
        ethereumDominance: 0,
      };
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const marketDataService = MarketDataService.getInstance();
