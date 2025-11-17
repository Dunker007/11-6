/**
 * trendAnalysisService.ts
 * AI-powered trend detection and viral topic discovery.
 */

import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';

export interface Trend {
  id: string;
  topic: string;
  score: number;
  volume: number;
  growth: number;
  category: string;
  platforms: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  peakTime: Date;
  relatedTopics: string[];
}

export interface ContentOpportunity {
  topic: string;
  potential: number;
  competition: number;
  suggestedFormat: 'blog' | 'video' | 'social' | 'podcast';
  keywords: string[];
  estimatedReach: number;
}

export interface TrendForecast {
  topic: string;
  currentVolume: number;
  predictedVolume: number;
  confidence: number;
  timeframe: '24h' | '7d' | '30d';
}

class TrendAnalysisService {
  private trends: Trend[] = [];
  private categories = ['tech', 'business', 'lifestyle', 'education', 'entertainment'];

  async analyzeTrends(): Promise<Trend[]> {
    logger.info('Analyzing current trends');

    // Demo mode: generate mock trending topics
    await this.simulateAnalysis();

    this.trends = this.generateMockTrends();

    activityService.logActivity({
      type: 'trends_analyzed',
      message: `Analyzed ${this.trends.length} trending topics`,
      metadata: { topTrend: this.trends[0]?.topic },
    });

    return this.trends;
  }

  private generateMockTrends(): Trend[] {
    const topics = [
      'AI automation tools',
      'Passive income strategies',
      'Remote work productivity',
      'Content monetization',
      'Digital marketing trends',
      'Cryptocurrency updates',
      'SaaS business models',
      'Creator economy',
      'No-code platforms',
      'Web3 innovations',
    ];

    return topics.map((topic, i) => ({
      id: crypto.randomUUID(),
      topic,
      score: Math.random() * 40 + 60, // 60-100
      volume: Math.floor(Math.random() * 50000 + 10000),
      growth: Math.random() * 150 + 50, // 50-200%
      category: this.categories[i % this.categories.length],
      platforms: this.getRandomPlatforms(),
      sentiment: this.getRandomSentiment(),
      peakTime: new Date(Date.now() + Math.random() * 86400000), // Next 24h
      relatedTopics: this.getRelatedTopics(topic),
    }));
  }

  getTopTrends(limit: number = 10): Trend[] {
    return [...this.trends].sort((a, b) => b.score - a.score).slice(0, limit);
  }

  getTrendsByCategory(category: string): Trend[] {
    return this.trends.filter(t => t.category === category).sort((a, b) => b.score - a.score);
  }

  getContentOpportunities(userNiche?: string): ContentOpportunity[] {
    const topTrends = this.getTopTrends(5);

    return topTrends.map(trend => ({
      topic: trend.topic,
      potential: Math.round((trend.score * trend.growth) / 100),
      competition: Math.floor(Math.random() * 70 + 30),
      suggestedFormat: this.suggestFormat(trend),
      keywords: this.extractKeywords(trend.topic),
      estimatedReach: Math.floor(trend.volume * (trend.growth / 100)),
    }));
  }

  forecastTrend(topic: string, timeframe: '24h' | '7d' | '30d' = '7d'): TrendForecast {
    const trend = this.trends.find(t => t.topic.toLowerCase().includes(topic.toLowerCase()));

    if (!trend) {
      return {
        topic,
        currentVolume: 0,
        predictedVolume: 0,
        confidence: 0,
        timeframe,
      };
    }

    const multiplier = timeframe === '24h' ? 1.2 : timeframe === '7d' ? 1.5 : 2.0;
    const predictedVolume = Math.floor(trend.volume * multiplier);

    return {
      topic: trend.topic,
      currentVolume: trend.volume,
      predictedVolume,
      confidence: Math.random() * 20 + 75, // 75-95%
      timeframe,
    };
  }

  private suggestFormat(trend: Trend): 'blog' | 'video' | 'social' | 'podcast' {
    if (trend.platforms.includes('youtube')) return 'video';
    if (trend.platforms.includes('twitter')) return 'social';
    if (trend.volume > 30000) return 'blog';
    return 'podcast';
  }

  private extractKeywords(topic: string): string[] {
    const words = topic.toLowerCase().split(' ');
    return [...words, `${words[0]} tips`, `best ${words[0]}`, `how to ${words.join(' ')}`];
  }

  private getRandomPlatforms(): string[] {
    const platforms = ['twitter', 'linkedin', 'youtube', 'reddit', 'tiktok'];
    const count = Math.floor(Math.random() * 3) + 2;
    return platforms.sort(() => Math.random() - 0.5).slice(0, count);
  }

  private getRandomSentiment(): 'positive' | 'neutral' | 'negative' {
    const rand = Math.random();
    if (rand > 0.7) return 'positive';
    if (rand > 0.2) return 'neutral';
    return 'negative';
  }

  private getRelatedTopics(topic: string): string[] {
    return [`${topic} guide`, `${topic} tools`, `${topic} 2025`];
  }

  private async simulateAnalysis(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  async quickTest() {
    const trends = await this.analyzeTrends();
    const topTrends = this.getTopTrends(5);
    const opportunities = this.getContentOpportunities();
    const forecast = this.forecastTrend('AI automation', '7d');

    return {
      allTrends: trends.length,
      topTrends,
      opportunities,
      forecast,
      categories: this.categories,
    };
  }
}

export const trendAnalysisService = new TrendAnalysisService();
if (typeof window !== 'undefined') (window as any).testTrendAnalysis = () => trendAnalysisService.quickTest();
