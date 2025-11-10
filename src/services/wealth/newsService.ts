/**
 * News & Insights Service
 * 
 * Aggregates news, analyzes sentiment, and generates insights
 */

import { wealthMarketDataService } from './marketDataService';
import { aiServiceBridge } from '@/services/ai/aiServiceBridge';
import type { NewsArticle, MarketInsight, Portfolio } from '@/types/wealth';

const NEWS_KEY = 'dlx_wealth_news';
const INSIGHTS_KEY = 'dlx_wealth_insights';

class NewsService {
  private static instance: NewsService;
  private newsCache: Map<string, NewsArticle[]> = new Map();
  private insights: MarketInsight[] = [];

  private constructor() {
    this.loadData();
  }

  static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  private loadData(): void {
    try {
      const insightsData = localStorage.getItem(INSIGHTS_KEY);
      if (insightsData) {
        const loaded: MarketInsight[] = JSON.parse(insightsData);
        this.insights = loaded.map(insight => ({
          ...insight,
          timestamp: new Date(insight.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load insights:', error);
    }
  }

  private saveInsights(): void {
    try {
      localStorage.setItem(INSIGHTS_KEY, JSON.stringify(this.insights));
    } catch (error) {
      console.error('Failed to save insights:', error);
    }
  }

  async fetchNews(symbols: string[], limit: number = 20): Promise<NewsArticle[]> {
    const cacheKey = `news_${symbols.sort().join(',')}_${limit}`;
    
    // Check cache
    const cached = this.newsCache.get(cacheKey);
    if (cached) {
      const age = Date.now() - (cached[0]?.publishedAt.getTime() || 0);
      if (age < 300000) { // 5 minutes
        return cached;
      }
    }

    try {
      const articles = await wealthMarketDataService.getMarketNews(symbols, limit);
      this.newsCache.set(cacheKey, articles);
      return articles;
    } catch (error) {
      console.error('Failed to fetch news:', error);
      return [];
    }
  }

  async fetchCryptoETFNews(): Promise<NewsArticle[]> {
    const etfs = await wealthMarketDataService.getCryptoETFs();
    const symbols = etfs.map(etf => etf.ticker);
    return this.fetchNews(symbols, 30);
  }

  async fetchMarketNews(): Promise<NewsArticle[]> {
    return this.fetchNews([], 50);
  }

  async analyzeSentiment(articleId: string, article: NewsArticle): Promise<'positive' | 'negative' | 'neutral'> {
    // Use LLM for sentiment analysis
    try {
      const prompt = `Analyze the sentiment of this financial news article. Respond with only one word: "positive", "negative", or "neutral".

Title: ${article.title}
Summary: ${article.summary}`;

      const response = await aiServiceBridge.structureIdea(prompt, {
        temperature: 0.3,
        maxTokens: 10,
      });

      const sentiment = response.toLowerCase().trim();
      if (sentiment.includes('positive')) return 'positive';
      if (sentiment.includes('negative')) return 'negative';
      return 'neutral';
    } catch (error) {
      console.error('Failed to analyze sentiment:', error);
      return 'neutral';
    }
  }

  filterByRelevance(articles: NewsArticle[], portfolio: Portfolio): NewsArticle[] {
    const portfolioSymbols = portfolio.holdings.map(h => h.symbol);
    
    return articles.map(article => {
      const relevanceScore = this.calculateRelevance(article, portfolioSymbols);
      return {
        ...article,
        impactScore: relevanceScore,
      };
    }).sort((a, b) => b.impactScore - a.impactScore);
  }

  private calculateRelevance(article: NewsArticle, portfolioSymbols: string[]): number {
    let score = 50; // Base score

    // Check if article mentions portfolio symbols
    const titleLower = article.title.toLowerCase();
    const summaryLower = article.summary.toLowerCase();
    
    portfolioSymbols.forEach(symbol => {
      if (titleLower.includes(symbol.toLowerCase()) || summaryLower.includes(symbol.toLowerCase())) {
        score += 30;
      }
    });

    // Boost sentiment-based scores
    if (article.sentiment === 'positive') score += 10;
    if (article.sentiment === 'negative') score -= 5;

    // Boost recent articles
    const ageHours = (Date.now() - article.publishedAt.getTime()) / (1000 * 60 * 60);
    if (ageHours < 1) score += 10;
    else if (ageHours < 24) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  filterByImpact(articles: NewsArticle[]): NewsArticle[] {
    return articles.filter(article => article.impactScore >= 50);
  }

  groupByAsset(articles: NewsArticle[]): Record<string, NewsArticle[]> {
    const grouped: Record<string, NewsArticle[]> = {};

    articles.forEach(article => {
      if (article.relatedAssets.length === 0) {
        if (!grouped['general']) grouped['general'] = [];
        grouped['general'].push(article);
      } else {
        article.relatedAssets.forEach(symbol => {
          if (!grouped[symbol]) grouped[symbol] = [];
          grouped[symbol].push(article);
        });
      }
    });

    return grouped;
  }

  async generateInsights(portfolio: Portfolio, news: NewsArticle[]): Promise<MarketInsight[]> {
    const insights: MarketInsight[] = [];

    // Analyze portfolio performance
    if (portfolio.performance.totalReturnPercent < -5) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'risk',
        message: `Portfolio is down ${portfolio.performance.totalReturnPercent.toFixed(2)}%. Consider reviewing positions.`,
        confidence: 80,
        timestamp: new Date(),
        actionable: true,
      });
    }

    // Analyze news sentiment
    const positiveNews = news.filter(n => n.sentiment === 'positive').length;
    const negativeNews = news.filter(n => n.sentiment === 'negative').length;
    
    if (positiveNews > negativeNews * 2) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'trend',
        message: 'Positive news sentiment detected for portfolio assets.',
        confidence: 70,
        timestamp: new Date(),
      });
    }

    if (negativeNews > positiveNews * 2) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'alert',
        message: 'Negative news sentiment detected. Monitor positions closely.',
        confidence: 75,
        timestamp: new Date(),
        actionable: true,
      });
    }

    // Use LLM for advanced insights
    try {
      const topNews = news.slice(0, 5);
      const newsSummary = topNews.map(n => `- ${n.title}: ${n.summary}`).join('\n');
      
      const prompt = `Based on these financial news articles, provide 2-3 actionable insights for a portfolio holder. Be concise and specific.

${newsSummary}

Portfolio performance: ${portfolio.performance.totalReturnPercent.toFixed(2)}%`;

      const llmResponse = await aiServiceBridge.structureIdea(prompt, {
        temperature: 0.7,
        maxTokens: 200,
      });

      // Parse LLM response into insights
      const lines = llmResponse.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        if (line.trim().length > 10) {
          insights.push({
            id: crypto.randomUUID(),
            type: 'recommendation',
            message: line.trim(),
            confidence: 65,
            timestamp: new Date(),
            actionable: true,
          });
        }
      });
    } catch (error) {
      console.error('Failed to generate LLM insights:', error);
    }

    // Save insights
    this.insights.push(...insights);
    this.saveInsights();

    return insights;
  }

  detectTrends(assets: Array<{ symbol: string; performance?: { daily?: number; weekly?: number; monthly?: number } }>): MarketInsight[] {
    const insights: MarketInsight[] = [];

    assets.forEach(asset => {
      if (asset.performance) {
        // Detect strong upward trend
        if (asset.performance.daily && asset.performance.daily > 5 && 
            asset.performance.weekly && asset.performance.weekly > 10) {
          insights.push({
            id: crypto.randomUUID(),
            type: 'trend',
            asset: asset.symbol,
            message: `${asset.symbol} showing strong upward momentum (+${asset.performance.daily.toFixed(2)}% today, +${asset.performance.weekly.toFixed(2)}% this week)`,
            confidence: 75,
            timestamp: new Date(),
          });
        }

        // Detect strong downward trend
        if (asset.performance.daily && asset.performance.daily < -5 && 
            asset.performance.weekly && asset.performance.weekly < -10) {
          insights.push({
            id: crypto.randomUUID(),
            type: 'alert',
            asset: asset.symbol,
            message: `${asset.symbol} showing significant decline (${asset.performance.daily.toFixed(2)}% today, ${asset.performance.weekly.toFixed(2)}% this week)`,
            confidence: 80,
            timestamp: new Date(),
            actionable: true,
          });
        }
      }
    });

    return insights;
  }

  generateAlerts(portfolio: Portfolio): MarketInsight[] {
    const alerts: MarketInsight[] = [];

    // Check for significant losses
    if (portfolio.performance.totalReturnPercent < -10) {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'alert',
        message: `Portfolio down ${portfolio.performance.totalReturnPercent.toFixed(2)}%. Consider risk management.`,
        confidence: 90,
        timestamp: new Date(),
        actionable: true,
      });
    }

    // Check allocation (crypto should be ~25%)
    const cryptoAllocation = portfolio.allocation.crypto;
    if (cryptoAllocation > 30) {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'risk',
        message: `Crypto allocation is ${cryptoAllocation.toFixed(1)}%, above recommended 25%.`,
        confidence: 70,
        timestamp: new Date(),
        actionable: true,
      });
    }

    return alerts;
  }

  getInsights(limit?: number): MarketInsight[] {
    const sorted = [...this.insights].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return limit ? sorted.slice(0, limit) : sorted;
  }

  clearInsights(): void {
    this.insights = [];
    this.saveInsights();
  }
}

export const newsService = NewsService.getInstance();

