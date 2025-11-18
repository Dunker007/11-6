/**
 * Cross-Platform Content Recycler
 * Intelligently detects top-performing content and repurposes it across platforms
 * Automatic content adaptation with performance tracking
 */

import { learningSystemService } from '../learning/learningSystemService';
import { contentPerformancePredictorService } from '../ai/contentPerformancePredictorService';
import { smartSchedulerService } from '../scheduling/smartSchedulerService';
import { activityService } from '../activity/activityService';

export interface ContentPiece {
  id: string;
  title: string;
  content: string;
  platform: string;
  publishedAt: Date;
  performance: {
    views: number;
    engagement: number;
    clicks: number;
    shares: number;
    revenue: number;
    score: number; // 0-100 composite score
  };
  metadata: {
    topic: string;
    category: string;
    keywords: string[];
    length: number;
    format: 'article' | 'tutorial' | 'list' | 'review' | 'guide' | 'news';
  };
}

export interface RecyclingOpportunity {
  id: string;
  sourceContent: ContentPiece;
  targetPlatforms: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  reasoning: string;
  expectedImpact: {
    estimatedViews: number;
    estimatedEngagement: number;
    estimatedRevenue: number;
    confidence: number;
  };
  adaptations: PlatformAdaptation[];
  suggestedTiming: {
    platform: string;
    dayOfWeek: number;
    hour: number;
    score: number;
  }[];
  recyclingRules: {
    minimumTimeSinceOriginal: number; // Days
    maxRecycleCount: number;
    allowedModifications: ('title' | 'format' | 'length' | 'tone')[];
  };
}

export interface PlatformAdaptation {
  platform: string;
  adaptedTitle: string;
  adaptedContent: string;
  modifications: {
    type: 'shortened' | 'expanded' | 'reformatted' | 'retitled' | 'tone_adjusted';
    description: string;
  }[];
  predictedScore: number; // 0-100
  estimatedPerformance: {
    engagement: number;
    clicks: number;
    revenue: number;
  };
  optimizations: string[];
}

export interface RecycledContent {
  id: string;
  originalContentId: string;
  opportunityId: string;
  platform: string;
  adaptedTitle: string;
  adaptedContent: string;
  publishedAt?: Date;
  status: 'suggested' | 'scheduled' | 'published' | 'analyzing';
  performance?: {
    views: number;
    engagement: number;
    clicks: number;
    revenue: number;
  };
  comparisonToOriginal?: {
    performanceDelta: number; // Percentage
    successRating: 'excellent' | 'good' | 'average' | 'poor';
  };
}

export interface RecyclingStrategy {
  contentType: 'article' | 'tutorial' | 'list' | 'review' | 'guide' | 'news';
  platformMappings: Array<{
    from: string;
    to: string;
    adaptationRules: {
      titleMaxLength?: number;
      contentMaxLength?: number;
      contentMinLength?: number;
      formatChanges?: string[];
      toneAdjustments?: string[];
    };
    successRate: number; // Historical success rate
  }>;
}

export interface ContentFatigueAnalysis {
  contentId: string;
  recycleCount: number;
  platforms: string[];
  lastRecycledAt: Date;
  audienceOverlap: number; // 0-100% estimated overlap
  fatigueLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  recommendation: 'safe_to_recycle' | 'wait' | 'do_not_recycle';
  waitDays?: number;
}

class ContentRecyclerService {
  private static instance: ContentRecyclerService;
  private readonly STORAGE_KEY = 'dlx_content_recycler';
  private readonly MIN_PERFORMANCE_SCORE = 70; // Only recycle content scoring 70+
  private readonly MIN_TIME_BETWEEN_RECYCLES = 14; // Days
  private readonly MAX_RECYCLE_COUNT = 3; // Maximum times to recycle same content

  private data: {
    contentLibrary: ContentPiece[];
    opportunities: RecyclingOpportunity[];
    recycledContent: RecycledContent[];
    strategies: RecyclingStrategy[];
    fatigueAnalysis: ContentFatigueAnalysis[];
    autoRecycleEnabled: boolean;
  };

  private constructor() {
    this.data = {
      contentLibrary: [],
      opportunities: [],
      recycledContent: [],
      strategies: this.initializeStrategies(),
      fatigueAnalysis: [],
      autoRecycleEnabled: false,
    };
    this.loadData();
  }

  static getInstance(): ContentRecyclerService {
    if (!ContentRecyclerService.instance) {
      ContentRecyclerService.instance = new ContentRecyclerService();
    }
    return ContentRecyclerService.instance;
  }

  private loadData(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);

        // Convert date strings
        parsed.contentLibrary = parsed.contentLibrary?.map((c: any) => ({
          ...c,
          publishedAt: new Date(c.publishedAt),
        })) || [];
        parsed.recycledContent = parsed.recycledContent?.map((r: any) => ({
          ...r,
          publishedAt: r.publishedAt ? new Date(r.publishedAt) : undefined,
        })) || [];
        parsed.fatigueAnalysis = parsed.fatigueAnalysis?.map((f: any) => ({
          ...f,
          lastRecycledAt: new Date(f.lastRecycledAt),
        })) || [];

        // Merge with defaults
        this.data = {
          ...this.data,
          ...parsed,
          strategies: this.initializeStrategies(), // Always use latest strategies
        };
      }
    } catch (error) {
      console.error('Error loading content recycler data:', error);
    }
  }

  private saveData(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error('Error saving content recycler data:', error);
    }
  }

  /**
   * Initialize platform adaptation strategies
   */
  private initializeStrategies(): RecyclingStrategy[] {
    return [
      {
        contentType: 'article',
        platformMappings: [
          {
            from: 'medium',
            to: 'linkedin',
            adaptationRules: {
              titleMaxLength: 100,
              contentMaxLength: 1300,
              formatChanges: ['Add professional tone', 'Include industry insights'],
              toneAdjustments: ['More formal', 'Business-focused'],
            },
            successRate: 0.75,
          },
          {
            from: 'medium',
            to: 'twitter',
            adaptationRules: {
              titleMaxLength: 280,
              contentMaxLength: 280,
              formatChanges: ['Extract key insight', 'Add thread potential'],
              toneAdjustments: ['Concise', 'Attention-grabbing'],
            },
            successRate: 0.65,
          },
          {
            from: 'wordpress',
            to: 'medium',
            adaptationRules: {
              contentMaxLength: 3000,
              formatChanges: ['Simplify formatting', 'Remove heavy styling'],
              toneAdjustments: ['More conversational'],
            },
            successRate: 0.80,
          },
        ],
      },
      {
        contentType: 'tutorial',
        platformMappings: [
          {
            from: 'medium',
            to: 'github',
            adaptationRules: {
              formatChanges: ['Convert to README', 'Add code examples', 'Include setup steps'],
            },
            successRate: 0.70,
          },
          {
            from: 'wordpress',
            to: 'linkedin',
            adaptationRules: {
              contentMaxLength: 1500,
              formatChanges: ['Highlight practical value', 'Add career relevance'],
            },
            successRate: 0.68,
          },
        ],
      },
      {
        contentType: 'list',
        platformMappings: [
          {
            from: 'medium',
            to: 'twitter',
            adaptationRules: {
              formatChanges: ['Convert to thread', 'One item per tweet'],
            },
            successRate: 0.85,
          },
          {
            from: 'medium',
            to: 'linkedin',
            adaptationRules: {
              contentMaxLength: 1000,
              formatChanges: ['Professional framing', 'Industry context'],
            },
            successRate: 0.72,
          },
        ],
      },
    ];
  }

  /**
   * Add content to the library
   */
  addContent(content: ContentPiece): void {
    // Check if content already exists
    const existingIndex = this.data.contentLibrary.findIndex(c => c.id === content.id);

    if (existingIndex >= 0) {
      // Update existing
      this.data.contentLibrary[existingIndex] = content;
    } else {
      // Add new
      this.data.contentLibrary.push(content);
    }

    this.saveData();

    // Record in learning system
    learningSystemService.recordAction({
      id: `content-${content.id}`,
      type: 'content_publish',
      timestamp: content.publishedAt,
      context: {
        platform: content.platform,
        topic: content.metadata.topic,
        format: content.metadata.format,
      },
      outcome: {
        success: content.performance.score > 50,
        metrics: {
          engagement: content.performance.engagement,
          revenue: content.performance.revenue,
        },
        timestamp: new Date(),
      },
    });
  }

  /**
   * Scan for recycling opportunities
   */
  async scanForOpportunities(): Promise<RecyclingOpportunity[]> {
    const topContent = this.getTopPerformingContent(20);
    const newOpportunities: RecyclingOpportunity[] = [];

    for (const content of topContent) {
      // Check fatigue
      const fatigueAnalysis = this.analyzeFatigue(content.id);
      if (fatigueAnalysis.recommendation === 'do_not_recycle') {
        continue;
      }

      // Find suitable target platforms
      const targetPlatforms = this.findTargetPlatforms(content);

      if (targetPlatforms.length === 0) {
        continue;
      }

      // Generate adaptations for each platform
      const adaptations: PlatformAdaptation[] = [];
      const suggestedTiming: RecyclingOpportunity['suggestedTiming'] = [];

      for (const targetPlatform of targetPlatforms) {
        const adaptation = await this.generateAdaptation(content, targetPlatform);
        adaptations.push(adaptation);

        // Get optimal timing from smart scheduler
        const slots = await smartSchedulerService.predictOptimalSlots(targetPlatform, 1);
        if (slots.length > 0) {
          suggestedTiming.push({
            platform: targetPlatform,
            dayOfWeek: slots[0].dayOfWeek,
            hour: slots[0].hour,
            score: slots[0].score,
          });
        }
      }

      // Calculate expected impact
      const expectedImpact = this.calculateExpectedImpact(content, adaptations);

      const opportunity: RecyclingOpportunity = {
        id: `opp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sourceContent: content,
        targetPlatforms,
        priority: this.determinePriority(content, expectedImpact),
        reasoning: this.generateReasoning(content, targetPlatforms, expectedImpact),
        expectedImpact,
        adaptations,
        suggestedTiming,
        recyclingRules: {
          minimumTimeSinceOriginal: this.MIN_TIME_BETWEEN_RECYCLES,
          maxRecycleCount: this.MAX_RECYCLE_COUNT,
          allowedModifications: ['title', 'format', 'length', 'tone'],
        },
      };

      newOpportunities.push(opportunity);
    }

    // Sort by priority and expected impact
    const sortedOpportunities = newOpportunities.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.expectedImpact.estimatedRevenue - a.expectedImpact.estimatedRevenue;
    });

    // Keep top opportunities
    this.data.opportunities = sortedOpportunities.slice(0, 50);
    this.saveData();

    if (newOpportunities.length > 0) {
      activityService.logActivity({
        type: 'ai',
        message: `Found ${newOpportunities.length} content recycling opportunities`,
        metadata: {
          topOpportunities: newOpportunities.slice(0, 3).map(o => ({
            title: o.sourceContent.title,
            platforms: o.targetPlatforms,
            expectedRevenue: o.expectedImpact.estimatedRevenue,
          })),
        },
      });
    }

    return this.data.opportunities;
  }

  /**
   * Get top performing content
   */
  private getTopPerformingContent(limit: number = 20): ContentPiece[] {
    return this.data.contentLibrary
      .filter(c => c.performance.score >= this.MIN_PERFORMANCE_SCORE)
      .sort((a, b) => b.performance.score - a.performance.score)
      .slice(0, limit);
  }

  /**
   * Find suitable target platforms for content
   */
  private findTargetPlatforms(content: ContentPiece): string[] {
    const targetPlatforms: string[] = [];
    const sourcePlatform = content.platform;

    // Find strategies for this content type
    const strategy = this.data.strategies.find(s => s.contentType === content.metadata.format);

    if (!strategy) {
      return [];
    }

    // Get all possible target platforms from mappings
    for (const mapping of strategy.platformMappings) {
      if (mapping.from === sourcePlatform && mapping.successRate > 0.6) {
        // Check if content hasn't been recycled to this platform yet
        const alreadyRecycled = this.data.recycledContent.some(
          r => r.originalContentId === content.id && r.platform === mapping.to
        );

        if (!alreadyRecycled) {
          targetPlatforms.push(mapping.to);
        }
      }
    }

    return targetPlatforms;
  }

  /**
   * Generate platform-specific adaptation
   */
  private async generateAdaptation(
    content: ContentPiece,
    targetPlatform: string
  ): Promise<PlatformAdaptation> {
    // Find adaptation rules
    const strategy = this.data.strategies.find(s => s.contentType === content.metadata.format);
    const mapping = strategy?.platformMappings.find(
      m => m.from === content.platform && m.to === targetPlatform
    );

    if (!mapping) {
      throw new Error(`No adaptation strategy found for ${content.platform} -> ${targetPlatform}`);
    }

    let adaptedTitle = content.title;
    let adaptedContent = content.content;
    const modifications: PlatformAdaptation['modifications'] = [];

    // Apply title length constraints
    if (mapping.adaptationRules.titleMaxLength && adaptedTitle.length > mapping.adaptationRules.titleMaxLength) {
      adaptedTitle = adaptedTitle.substring(0, mapping.adaptationRules.titleMaxLength - 3) + '...';
      modifications.push({
        type: 'retitled',
        description: `Shortened title to ${mapping.adaptationRules.titleMaxLength} characters`,
      });
    }

    // Apply content length constraints
    if (mapping.adaptationRules.contentMaxLength && adaptedContent.length > mapping.adaptationRules.contentMaxLength) {
      // Intelligent shortening - keep intro and key points
      const sentences = adaptedContent.split(/[.!?]+/);
      const targetSentences = Math.ceil(sentences.length * (mapping.adaptationRules.contentMaxLength / content.content.length));
      adaptedContent = sentences.slice(0, targetSentences).join('. ') + '.';

      modifications.push({
        type: 'shortened',
        description: `Condensed from ${content.content.length} to ${adaptedContent.length} characters`,
      });
    }

    if (mapping.adaptationRules.contentMinLength && adaptedContent.length < mapping.adaptationRules.contentMinLength) {
      modifications.push({
        type: 'expanded',
        description: 'Content needs expansion for this platform',
      });
    }

    // Apply format changes
    if (mapping.adaptationRules.formatChanges) {
      modifications.push({
        type: 'reformatted',
        description: mapping.adaptationRules.formatChanges.join(', '),
      });
    }

    // Apply tone adjustments
    if (mapping.adaptationRules.toneAdjustments) {
      modifications.push({
        type: 'tone_adjusted',
        description: mapping.adaptationRules.toneAdjustments.join(', '),
      });
    }

    // Predict performance using content predictor
    const analysis = await contentPerformancePredictorService.analyzeContent(
      adaptedContent,
      adaptedTitle,
      targetPlatform
    );

    // Generate platform-specific optimizations
    const optimizations = analysis.improvements
      .filter(i => i.expectedImpact > 15)
      .map(i => i.suggestion);

    return {
      platform: targetPlatform,
      adaptedTitle,
      adaptedContent,
      modifications,
      predictedScore: analysis.score.overall,
      estimatedPerformance: {
        engagement: analysis.predictions.engagement.mid,
        clicks: analysis.predictions.clicks.mid,
        revenue: analysis.predictions.revenue.mid,
      },
      optimizations,
    };
  }

  /**
   * Calculate expected impact of recycling
   */
  private calculateExpectedImpact(
    content: ContentPiece,
    adaptations: PlatformAdaptation[]
  ): RecyclingOpportunity['expectedImpact'] {
    let totalViews = 0;
    let totalEngagement = 0;
    let totalRevenue = 0;
    let avgConfidence = 0;

    for (const adaptation of adaptations) {
      // Estimate views based on predicted score
      const estimatedViews = (adaptation.predictedScore / 100) * content.performance.views * 0.7; // 70% of original
      totalViews += estimatedViews;
      totalEngagement += adaptation.estimatedPerformance.engagement;
      totalRevenue += adaptation.estimatedPerformance.revenue;

      // Confidence based on predicted score and strategy success rate
      const strategy = this.data.strategies.find(s => s.contentType === content.metadata.format);
      const mapping = strategy?.platformMappings.find(m => m.to === adaptation.platform);
      const confidence = (adaptation.predictedScore / 100) * (mapping?.successRate || 0.5);
      avgConfidence += confidence;
    }

    avgConfidence = adaptations.length > 0 ? avgConfidence / adaptations.length : 0;

    return {
      estimatedViews: Math.round(totalViews),
      estimatedEngagement: Math.round(totalEngagement),
      estimatedRevenue: Math.round(totalRevenue * 100) / 100,
      confidence: Math.round(avgConfidence * 100) / 100,
    };
  }

  /**
   * Determine priority of recycling opportunity
   */
  private determinePriority(
    content: ContentPiece,
    expectedImpact: RecyclingOpportunity['expectedImpact']
  ): 'critical' | 'high' | 'medium' | 'low' {
    const revenueScore = expectedImpact.estimatedRevenue;
    const confidenceScore = expectedImpact.confidence;
    const performanceScore = content.performance.score;

    const compositeScore = (revenueScore * 0.4 + confidenceScore * 100 * 0.3 + performanceScore * 0.3);

    if (compositeScore >= 80) return 'critical';
    if (compositeScore >= 60) return 'high';
    if (compositeScore >= 40) return 'medium';
    return 'low';
  }

  /**
   * Generate reasoning for recycling opportunity
   */
  private generateReasoning(
    content: ContentPiece,
    targetPlatforms: string[],
    expectedImpact: RecyclingOpportunity['expectedImpact']
  ): string {
    const reasons: string[] = [];

    reasons.push(`Original content scored ${content.performance.score}/100 on ${content.platform}`);
    reasons.push(`Generated ${content.performance.engagement} engagement and $${content.performance.revenue} revenue`);
    reasons.push(`Can reach ${targetPlatforms.length} new platform(s): ${targetPlatforms.join(', ')}`);
    reasons.push(`Expected additional revenue: $${expectedImpact.estimatedRevenue.toFixed(2)}`);
    reasons.push(`Confidence: ${Math.round(expectedImpact.confidence * 100)}%`);

    return reasons.join('. ');
  }

  /**
   * Analyze content fatigue
   */
  analyzeFatigue(contentId: string): ContentFatigueAnalysis {
    const content = this.data.contentLibrary.find(c => c.id === contentId);
    if (!content) {
      throw new Error('Content not found');
    }

    // Find all recycled versions
    const recycled = this.data.recycledContent.filter(r => r.originalContentId === contentId);
    const platforms = recycled.map(r => r.platform);
    const lastRecycled = recycled.length > 0
      ? new Date(Math.max(...recycled.filter(r => r.publishedAt).map(r => r.publishedAt!.getTime())))
      : content.publishedAt;

    const daysSinceLastRecycle = (Date.now() - lastRecycled.getTime()) / (1000 * 60 * 60 * 24);

    // Estimate audience overlap (simplified)
    const audienceOverlap = this.estimateAudienceOverlap(content.platform, platforms);

    // Determine fatigue level
    let fatigueLevel: ContentFatigueAnalysis['fatigueLevel'] = 'none';
    let recommendation: ContentFatigueAnalysis['recommendation'] = 'safe_to_recycle';
    let waitDays: number | undefined;

    if (recycled.length >= this.MAX_RECYCLE_COUNT) {
      fatigueLevel = 'critical';
      recommendation = 'do_not_recycle';
    } else if (recycled.length >= 2) {
      fatigueLevel = 'high';
      if (daysSinceLastRecycle < this.MIN_TIME_BETWEEN_RECYCLES) {
        recommendation = 'wait';
        waitDays = Math.ceil(this.MIN_TIME_BETWEEN_RECYCLES - daysSinceLastRecycle);
      } else {
        recommendation = 'safe_to_recycle';
      }
    } else if (recycled.length === 1) {
      fatigueLevel = 'medium';
      if (daysSinceLastRecycle < this.MIN_TIME_BETWEEN_RECYCLES / 2) {
        recommendation = 'wait';
        waitDays = Math.ceil(this.MIN_TIME_BETWEEN_RECYCLES / 2 - daysSinceLastRecycle);
      } else {
        recommendation = 'safe_to_recycle';
      }
    } else if (audienceOverlap > 70) {
      fatigueLevel = 'low';
      recommendation = 'safe_to_recycle';
    }

    const analysis: ContentFatigueAnalysis = {
      contentId,
      recycleCount: recycled.length,
      platforms,
      lastRecycledAt: lastRecycled,
      audienceOverlap,
      fatigueLevel,
      recommendation,
      waitDays,
    };

    // Update stored analysis
    const existingIndex = this.data.fatigueAnalysis.findIndex(f => f.contentId === contentId);
    if (existingIndex >= 0) {
      this.data.fatigueAnalysis[existingIndex] = analysis;
    } else {
      this.data.fatigueAnalysis.push(analysis);
    }

    this.saveData();
    return analysis;
  }

  /**
   * Estimate audience overlap between platforms
   */
  private estimateAudienceOverlap(sourcePlatform: string, targetPlatforms: string[]): number {
    // Simplified overlap estimation
    const overlapMatrix: Record<string, Record<string, number>> = {
      'medium': { 'linkedin': 40, 'twitter': 30, 'wordpress': 20, 'github': 15 },
      'linkedin': { 'medium': 40, 'twitter': 50, 'wordpress': 15, 'github': 20 },
      'twitter': { 'medium': 30, 'linkedin': 50, 'wordpress': 10, 'github': 25 },
      'wordpress': { 'medium': 20, 'linkedin': 15, 'twitter': 10, 'github': 10 },
      'github': { 'medium': 15, 'linkedin': 20, 'twitter': 25, 'wordpress': 10 },
    };

    if (targetPlatforms.length === 0) return 0;

    const overlaps = targetPlatforms.map(target =>
      overlapMatrix[sourcePlatform]?.[target] || 20
    );

    return overlaps.reduce((sum, overlap) => sum + overlap, 0) / overlaps.length;
  }

  /**
   * Create recycled content (schedule or publish)
   */
  createRecycledContent(opportunityId: string, platformIndex: number): RecycledContent {
    const opportunity = this.data.opportunities.find(o => o.id === opportunityId);
    if (!opportunity) {
      throw new Error('Opportunity not found');
    }

    const adaptation = opportunity.adaptations[platformIndex];
    if (!adaptation) {
      throw new Error('Adaptation not found');
    }

    const recycled: RecycledContent = {
      id: `recycled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      originalContentId: opportunity.sourceContent.id,
      opportunityId,
      platform: adaptation.platform,
      adaptedTitle: adaptation.adaptedTitle,
      adaptedContent: adaptation.adaptedContent,
      status: 'suggested',
    };

    this.data.recycledContent.push(recycled);
    this.saveData();

    activityService.logActivity({
      type: 'content',
      message: `Created recycled content for ${adaptation.platform}`,
      metadata: {
        originalTitle: opportunity.sourceContent.title,
        newTitle: adaptation.adaptedTitle,
        platform: adaptation.platform,
      },
    });

    return recycled;
  }

  /**
   * Record performance of recycled content
   */
  recordRecycledPerformance(
    recycledId: string,
    performance: {
      views: number;
      engagement: number;
      clicks: number;
      revenue: number;
    }
  ): void {
    const recycled = this.data.recycledContent.find(r => r.id === recycledId);
    if (!recycled) {
      throw new Error('Recycled content not found');
    }

    recycled.performance = performance;
    recycled.status = 'analyzing';

    // Compare to original
    const original = this.data.contentLibrary.find(c => c.id === recycled.originalContentId);
    if (original) {
      // Calculate performance delta (accounting for different platforms)
      const originalEngagement = original.performance.engagement;
      const recycledEngagement = performance.engagement;

      const delta = originalEngagement > 0
        ? ((recycledEngagement - originalEngagement) / originalEngagement) * 100
        : 0;

      let successRating: 'excellent' | 'good' | 'average' | 'poor' = 'poor';
      if (delta >= 50) successRating = 'excellent';
      else if (delta >= 0) successRating = 'good';
      else if (delta >= -30) successRating = 'average';

      recycled.comparisonToOriginal = {
        performanceDelta: Math.round(delta),
        successRating,
      };

      // Update strategy success rates
      this.updateStrategySuccessRate(original.platform, recycled.platform, successRating);
    }

    this.saveData();

    activityService.logActivity({
      type: 'ai',
      message: `Recycled content performance recorded: ${recycled.comparisonToOriginal?.successRating || 'N/A'}`,
      metadata: {
        recycledId,
        performance,
        comparison: recycled.comparisonToOriginal,
      },
    });
  }

  /**
   * Update strategy success rates based on results
   */
  private updateStrategySuccessRate(
    fromPlatform: string,
    toPlatform: string,
    successRating: 'excellent' | 'good' | 'average' | 'poor'
  ): void {
    const ratingValues = { excellent: 1.0, good: 0.7, average: 0.5, poor: 0.2 };
    const ratingValue = ratingValues[successRating];

    for (const strategy of this.data.strategies) {
      const mapping = strategy.platformMappings.find(
        m => m.from === fromPlatform && m.to === toPlatform
      );

      if (mapping) {
        // Exponential moving average: new = 0.7 * old + 0.3 * new_value
        mapping.successRate = 0.7 * mapping.successRate + 0.3 * ratingValue;
      }
    }
  }

  /**
   * Enable auto-recycling
   */
  enableAutoRecycle(): void {
    this.data.autoRecycleEnabled = true;
    this.saveData();

    activityService.logActivity({
      type: 'system',
      message: 'Content auto-recycling enabled',
    });
  }

  /**
   * Disable auto-recycling
   */
  disableAutoRecycle(): void {
    this.data.autoRecycleEnabled = false;
    this.saveData();

    activityService.logActivity({
      type: 'system',
      message: 'Content auto-recycling disabled',
    });
  }

  /**
   * Get recycling opportunities
   */
  getOpportunities(limit: number = 20): RecyclingOpportunity[] {
    return this.data.opportunities.slice(0, limit);
  }

  /**
   * Get recycling performance summary
   */
  getPerformanceSummary(): {
    totalRecycled: number;
    totalRevenue: number;
    avgSuccessRate: number;
    topPerformers: RecycledContent[];
    platformBreakdown: Record<string, { count: number; avgPerformance: number }>;
  } {
    const totalRecycled = this.data.recycledContent.filter(r => r.status === 'published').length;
    const withPerformance = this.data.recycledContent.filter(r => r.performance);

    const totalRevenue = withPerformance.reduce(
      (sum, r) => sum + (r.performance?.revenue || 0),
      0
    );

    const successfulRecycles = withPerformance.filter(
      r => r.comparisonToOriginal?.successRating === 'excellent' ||
           r.comparisonToOriginal?.successRating === 'good'
    );

    const avgSuccessRate = withPerformance.length > 0
      ? (successfulRecycles.length / withPerformance.length) * 100
      : 0;

    const topPerformers = withPerformance
      .sort((a, b) => (b.performance?.revenue || 0) - (a.performance?.revenue || 0))
      .slice(0, 5);

    // Platform breakdown
    const platformBreakdown: Record<string, { count: number; avgPerformance: number }> = {};

    for (const recycled of withPerformance) {
      if (!platformBreakdown[recycled.platform]) {
        platformBreakdown[recycled.platform] = { count: 0, avgPerformance: 0 };
      }
      platformBreakdown[recycled.platform].count++;
      platformBreakdown[recycled.platform].avgPerformance += recycled.performance!.engagement;
    }

    for (const platform in platformBreakdown) {
      platformBreakdown[platform].avgPerformance /= platformBreakdown[platform].count;
      platformBreakdown[platform].avgPerformance = Math.round(platformBreakdown[platform].avgPerformance);
    }

    return {
      totalRecycled,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgSuccessRate: Math.round(avgSuccessRate),
      topPerformers,
      platformBreakdown,
    };
  }

  /**
   * Quick test function
   */
  quickTest(): void {
    console.log('=== Cross-Platform Content Recycler Test ===\n');

    // Add sample content
    const testContent: ContentPiece[] = [
      {
        id: 'content-1',
        title: '10 JavaScript Tips That Will Make You a Better Developer',
        content: 'Here are 10 essential JavaScript tips that every developer should know...',
        platform: 'medium',
        publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        performance: {
          views: 5000,
          engagement: 450,
          clicks: 180,
          shares: 85,
          revenue: 125.50,
          score: 88,
        },
        metadata: {
          topic: 'JavaScript',
          category: 'Programming',
          keywords: ['javascript', 'tips', 'development'],
          length: 1500,
          format: 'list',
        },
      },
      {
        id: 'content-2',
        title: 'Complete Guide to Building REST APIs',
        content: 'In this comprehensive tutorial, you will learn how to build production-ready REST APIs...',
        platform: 'wordpress',
        publishedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        performance: {
          views: 8000,
          engagement: 720,
          clicks: 320,
          shares: 150,
          revenue: 245.00,
          score: 92,
        },
        metadata: {
          topic: 'API Development',
          category: 'Web Development',
          keywords: ['api', 'rest', 'tutorial'],
          length: 3500,
          format: 'tutorial',
        },
      },
    ];

    testContent.forEach(c => this.addContent(c));
    console.log(`Added ${testContent.length} sample content pieces\n`);

    // Scan for opportunities
    this.scanForOpportunities().then(opportunities => {
      console.log('--- Recycling Opportunities ---');
      console.log(`Found ${opportunities.length} opportunities\n`);

      opportunities.slice(0, 3).forEach((opp, idx) => {
        console.log(`${idx + 1}. ${opp.sourceContent.title}`);
        console.log(`   Priority: ${opp.priority}`);
        console.log(`   Target platforms: ${opp.targetPlatforms.join(', ')}`);
        console.log(`   Expected revenue: $${opp.expectedImpact.estimatedRevenue}`);
        console.log(`   Confidence: ${Math.round(opp.expectedImpact.confidence * 100)}%`);
        console.log(`   Reasoning: ${opp.reasoning.substring(0, 100)}...`);

        console.log(`\n   Adaptations:`);
        opp.adaptations.forEach(adapt => {
          console.log(`     ${adapt.platform}:`);
          console.log(`       Score: ${adapt.predictedScore}/100`);
          console.log(`       Modifications: ${adapt.modifications.map(m => m.type).join(', ')}`);
          console.log(`       Estimated engagement: ${adapt.estimatedPerformance.engagement}`);
        });
        console.log('');
      });

      // Test fatigue analysis
      console.log('\n--- Fatigue Analysis ---');
      testContent.forEach(content => {
        const fatigue = this.analyzeFatigue(content.id);
        console.log(`${content.title}:`);
        console.log(`  Recycle count: ${fatigue.recycleCount}`);
        console.log(`  Fatigue level: ${fatigue.fatigueLevel}`);
        console.log(`  Recommendation: ${fatigue.recommendation}`);
        if (fatigue.waitDays) {
          console.log(`  Wait days: ${fatigue.waitDays}`);
        }
      });

      // Performance summary
      console.log('\n--- Performance Summary ---');
      const summary = this.getPerformanceSummary();
      console.log(`Total recycled: ${summary.totalRecycled}`);
      console.log(`Total revenue: $${summary.totalRevenue}`);
      console.log(`Avg success rate: ${summary.avgSuccessRate}%`);
    });
  }
}

export const contentRecyclerService = ContentRecyclerService.getInstance();

// Expose to window for testing
if (typeof window !== 'undefined') {
  (window as any).contentRecyclerService = contentRecyclerService;
}
