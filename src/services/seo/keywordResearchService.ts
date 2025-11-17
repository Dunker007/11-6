/**
 * keywordResearchService.ts
 *
 * SEO Keyword Research Tool for passive income content optimization.
 * Provides keyword difficulty, search volume, CPC, and trend analysis.
 *
 * FEATURES:
 * ✅ Keyword difficulty scoring
 * ✅ Search volume estimation
 * ✅ CPC (cost-per-click) data
 * ✅ Trend analysis
 * ✅ Related keyword suggestions
 * ✅ Long-tail keyword generation
 * ✅ Competitor keyword analysis
 * ✅ SERP feature detection
 * ✅ Keyword clustering
 * ✅ Export to CSV
 *
 * NOTE: Uses demo/mock data for external API calls (Google Keyword Planner, Ahrefs, SEMrush)
 * In production, integrate with real APIs.
 */

import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';

export interface KeywordData {
  keyword: string;
  searchVolume: number; // monthly searches
  difficulty: number; // 0-100 (higher = harder to rank)
  cpc: number; // cost per click in USD
  competition: 'low' | 'medium' | 'high';
  trend: 'rising' | 'stable' | 'declining';
  trendData: number[]; // 12-month trend
  serpFeatures: string[]; // Featured snippets, PAA, videos, etc.
  relatedKeywords: string[];
  longTailVariations: string[];
}

export interface KeywordCluster {
  id: string;
  mainKeyword: string;
  keywords: KeywordData[];
  totalSearchVolume: number;
  avgDifficulty: number;
  topic: string;
}

export interface CompetitorAnalysis {
  domain: string;
  topKeywords: KeywordData[];
  estimatedTraffic: number;
  contentGaps: string[]; // Keywords they rank for that you don't
  opportunities: string[]; // Low competition keywords in their niche
}

export interface KeywordResearchOptions {
  seed: string;
  location?: string;
  language?: string;
  includeRelated?: boolean;
  includeLongTail?: boolean;
  minSearchVolume?: number;
  maxDifficulty?: number;
}

export interface ExportOptions {
  format: 'csv' | 'json';
  fields?: string[];
}

class KeywordResearchService {
  private researchHistory: KeywordData[] = [];
  private clusters: KeywordCluster[] = [];

  /**
   * Research keywords based on seed keyword
   */
  async researchKeyword(options: KeywordResearchOptions): Promise<KeywordData[]> {
    logger.info('Researching keywords', { seed: options.seed });

    try {
      const results: KeywordData[] = [];

      // Main seed keyword
      const mainKeyword = await this.analyzeKeyword(options.seed);
      results.push(mainKeyword);

      // Related keywords
      if (options.includeRelated !== false) {
        const related = await this.getRelatedKeywords(options.seed);
        results.push(...related);
      }

      // Long-tail variations
      if (options.includeLongTail) {
        const longTail = await this.getLongTailKeywords(options.seed);
        results.push(...longTail);
      }

      // Filter by search volume and difficulty
      let filtered = results;
      if (options.minSearchVolume) {
        filtered = filtered.filter(k => k.searchVolume >= options.minSearchVolume!);
      }
      if (options.maxDifficulty) {
        filtered = filtered.filter(k => k.difficulty <= options.maxDifficulty!);
      }

      // Store in history
      this.researchHistory.push(...filtered);

      activityService.addActivity({
        type: 'ai',
        action: 'Keyword Research',
        description: `Researched ${filtered.length} keywords for "${options.seed}"`,
        metadata: {
          seed: options.seed,
          resultsCount: filtered.length,
        },
      });

      logger.info('Keyword research complete', {
        seed: options.seed,
        results: filtered.length,
      });

      return filtered;
    } catch (error) {
      logger.error('Keyword research failed', { error: error as Error });
      throw error;
    }
  }

  /**
   * Analyze a single keyword
   */
  async analyzeKeyword(keyword: string): Promise<KeywordData> {
    // DEMO MODE: In production, call real API (Ahrefs, SEMrush, Google Keyword Planner)
    const normalized = keyword.toLowerCase().trim();
    const wordCount = normalized.split(' ').length;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Mock data generation with realistic patterns
    const difficulty = this.calculateDifficulty(normalized, wordCount);
    const searchVolume = this.estimateSearchVolume(normalized, wordCount);
    const cpc = this.estimateCPC(normalized, difficulty);

    return {
      keyword: normalized,
      searchVolume,
      difficulty,
      cpc,
      competition: difficulty < 30 ? 'low' : difficulty < 60 ? 'medium' : 'high',
      trend: this.analyzeTrend(),
      trendData: this.generateTrendData(),
      serpFeatures: this.detectSERPFeatures(normalized),
      relatedKeywords: this.generateRelatedKeywords(normalized),
      longTailVariations: this.generateLongTailVariations(normalized),
    };
  }

  /**
   * Get related keywords
   */
  private async getRelatedKeywords(seed: string): Promise<KeywordData[]> {
    const related = this.generateRelatedKeywords(seed);
    const results: KeywordData[] = [];

    for (const keyword of related.slice(0, 5)) {
      results.push(await this.analyzeKeyword(keyword));
    }

    return results;
  }

  /**
   * Get long-tail keyword variations
   */
  private async getLongTailKeywords(seed: string): Promise<KeywordData[]> {
    const longTail = this.generateLongTailVariations(seed);
    const results: KeywordData[] = [];

    for (const keyword of longTail.slice(0, 5)) {
      results.push(await this.analyzeKeyword(keyword));
    }

    return results;
  }

  /**
   * Calculate keyword difficulty (0-100)
   */
  private calculateDifficulty(keyword: string, wordCount: number): number {
    // Longer keywords (long-tail) are typically easier
    const baseDifficulty = 70 - (wordCount * 10);

    // Common money keywords are harder
    const moneyKeywords = ['buy', 'best', 'review', 'software', 'tool', 'service'];
    const hasMoneyWord = moneyKeywords.some(mk => keyword.includes(mk));
    const moneyPenalty = hasMoneyWord ? 15 : 0;

    // Add some randomness
    const randomFactor = Math.random() * 20 - 10;

    return Math.max(5, Math.min(95, baseDifficulty + moneyPenalty + randomFactor));
  }

  /**
   * Estimate monthly search volume
   */
  private estimateSearchVolume(keyword: string, wordCount: number): number {
    // Shorter keywords generally have higher volume
    const baseVolume = wordCount === 1 ? 50000 : wordCount === 2 ? 15000 : 5000;

    // Popular niches get more volume
    const popularNiches = ['ai', 'crypto', 'fitness', 'money', 'business', 'tech'];
    const isPopular = popularNiches.some(niche => keyword.includes(niche));
    const popularBoost = isPopular ? 2 : 1;

    // Random variance
    const variance = Math.random() * 0.5 + 0.75; // 0.75 - 1.25

    return Math.round(baseVolume * popularBoost * variance);
  }

  /**
   * Estimate CPC (cost per click)
   */
  private estimateCPC(keyword: string, difficulty: number): number {
    // Higher difficulty usually means higher CPC
    const baseCPC = (difficulty / 100) * 10;

    // Commercial intent keywords have higher CPC
    const commercialKeywords = ['buy', 'price', 'cost', 'cheap', 'best', 'review'];
    const hasCommercialIntent = commercialKeywords.some(ck => keyword.includes(ck));
    const commercialBoost = hasCommercialIntent ? 1.5 : 1;

    const variance = Math.random() * 0.4 + 0.8; // 0.8 - 1.2

    return Math.round((baseCPC * commercialBoost * variance) * 100) / 100;
  }

  /**
   * Analyze trend direction
   */
  private analyzeTrend(): 'rising' | 'stable' | 'declining' {
    const random = Math.random();
    if (random < 0.3) return 'rising';
    if (random < 0.8) return 'stable';
    return 'declining';
  }

  /**
   * Generate 12-month trend data
   */
  private generateTrendData(): number[] {
    const data: number[] = [];
    let current = Math.random() * 50 + 50; // Start between 50-100

    for (let i = 0; i < 12; i++) {
      data.push(Math.round(current));
      // Random walk
      current += (Math.random() - 0.5) * 20;
      current = Math.max(10, Math.min(100, current)); // Clamp between 10-100
    }

    return data;
  }

  /**
   * Detect SERP features
   */
  private detectSERPFeatures(keyword: string): string[] {
    const allFeatures = [
      'Featured Snippet',
      'People Also Ask',
      'Video Results',
      'Image Pack',
      'Local Pack',
      'Shopping Results',
      'Knowledge Panel',
      'Related Searches',
    ];

    // Questions often trigger PAA
    if (keyword.includes('how') || keyword.includes('what') || keyword.includes('why')) {
      return ['Featured Snippet', 'People Also Ask', 'Related Searches'];
    }

    // Visual content
    if (keyword.includes('tutorial') || keyword.includes('guide')) {
      return ['Video Results', 'Featured Snippet', 'People Also Ask'];
    }

    // Local intent
    if (keyword.includes('near me') || keyword.includes('local')) {
      return ['Local Pack', 'Map Results', 'Related Searches'];
    }

    // Random 2-4 features
    const count = Math.floor(Math.random() * 3) + 2;
    return allFeatures.sort(() => Math.random() - 0.5).slice(0, count);
  }

  /**
   * Generate related keywords
   */
  private generateRelatedKeywords(seed: string): string[] {
    const modifiers = {
      prefix: ['best', 'top', 'how to', 'what is', 'free', 'cheap', 'professional'],
      suffix: ['guide', 'tutorial', 'tips', 'tools', 'software', 'service', 'for beginners', '2024'],
    };

    const related: string[] = [];

    // Add prefixes
    modifiers.prefix.forEach(prefix => {
      related.push(`${prefix} ${seed}`);
    });

    // Add suffixes
    modifiers.suffix.forEach(suffix => {
      related.push(`${seed} ${suffix}`);
    });

    // Variations
    if (seed.includes('software')) {
      related.push(seed.replace('software', 'tool'));
    }
    if (seed.includes('tool')) {
      related.push(seed.replace('tool', 'software'));
    }

    return related.slice(0, 10);
  }

  /**
   * Generate long-tail variations
   */
  private generateLongTailVariations(seed: string): string[] {
    const questions = ['how to', 'what is', 'why is', 'when to', 'where to'];
    const modifiers = ['for beginners', 'step by step', 'easy', 'fast', 'complete guide'];
    const contexts = ['for business', 'for startups', 'online', 'free'];

    const longTail: string[] = [];

    questions.forEach(q => {
      longTail.push(`${q} ${seed}`);
      modifiers.forEach(m => {
        longTail.push(`${q} ${seed} ${m}`);
      });
    });

    contexts.forEach(c => {
      longTail.push(`${seed} ${c}`);
    });

    return longTail.slice(0, 15);
  }

  /**
   * Cluster keywords by topic
   */
  clusterKeywords(keywords: KeywordData[]): KeywordCluster[] {
    const clusters: Map<string, KeywordData[]> = new Map();

    // Simple clustering by word overlap
    keywords.forEach(kw => {
      const words = kw.keyword.split(' ');
      const mainWord = words.find(w => w.length > 3) || words[0];

      if (!clusters.has(mainWord)) {
        clusters.set(mainWord, []);
      }
      clusters.get(mainWord)!.push(kw);
    });

    const result: KeywordCluster[] = [];

    clusters.forEach((kwList, topic) => {
      const totalVolume = kwList.reduce((sum, k) => sum + k.searchVolume, 0);
      const avgDifficulty = kwList.reduce((sum, k) => sum + k.difficulty, 0) / kwList.length;

      result.push({
        id: crypto.randomUUID(),
        mainKeyword: kwList[0].keyword,
        keywords: kwList,
        totalSearchVolume: totalVolume,
        avgDifficulty: Math.round(avgDifficulty),
        topic,
      });
    });

    this.clusters = result;
    return result;
  }

  /**
   * Analyze competitor keywords (demo mode)
   */
  async analyzeCompetitor(domain: string): Promise<CompetitorAnalysis> {
    logger.info('Analyzing competitor', { domain });

    // DEMO MODE: In production, call Ahrefs/SEMrush API
    await new Promise(resolve => setTimeout(resolve, 500));

    const topKeywords: KeywordData[] = [];
    const seedKeywords = [
      `${domain.split('.')[0]} review`,
      `${domain.split('.')[0]} alternative`,
      `best ${domain.split('.')[0]}`,
    ];

    for (const seed of seedKeywords) {
      topKeywords.push(await this.analyzeKeyword(seed));
    }

    return {
      domain,
      topKeywords,
      estimatedTraffic: Math.floor(Math.random() * 100000) + 10000,
      contentGaps: [
        'how to use ai for passive income',
        'automated content generation',
        'best seo tools 2024',
      ],
      opportunities: [
        'ai content automation for beginners',
        'passive income with ai tools',
        'automated blog writing software',
      ],
    };
  }

  /**
   * Export keywords to CSV or JSON
   */
  exportKeywords(keywords: KeywordData[], options: ExportOptions = { format: 'csv' }): string {
    if (options.format === 'json') {
      return JSON.stringify(keywords, null, 2);
    }

    // CSV export
    const fields = options.fields || [
      'keyword',
      'searchVolume',
      'difficulty',
      'cpc',
      'competition',
      'trend',
    ];

    const header = fields.join(',');
    const rows = keywords.map(kw => {
      return fields.map(field => {
        const value = kw[field as keyof KeywordData];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',');
    });

    return [header, ...rows].join('\n');
  }

  /**
   * Get keyword opportunities (low difficulty, high volume)
   */
  getOpportunities(keywords: KeywordData[]): KeywordData[] {
    return keywords
      .filter(k => k.difficulty < 40 && k.searchVolume > 1000)
      .sort((a, b) => b.searchVolume - a.searchVolume);
  }

  /**
   * Get research history
   */
  getHistory(): KeywordData[] {
    return [...this.researchHistory];
  }

  /**
   * Get clusters
   */
  getClusters(): KeywordCluster[] {
    return [...this.clusters];
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.researchHistory = [];
    this.clusters = [];
    logger.info('Keyword research history cleared');
  }

  /**
   * Quick test method
   */
  async quickTest(): Promise<KeywordData[]> {
    logger.info('Running SEO keyword research quick test');

    return await this.researchKeyword({
      seed: 'passive income automation',
      includeRelated: true,
      includeLongTail: true,
      minSearchVolume: 500,
      maxDifficulty: 60,
    });
  }
}

// Export singleton
export const keywordResearchService = new KeywordResearchService();

// Expose to window for testing
if (typeof window !== 'undefined') {
  (window as any).testKeywordResearch = () => keywordResearchService.quickTest();
  (window as any).keywordResearchService = keywordResearchService;
}
