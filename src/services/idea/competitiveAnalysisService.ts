/**
 * Competitive Analysis Service
 *
 * Automated competitive intelligence and analysis with:
 * - Competitor discovery and tracking
 * - Feature comparison matrices
 * - SWOT analysis automation
 * - Pricing intelligence
 * - Market positioning maps
 * - Sentiment analysis
 * - Trend tracking
 */

import { logger } from '../logging/loggerService';

export interface Competitor {
  id: string;
  name: string;
  website: string;
  description: string;
  category: 'direct' | 'indirect' | 'potential';
  marketPosition: 'leader' | 'challenger' | 'follower' | 'niche';
  foundedYear?: number;
  employeeCount?: string;
  funding?: string;
  revenue?: string;
  features: CompetitorFeature[];
  pricing: CompetitorPricing[];
  strengths: string[];
  weaknesses: string[];
  threats: string[];
  opportunities: string[];
  sentiment: {
    overall: number; // -1 to 1
    customerSatisfaction: number; // 0-100
    brandAwareness: number; // 0-100
  };
  lastUpdated: Date;
}

export interface CompetitorFeature {
  name: string;
  category: string;
  available: boolean;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  notes?: string;
}

export interface CompetitorPricing {
  plan: string;
  price: number;
  billing: 'monthly' | 'annually' | 'one-time';
  features: string[];
  limits?: Record<string, string | number>;
}

export interface CompetitiveMatrix {
  id: string;
  name: string;
  competitors: string[]; // Competitor IDs
  features: string[];
  data: Record<string, Record<string, boolean | string>>;
  createdAt: Date;
}

export interface SWOTAnalysis {
  competitorId: string;
  strengths: SWOTItem[];
  weaknesses: SWOTItem[];
  opportunities: SWOTItem[];
  threats: SWOTItem[];
  summary: string;
  recommendations: string[];
  generatedAt: Date;
}

export interface SWOTItem {
  description: string;
  impact: 'low' | 'medium' | 'high';
  category: string;
}

export interface MarketPositioningMap {
  id: string;
  name: string;
  xAxis: string; // e.g., "Price"
  yAxis: string; // e.g., "Features"
  competitors: Array<{
    id: string;
    name: string;
    x: number; // 0-100
    y: number; // 0-100
  }>;
  quadrants: {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
  };
}

export interface CompetitiveTrend {
  id: string;
  type: 'feature-launch' | 'pricing-change' | 'acquisition' | 'funding' | 'leadership-change' | 'market-expansion';
  competitorId: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  detectedAt: Date;
  source?: string;
}

export interface CompetitiveIntelReport {
  id: string;
  title: string;
  summary: string;
  competitors: Competitor[];
  keyFindings: string[];
  marketTrends: string[];
  recommendations: string[];
  threats: string[];
  opportunities: string[];
  generatedAt: Date;
}

class CompetitiveAnalysisService {
  private static instance: CompetitiveAnalysisService;
  private competitors: Map<string, Competitor> = new Map();
  private matrices: Map<string, CompetitiveMatrix> = new Map();
  private trends: CompetitiveTrend[] = [];

  private constructor() {
    this.initializeSampleCompetitors();
  }

  static getInstance(): CompetitiveAnalysisService {
    if (!CompetitiveAnalysisService.instance) {
      CompetitiveAnalysisService.instance = new CompetitiveAnalysisService();
    }
    return CompetitiveAnalysisService.instance;
  }

  /**
   * Add competitor
   */
  async addCompetitor(
    name: string,
    website: string,
    description: string,
    category: Competitor['category']
  ): Promise<Competitor> {
    const competitorId = crypto.randomUUID();

    // Simulate automated data collection
    const competitor: Competitor = {
      id: competitorId,
      name,
      website,
      description,
      category,
      marketPosition: 'follower',
      features: await this.scrapeFeatures(website),
      pricing: await this.scrapePricing(website),
      strengths: [],
      weaknesses: [],
      threats: [],
      opportunities: [],
      sentiment: {
        overall: Math.random() * 2 - 1,
        customerSatisfaction: Math.random() * 100,
        brandAwareness: Math.random() * 100,
      },
      lastUpdated: new Date(),
    };

    this.competitors.set(competitorId, competitor);

    logger.info('Added competitor', { competitorId, name });

    return competitor;
  }

  /**
   * Get all competitors
   */
  getAllCompetitors(): Competitor[] {
    return Array.from(this.competitors.values()).sort(
      (a, b) => b.sentiment.customerSatisfaction - a.sentiment.customerSatisfaction
    );
  }

  /**
   * Get competitor by ID
   */
  getCompetitor(competitorId: string): Competitor | undefined {
    return this.competitors.get(competitorId);
  }

  /**
   * Update competitor
   */
  async updateCompetitor(
    competitorId: string,
    updates: Partial<Competitor>
  ): Promise<Competitor> {
    const competitor = this.competitors.get(competitorId);
    if (!competitor) throw new Error(`Competitor ${competitorId} not found`);

    Object.assign(competitor, updates, { lastUpdated: new Date() });

    logger.info('Updated competitor', { competitorId });

    return competitor;
  }

  /**
   * Delete competitor
   */
  async deleteCompetitor(competitorId: string): Promise<void> {
    this.competitors.delete(competitorId);

    logger.info('Deleted competitor', { competitorId });
  }

  /**
   * Generate SWOT analysis
   */
  async generateSWOT(competitorId: string): Promise<SWOTAnalysis> {
    const competitor = this.competitors.get(competitorId);
    if (!competitor) throw new Error(`Competitor ${competitorId} not found`);

    // Analyze features
    const featureCount = competitor.features.filter(f => f.available).length;
    const highQualityFeatures = competitor.features.filter(f => f.quality === 'excellent').length;

    const strengths: SWOTItem[] = [];
    const weaknesses: SWOTItem[] = [];
    const opportunities: SWOTItem[] = [];
    const threats: SWOTItem[] = [];

    // Auto-generate SWOT based on data
    if (featureCount > 20) {
      strengths.push({
        description: 'Comprehensive feature set',
        impact: 'high',
        category: 'product',
      });
    } else {
      weaknesses.push({
        description: 'Limited feature offering',
        impact: 'medium',
        category: 'product',
      });
    }

    if (highQualityFeatures > 10) {
      strengths.push({
        description: 'High-quality feature implementation',
        impact: 'high',
        category: 'product',
      });
    }

    if (competitor.sentiment.customerSatisfaction > 80) {
      strengths.push({
        description: 'Strong customer satisfaction',
        impact: 'high',
        category: 'customer',
      });
    } else if (competitor.sentiment.customerSatisfaction < 60) {
      weaknesses.push({
        description: 'Below-average customer satisfaction',
        impact: 'medium',
        category: 'customer',
      });
    }

    if (competitor.sentiment.brandAwareness < 50) {
      opportunities.push({
        description: 'Low brand awareness presents opportunity for differentiation',
        impact: 'medium',
        category: 'marketing',
      });
    }

    if (competitor.marketPosition === 'leader') {
      threats.push({
        description: 'Market leader with strong position',
        impact: 'high',
        category: 'competition',
      });
    }

    const recommendations = this.generateRecommendations(strengths, weaknesses, opportunities, threats);

    return {
      competitorId,
      strengths,
      weaknesses,
      opportunities,
      threats,
      summary: this.generateSWOTSummary(strengths, weaknesses, opportunities, threats),
      recommendations,
      generatedAt: new Date(),
    };
  }

  /**
   * Create competitive matrix
   */
  async createCompetitiveMatrix(
    name: string,
    competitorIds: string[],
    features: string[]
  ): Promise<CompetitiveMatrix> {
    const matrixId = crypto.randomUUID();

    const data: CompetitiveMatrix['data'] = {};

    for (const competitorId of competitorIds) {
      const competitor = this.competitors.get(competitorId);
      if (!competitor) continue;

      data[competitorId] = {};

      for (const feature of features) {
        const hasFeature = competitor.features.some(
          f => f.name.toLowerCase().includes(feature.toLowerCase()) && f.available
        );
        data[competitorId][feature] = hasFeature;
      }
    }

    const matrix: CompetitiveMatrix = {
      id: matrixId,
      name,
      competitors: competitorIds,
      features,
      data,
      createdAt: new Date(),
    };

    this.matrices.set(matrixId, matrix);

    logger.info('Created competitive matrix', { matrixId, name });

    return matrix;
  }

  /**
   * Generate market positioning map
   */
  async generatePositioningMap(
    name: string,
    xAxis: string,
    yAxis: string,
    competitorIds: string[]
  ): Promise<MarketPositioningMap> {
    const competitors = competitorIds
      .map(id => this.competitors.get(id))
      .filter((c): c is Competitor => c !== undefined);

    // Calculate positions based on pricing and features (simplified)
    const positions = competitors.map(c => {
      let x = 50; // Default middle
      let y = 50;

      if (xAxis.toLowerCase().includes('price')) {
        const avgPrice = c.pricing.reduce((sum, p) => sum + p.price, 0) / c.pricing.length || 0;
        x = Math.min(100, (avgPrice / 1000) * 100);
      }

      if (yAxis.toLowerCase().includes('feature')) {
        y = (c.features.filter(f => f.available).length / 50) * 100;
      }

      return {
        id: c.id,
        name: c.name,
        x: Math.min(100, Math.max(0, x)),
        y: Math.min(100, Math.max(0, y)),
      };
    });

    return {
      id: crypto.randomUUID(),
      name,
      xAxis,
      yAxis,
      competitors: positions,
      quadrants: {
        topLeft: 'Low Price, High Features',
        topRight: 'High Price, High Features',
        bottomLeft: 'Low Price, Low Features',
        bottomRight: 'High Price, Low Features',
      },
    };
  }

  /**
   * Track competitive trend
   */
  async trackTrend(
    competitorId: string,
    type: CompetitiveTrend['type'],
    title: string,
    description: string,
    impact: CompetitiveTrend['impact']
  ): Promise<CompetitiveTrend> {
    const trend: CompetitiveTrend = {
      id: crypto.randomUUID(),
      type,
      competitorId,
      title,
      description,
      impact,
      detectedAt: new Date(),
    };

    this.trends.push(trend);

    logger.info('Tracked competitive trend', { trendId: trend.id, type, competitorId });

    return trend;
  }

  /**
   * Get recent trends
   */
  getRecentTrends(limit = 20): CompetitiveTrend[] {
    return this.trends
      .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Generate competitive intelligence report
   */
  async generateReport(title: string, competitorIds?: string[]): Promise<CompetitiveIntelReport> {
    const competitors = competitorIds
      ? competitorIds.map(id => this.competitors.get(id)).filter((c): c is Competitor => c !== undefined)
      : Array.from(this.competitors.values());

    const keyFindings: string[] = [];
    const marketTrends: string[] = [];
    const recommendations: string[] = [];
    const threats: string[] = [];
    const opportunities: string[] = [];

    // Analyze competitors
    const leaders = competitors.filter(c => c.marketPosition === 'leader');
    const avgSatisfaction = competitors.reduce((sum, c) => sum + c.sentiment.customerSatisfaction, 0) / competitors.length;

    keyFindings.push(`Analyzed ${competitors.length} competitors across ${leaders.length} market leaders`);
    keyFindings.push(`Average customer satisfaction: ${avgSatisfaction.toFixed(1)}%`);

    // Market trends
    const recentTrends = this.getRecentTrends(10);
    const featureLaunches = recentTrends.filter(t => t.type === 'feature-launch').length;
    const pricingChanges = recentTrends.filter(t => t.type === 'pricing-change').length;

    if (featureLaunches > 0) {
      marketTrends.push(`${featureLaunches} new features launched recently`);
    }
    if (pricingChanges > 0) {
      marketTrends.push(`${pricingChanges} pricing changes detected`);
    }

    // Recommendations
    recommendations.push('Monitor market leaders for strategic shifts');
    recommendations.push('Track emerging competitors and disruptive innovations');
    recommendations.push('Analyze customer sentiment trends quarterly');

    // Threats and Opportunities
    threats.push('Increasing competition in key market segments');
    opportunities.push('Gaps in competitor feature offerings');

    const report: CompetitiveIntelReport = {
      id: crypto.randomUUID(),
      title,
      summary: `Competitive analysis of ${competitors.length} competitors with ${keyFindings.length} key findings`,
      competitors,
      keyFindings,
      marketTrends,
      recommendations,
      threats,
      opportunities,
      generatedAt: new Date(),
    };

    logger.info('Generated competitive intel report', { reportId: report.id });

    return report;
  }

  /**
   * Scrape features (simulated)
   */
  private async scrapeFeatures(_website: string): Promise<CompetitorFeature[]> {
    // Simulated feature detection
    const sampleFeatures = [
      'User Authentication',
      'Dashboard',
      'Analytics',
      'API Access',
      'Mobile App',
      'Integrations',
      'Custom Reports',
      'Team Collaboration',
      'Real-time Updates',
      'Export Functionality',
    ];

    return sampleFeatures.map(name => ({
      name,
      category: 'core',
      available: Math.random() > 0.3,
      quality: (['poor', 'fair', 'good', 'excellent'] as const)[Math.floor(Math.random() * 4)],
    }));
  }

  /**
   * Scrape pricing (simulated)
   */
  private async scrapePricing(_website: string): Promise<CompetitorPricing[]> {
    // Simulated pricing plans
    return [
      {
        plan: 'Free',
        price: 0,
        billing: 'monthly',
        features: ['Basic features', 'Limited users'],
      },
      {
        plan: 'Pro',
        price: 29,
        billing: 'monthly',
        features: ['All features', 'Up to 10 users', 'Priority support'],
      },
      {
        plan: 'Enterprise',
        price: 99,
        billing: 'monthly',
        features: ['Unlimited everything', 'Dedicated support', 'Custom integrations'],
      },
    ];
  }

  /**
   * Generate SWOT summary
   */
  private generateSWOTSummary(
    strengths: SWOTItem[],
    weaknesses: SWOTItem[],
    opportunities: SWOTItem[],
    threats: SWOTItem[]
  ): string {
    return `SWOT Analysis: ${strengths.length} strengths, ${weaknesses.length} weaknesses, ${opportunities.length} opportunities, ${threats.length} threats identified.`;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    strengths: SWOTItem[],
    weaknesses: SWOTItem[],
    _opportunities: SWOTItem[],
    _threats: SWOTItem[]
  ): string[] {
    const recommendations: string[] = [];

    if (strengths.length > weaknesses.length) {
      recommendations.push('Leverage strengths for market differentiation');
    } else {
      recommendations.push('Address critical weaknesses before market expansion');
    }

    recommendations.push('Monitor competitive landscape for emerging threats');
    recommendations.push('Capitalize on identified opportunities within 6 months');

    return recommendations;
  }

  /**
   * Initialize sample competitors
   */
  private initializeSampleCompetitors(): void {
    // Add sample competitors for demo
    const samples = [
      {
        name: 'Market Leader Inc',
        website: 'https://marketleader.com',
        description: 'Industry leading platform',
        category: 'direct' as const,
        marketPosition: 'leader' as const,
      },
      {
        name: 'Challenger Co',
        website: 'https://challenger.com',
        description: 'Fast-growing challenger brand',
        category: 'direct' as const,
        marketPosition: 'challenger' as const,
      },
      {
        name: 'Niche Player',
        website: 'https://nicheplayer.com',
        description: 'Specialized solution provider',
        category: 'indirect' as const,
        marketPosition: 'niche' as const,
      },
    ];

    samples.forEach(async sample => {
      await this.addCompetitor(sample.name, sample.website, sample.description, sample.category);
    });
  }
}

export const competitiveAnalysisService = CompetitiveAnalysisService.getInstance();
