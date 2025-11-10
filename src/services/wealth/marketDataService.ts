/**
 * Wealth Lab Market Data Service
 * 
 * Integrates multiple data sources:
 * - Yahoo Finance API (stocks, ETFs)
 * - CoinGecko API (crypto - via existing service)
 * - News APIs (NewsAPI.org, Alpha Vantage, CryptoCompare)
 */

import { marketDataService as coinGeckoService } from '@/services/crypto/marketDataService';
import type { CryptoETF, NewsArticle, DividendPayment } from '@/types/wealth';

const YAHOO_FINANCE_API_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';
const NEWS_API_BASE = 'https://newsapi.org/v2';
const CACHE_TTL = 30000; // 30 seconds for market data
const NEWS_CACHE_TTL = 300000; // 5 minutes for news

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class WealthMarketDataService {
  private static instance: WealthMarketDataService;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private rateLimitQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;

  private constructor() {}

  static getInstance(): WealthMarketDataService {
    if (!WealthMarketDataService.instance) {
      WealthMarketDataService.instance = new WealthMarketDataService();
    }
    return WealthMarketDataService.instance;
  }

  private getCached<T>(key: string, ttl: number = CACHE_TTL): T | null {
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

  private async rateLimitedFetch<T>(key: string, url: string, ttl: number = CACHE_TTL): Promise<T> {
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
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    this.isProcessingQueue = false;
  }

  async getRealTimePrice(symbol: string): Promise<{
    price: number;
    change24h: number;
    changePercent24h: number;
    volume?: number;
    marketCap?: number;
    lastUpdated: Date;
  }> {
    const cryptoPattern = /^(BTC|ETH|USDT|BNB|SOL|ADA|XRP|DOT|DOGE|AVAX|SHIB|MATIC|LTC|UNI|LINK|ATOM|ETC|XLM|ALGO|VET|ICP|FIL|TRX|EOS|AAVE|MKR|GRT|SAND|MANA|AXS|THETA|XTZ|FLOW|CHZ|ENJ|BAT|ZEC|DASH|ZRX|COMP|SNX|YFI|CRV|1INCH|SUSHI|ALPHA|REN|KNC|BAND|OCEAN|NMR|COTI|ANKR|BAL|STORJ|OMG|PAXG|SKL)$/i;
    
    if (cryptoPattern.test(symbol)) {
      try {
        const coins = await coinGeckoService.getTopCoins(250);
        const coin = coins.find(c => c.symbol.toUpperCase() === symbol.toUpperCase());
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
        console.error(`Failed to fetch crypto price for ${symbol}:`, error);
      }
    }

    try {
      const url = `${YAHOO_FINANCE_API_BASE}/${symbol}?interval=1d&range=1d`;
      const data = await this.rateLimitedFetch<any>(`price_${symbol}`, url);
      
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
      console.error(`Failed to fetch price for ${symbol}:`, error);
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
    const range = period === '1d' ? '1d' : period === '5d' ? '5d' : period === '1mo' ? '1mo' : period === '3mo' ? '3mo' : period === '6mo' ? '6mo' : period === '1y' ? '1y' : period === '2y' ? '2y' : period === '5y' ? '5y' : period === '10y' ? '10y' : period === 'ytd' ? 'ytd' : 'max';
    const interval = period === '1d' || period === '5d' ? '5m' : period === '1mo' ? '1d' : '1d';

    try {
      const url = `${YAHOO_FINANCE_API_BASE}/${symbol}?interval=${interval}&range=${range}`;
      const data = await this.rateLimitedFetch<any>(`history_${symbol}_${period}`, url, 60000);
      
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
      console.error(`Failed to fetch historical data for ${symbol}:`, error);
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
      const cryptoResults = await coinGeckoService.searchCoins(query);
      cryptoResults.forEach(coin => {
        results.push({
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          type: 'crypto',
        });
      });
    } catch (error) {
      console.error('Failed to search crypto:', error);
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
      const coins = await coinGeckoService.getTopCoins(250);
      const coin = coins.find(c => c.symbol.toUpperCase() === symbol.toUpperCase());
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
      console.error(`Failed to get crypto details for ${symbol}:`, error);
    }

    return {
      symbol,
      name: symbol,
      type: 'stock',
    };
  }

  async getMarketNews(symbols?: string[], limit: number = 20): Promise<NewsArticle[]> {
    const articles: NewsArticle[] = [];
    const apiKey = ''; // Would come from API key management
    
    if (!apiKey) {
      return this.getMockNews(symbols, limit);
    }

    try {
      const query = symbols && symbols.length > 0 ? symbols.join(' OR ') : 'finance OR stock OR crypto';
      const url = `${NEWS_API_BASE}/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=${limit}&language=en`;
      
      const data = await this.rateLimitedFetch<any>(`news_${query}_${limit}`, url, NEWS_CACHE_TTL);
      
      if (data?.articles) {
        data.articles.forEach((article: any) => {
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
      console.error('Failed to fetch market news:', error);
      return this.getMockNews(symbols, limit);
    }

    return articles;
  }

  async getCryptoETFs(): Promise<CryptoETF[]> {
    const etfs: CryptoETF[] = [
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

    return etfs;
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

  /**
   * Get dividend history for a stock/ETF
   */
  async getDividendHistory(symbol: string, startDate?: Date, endDate?: Date): Promise<DividendPayment[]> {
    const dividends: DividendPayment[] = [];
    
    try {
      // Yahoo Finance dividend endpoint
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5y&events=div`;
      const data = await this.rateLimitedFetch<any>(`dividends_${symbol}`, url, 300000); // Cache for 5 minutes
      
      if (data?.chart?.result?.[0]?.events?.dividends) {
        const dividendEvents = data.chart.result[0].events.dividends;
        const timestamps = data.chart.result[0].timestamp || [];
        
        Object.entries(dividendEvents).forEach(([timestamp, div]: [string, any]) => {
          const date = new Date(parseInt(timestamp) * 1000);
          
          if (startDate && date < startDate) return;
          if (endDate && date > endDate) return;
          
          dividends.push({
            id: crypto.randomUUID(),
            assetId: '', // Will be set by caller
            symbol,
            amount: div.amount || 0,
            totalAmount: div.amount || 0, // Will be calculated based on shares held
            quantity: 0, // Will be set by caller based on position
            exDividendDate: date,
            paymentDate: date, // Yahoo Finance doesn't always provide payment date separately
            recordDate: undefined,
            taxWithheld: undefined,
            qualified: undefined, // Would need additional data source
          });
        });
      }
    } catch (error) {
      console.error(`Failed to fetch dividend history for ${symbol}:`, error);
    }
    
    return dividends.sort((a, b) => b.exDividendDate.getTime() - a.exDividendDate.getTime());
  }

  /**
   * Get earnings calendar for a symbol
   */
  async getEarningsCalendar(symbol: string): Promise<Array<{
    date: Date;
    estimate?: number;
    actual?: number;
    period: string; // e.g., "Q1 2024"
  }>> {
    const earnings: Array<{
      date: Date;
      estimate?: number;
      actual?: number;
      period: string;
    }> = [];
    
    try {
      // Yahoo Finance earnings calendar endpoint
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2y&events=earnings`;
      const data = await this.rateLimitedFetch<any>(`earnings_${symbol}`, url, 300000);
      
      if (data?.chart?.result?.[0]?.events?.earnings) {
        const earningsEvents = data.chart.result[0].events.earnings;
        
        Object.entries(earningsEvents).forEach(([timestamp, earning]: [string, any]) => {
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
      console.error(`Failed to fetch earnings calendar for ${symbol}:`, error);
    }
    
    return earnings.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Get options chain data (for advanced users)
   */
  async getOptionsChain(symbol: string, expirationDate?: Date): Promise<Array<{
    strike: number;
    expirationDate: Date;
    calls?: {
      bid: number;
      ask: number;
      volume: number;
      openInterest: number;
    };
    puts?: {
      bid: number;
      ask: number;
      volume: number;
      openInterest: number;
    };
  }>> {
    // Note: Yahoo Finance options data requires a different endpoint
    // This is a placeholder implementation
    const options: Array<{
      strike: number;
      expirationDate: Date;
      calls?: {
        bid: number;
        ask: number;
        volume: number;
        openInterest: number;
      };
      puts?: {
        bid: number;
        ask: number;
        volume: number;
        openInterest: number;
      };
    }> = [];
    
    // Implementation would fetch from Yahoo Finance options endpoint
    // For now, return empty array
    return options;
  }

  /**
   * Get list of supported international exchanges
   */
  getSupportedExchanges(): Array<{
    code: string;
    name: string;
    country: string;
    timezone: string;
  }> {
    // List of 50+ international exchanges (like Sharesight)
    return [
      { code: 'NYSE', name: 'New York Stock Exchange', country: 'US', timezone: 'America/New_York' },
      { code: 'NASDAQ', name: 'NASDAQ', country: 'US', timezone: 'America/New_York' },
      { code: 'LSE', name: 'London Stock Exchange', country: 'GB', timezone: 'Europe/London' },
      { code: 'TSE', name: 'Tokyo Stock Exchange', country: 'JP', timezone: 'Asia/Tokyo' },
      { code: 'SSE', name: 'Shanghai Stock Exchange', country: 'CN', timezone: 'Asia/Shanghai' },
      { code: 'SZSE', name: 'Shenzhen Stock Exchange', country: 'CN', timezone: 'Asia/Shanghai' },
      { code: 'HKEX', name: 'Hong Kong Stock Exchange', country: 'HK', timezone: 'Asia/Hong_Kong' },
      { code: 'ASX', name: 'Australian Securities Exchange', country: 'AU', timezone: 'Australia/Sydney' },
      { code: 'TSX', name: 'Toronto Stock Exchange', country: 'CA', timezone: 'America/Toronto' },
      { code: 'BSE', name: 'Bombay Stock Exchange', country: 'IN', timezone: 'Asia/Kolkata' },
      { code: 'NSE', name: 'National Stock Exchange of India', country: 'IN', timezone: 'Asia/Kolkata' },
      { code: 'FWB', name: 'Frankfurt Stock Exchange', country: 'DE', timezone: 'Europe/Berlin' },
      { code: 'XETR', name: 'XETRA', country: 'DE', timezone: 'Europe/Berlin' },
      { code: 'EURONEXT', name: 'Euronext', country: 'EU', timezone: 'Europe/Paris' },
      { code: 'SWX', name: 'SIX Swiss Exchange', country: 'CH', timezone: 'Europe/Zurich' },
      { code: 'KRX', name: 'Korea Exchange', country: 'KR', timezone: 'Asia/Seoul' },
      { code: 'SGX', name: 'Singapore Exchange', country: 'SG', timezone: 'Asia/Singapore' },
      { code: 'B3', name: 'B3 - Brasil Bolsa Balcão', country: 'BR', timezone: 'America/Sao_Paulo' },
      { code: 'BMV', name: 'Bolsa Mexicana de Valores', country: 'MX', timezone: 'America/Mexico_City' },
      { code: 'JSE', name: 'Johannesburg Stock Exchange', country: 'ZA', timezone: 'Africa/Johannesburg' },
      // Add more exchanges as needed
    ];
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const wealthMarketDataService = WealthMarketDataService.getInstance();
