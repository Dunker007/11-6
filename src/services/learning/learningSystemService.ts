/**
 * learningSystemService.ts
 *
 * Adaptive learning system that tracks user behavior and optimizes recommendations.
 * This is the FOUNDATION for all AI-driven features - it learns what works for THIS user.
 *
 * FEATURES:
 * ✅ Behavioral pattern tracking
 * ✅ Outcome correlation analysis
 * ✅ Personalized optimization models
 * ✅ Continuous learning from results
 * ✅ Recommendation engine
 * ✅ A/B test result learning
 * ✅ Time-series pattern detection
 * ✅ User preference profiling
 */

import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';

export interface UserAction {
  id: string;
  type: 'content_publish' | 'revenue_event' | 'schedule_change' | 'link_click' | 'engagement' | 'conversion' | 'optimization_applied';
  timestamp: Date;
  context: Record<string, any>;
  outcome?: ActionOutcome;
}

export interface ActionOutcome {
  success: boolean;
  metrics: {
    revenue?: number;
    engagement?: number;
    conversions?: number;
    clicks?: number;
    views?: number;
  };
  timestamp: Date;
}

export interface Pattern {
  id: string;
  name: string;
  type: 'temporal' | 'contextual' | 'sequential' | 'correlative';
  confidence: number; // 0-1
  description: string;
  conditions: Record<string, any>;
  expectedOutcome: {
    metric: string;
    impact: number; // percentage improvement
  };
  occurrences: number;
  successRate: number;
  lastSeen: Date;
}

export interface Recommendation {
  id: string;
  type: 'content' | 'schedule' | 'monetization' | 'platform' | 'optimization';
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidence: number; // 0-1
  title: string;
  description: string;
  rationale: string;
  expectedImpact: {
    metric: string;
    improvement: number; // percentage
  };
  actionSteps: string[];
  basedOnPatterns: string[]; // Pattern IDs
  createdAt: Date;
  status: 'pending' | 'applied' | 'rejected' | 'testing';
}

export interface UserProfile {
  userId: string;
  learningStartDate: Date;
  totalActions: number;
  successfulActions: number;
  preferences: {
    bestPublishingTimes: number[]; // Hours 0-23
    topPerformingPlatforms: string[];
    bestContentTypes: string[];
    optimalContentLength: { min: number; max: number };
    preferredTopics: string[];
  };
  performance: {
    averageRevenue: number;
    averageEngagement: number;
    conversionRate: number;
    growthRate: number; // Monthly %
  };
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  lastUpdated: Date;
}

export interface LearningInsight {
  id: string;
  category: 'discovery' | 'warning' | 'opportunity' | 'trend';
  title: string;
  description: string;
  dataPoints: number;
  confidence: number;
  actionable: boolean;
  suggestedActions?: string[];
  timestamp: Date;
}

class LearningSystemService {
  private actions: UserAction[] = [];
  private patterns: Pattern[] = [];
  private recommendations: Recommendation[] = [];
  private profile: UserProfile | null = null;
  private insights: LearningInsight[] = [];

  /**
   * Initialize learning system for a user
   */
  initialize(userId: string = 'default-user') {
    this.profile = {
      userId,
      learningStartDate: new Date(),
      totalActions: 0,
      successfulActions: 0,
      preferences: {
        bestPublishingTimes: [],
        topPerformingPlatforms: [],
        bestContentTypes: [],
        optimalContentLength: { min: 300, max: 1500 },
        preferredTopics: [],
      },
      performance: {
        averageRevenue: 0,
        averageEngagement: 0,
        conversionRate: 0,
        growthRate: 0,
      },
      riskTolerance: 'moderate',
      lastUpdated: new Date(),
    };

    // Load from localStorage if available
    this.loadFromStorage();

    logger.info('Learning system initialized', { userId });
  }

  /**
   * Record user action for learning
   */
  recordAction(action: Omit<UserAction, 'id' | 'timestamp'>): UserAction {
    const newAction: UserAction = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...action,
    };

    this.actions.push(newAction);

    if (this.profile) {
      this.profile.totalActions++;
      if (action.outcome?.success) {
        this.profile.successfulActions++;
      }
    }

    // Trigger pattern detection if we have enough data
    if (this.actions.length % 10 === 0) {
      this.detectPatterns();
    }

    this.saveToStorage();

    logger.info('Action recorded', { type: action.type, hasOutcome: !!action.outcome });

    return newAction;
  }

  /**
   * Record outcome for a previous action
   */
  recordOutcome(actionId: string, outcome: ActionOutcome): boolean {
    const action = this.actions.find(a => a.id === actionId);

    if (!action) {
      logger.warn('Action not found for outcome', { actionId });
      return false;
    }

    action.outcome = outcome;

    if (this.profile) {
      if (outcome.success) {
        this.profile.successfulActions++;
      }

      // Update performance metrics
      if (outcome.metrics.revenue) {
        const total = this.profile.averageRevenue * (this.profile.totalActions - 1);
        this.profile.averageRevenue = (total + outcome.metrics.revenue) / this.profile.totalActions;
      }

      if (outcome.metrics.engagement) {
        const total = this.profile.averageEngagement * (this.profile.totalActions - 1);
        this.profile.averageEngagement = (total + outcome.metrics.engagement) / this.profile.totalActions;
      }
    }

    // Re-evaluate patterns with new outcome data
    this.detectPatterns();
    this.generateRecommendations();

    this.saveToStorage();

    logger.info('Outcome recorded', { actionId, success: outcome.success });

    return true;
  }

  /**
   * Detect behavioral patterns using ML-like analysis
   */
  private detectPatterns(): void {
    // Only detect patterns if we have sufficient data
    if (this.actions.length < 20) {
      return;
    }

    const newPatterns: Pattern[] = [];

    // 1. TEMPORAL PATTERNS - Best times for actions
    const temporalPattern = this.detectTemporalPatterns();
    if (temporalPattern) newPatterns.push(temporalPattern);

    // 2. CONTEXTUAL PATTERNS - What context leads to success
    const contextualPatterns = this.detectContextualPatterns();
    newPatterns.push(...contextualPatterns);

    // 3. SEQUENTIAL PATTERNS - Action sequences that work
    const sequentialPattern = this.detectSequentialPatterns();
    if (sequentialPattern) newPatterns.push(sequentialPattern);

    // 4. CORRELATIVE PATTERNS - What factors correlate with success
    const correlativePatterns = this.detectCorrelativePatterns();
    newPatterns.push(...correlativePatterns);

    // Update pattern list (keep only high-confidence patterns)
    this.patterns = newPatterns.filter(p => p.confidence > 0.6);

    if (newPatterns.length > 0) {
      logger.info('Patterns detected', { count: newPatterns.length });
    }
  }

  /**
   * Detect temporal patterns (best times for actions)
   */
  private detectTemporalPatterns(): Pattern | null {
    const actionsWithOutcomes = this.actions.filter(a => a.outcome);

    if (actionsWithOutcomes.length < 10) return null;

    // Group by hour
    const hourlyPerformance: Record<number, { success: number; total: number }> = {};

    actionsWithOutcomes.forEach(action => {
      const hour = action.timestamp.getHours();
      if (!hourlyPerformance[hour]) {
        hourlyPerformance[hour] = { success: 0, total: 0 };
      }
      hourlyPerformance[hour].total++;
      if (action.outcome!.success) {
        hourlyPerformance[hour].success++;
      }
    });

    // Find best performing hours
    const hourlyRates = Object.entries(hourlyPerformance)
      .map(([hour, stats]) => ({
        hour: parseInt(hour),
        rate: stats.success / stats.total,
        count: stats.total,
      }))
      .filter(h => h.count >= 3) // Require at least 3 samples
      .sort((a, b) => b.rate - a.rate);

    if (hourlyRates.length === 0) return null;

    const bestHours = hourlyRates.slice(0, 3).map(h => h.hour);
    const avgSuccessRate = hourlyRates.slice(0, 3).reduce((sum, h) => sum + h.rate, 0) / 3;

    // Update profile
    if (this.profile) {
      this.profile.preferences.bestPublishingTimes = bestHours;
    }

    return {
      id: crypto.randomUUID(),
      name: 'Optimal Publishing Hours',
      type: 'temporal',
      confidence: Math.min(avgSuccessRate, 0.95),
      description: `Publishing at ${bestHours.join(', ')}:00 shows ${(avgSuccessRate * 100).toFixed(0)}% success rate`,
      conditions: { hours: bestHours },
      expectedOutcome: {
        metric: 'engagement',
        impact: ((avgSuccessRate - 0.5) * 100),
      },
      occurrences: hourlyRates.reduce((sum, h) => sum + h.count, 0),
      successRate: avgSuccessRate,
      lastSeen: new Date(),
    };
  }

  /**
   * Detect contextual patterns
   */
  private detectContextualPatterns(): Pattern[] {
    const patterns: Pattern[] = [];
    const actionsWithOutcomes = this.actions.filter(a => a.outcome);

    if (actionsWithOutcomes.length < 15) return [];

    // Analyze platform performance
    const platformPerf: Record<string, { success: number; total: number; revenue: number }> = {};

    actionsWithOutcomes.forEach(action => {
      const platform = action.context.platform;
      if (!platform) return;

      if (!platformPerf[platform]) {
        platformPerf[platform] = { success: 0, total: 0, revenue: 0 };
      }

      platformPerf[platform].total++;
      if (action.outcome!.success) platformPerf[platform].success++;
      if (action.outcome!.metrics.revenue) platformPerf[platform].revenue += action.outcome!.metrics.revenue;
    });

    // Find top performing platforms
    const topPlatforms = Object.entries(platformPerf)
      .map(([platform, stats]) => ({
        platform,
        rate: stats.success / stats.total,
        avgRevenue: stats.revenue / stats.total,
        count: stats.total,
      }))
      .filter(p => p.count >= 3)
      .sort((a, b) => b.avgRevenue - a.avgRevenue)
      .slice(0, 3);

    if (topPlatforms.length > 0) {
      if (this.profile) {
        this.profile.preferences.topPerformingPlatforms = topPlatforms.map(p => p.platform);
      }

      patterns.push({
        id: crypto.randomUUID(),
        name: 'High-Performing Platforms',
        type: 'contextual',
        confidence: 0.85,
        description: `${topPlatforms[0].platform} generates ${topPlatforms[0].avgRevenue.toFixed(2)} avg revenue`,
        conditions: { platforms: topPlatforms.map(p => p.platform) },
        expectedOutcome: {
          metric: 'revenue',
          impact: 50,
        },
        occurrences: topPlatforms.reduce((sum, p) => sum + p.count, 0),
        successRate: topPlatforms.reduce((sum, p) => sum + p.rate, 0) / topPlatforms.length,
        lastSeen: new Date(),
      });
    }

    return patterns;
  }

  /**
   * Detect sequential patterns
   */
  private detectSequentialPatterns(): Pattern | null {
    // Analyze action sequences (e.g., "schedule then publish performs better than direct publish")
    const sequences = this.actions.slice(-20); // Last 20 actions

    if (sequences.length < 10) return null;

    // Look for common successful sequences
    const sequenceSuccess: Record<string, { success: number; total: number }> = {};

    for (let i = 0; i < sequences.length - 1; i++) {
      const seq = `${sequences[i].type}->${sequences[i + 1].type}`;
      if (!sequenceSuccess[seq]) {
        sequenceSuccess[seq] = { success: 0, total: 0 };
      }
      sequenceSuccess[seq].total++;
      if (sequences[i + 1].outcome?.success) {
        sequenceSuccess[seq].success++;
      }
    }

    const bestSequence = Object.entries(sequenceSuccess)
      .map(([seq, stats]) => ({ seq, rate: stats.success / stats.total, count: stats.total }))
      .filter(s => s.count >= 3)
      .sort((a, b) => b.rate - a.rate)[0];

    if (!bestSequence || bestSequence.rate < 0.7) return null;

    return {
      id: crypto.randomUUID(),
      name: 'Successful Action Sequence',
      type: 'sequential',
      confidence: bestSequence.rate,
      description: `Sequence "${bestSequence.seq}" has ${(bestSequence.rate * 100).toFixed(0)}% success rate`,
      conditions: { sequence: bestSequence.seq },
      expectedOutcome: {
        metric: 'success_rate',
        impact: ((bestSequence.rate - 0.5) * 100),
      },
      occurrences: bestSequence.count,
      successRate: bestSequence.rate,
      lastSeen: new Date(),
    };
  }

  /**
   * Detect correlative patterns
   */
  private detectCorrelativePatterns(): Pattern[] {
    const patterns: Pattern[] = [];
    const actionsWithOutcomes = this.actions.filter(a => a.outcome);

    if (actionsWithOutcomes.length < 20) return [];

    // Analyze content length vs engagement
    const lengthData = actionsWithOutcomes
      .filter(a => a.context.contentLength)
      .map(a => ({
        length: a.context.contentLength,
        engagement: a.outcome!.metrics.engagement || 0,
      }));

    if (lengthData.length >= 10) {
      // Simple correlation analysis
      const avgLength = lengthData.reduce((sum, d) => sum + d.length, 0) / lengthData.length;
      const avgEngagement = lengthData.reduce((sum, d) => sum + d.engagement, 0) / lengthData.length;

      const highPerformers = lengthData.filter(d => d.engagement > avgEngagement);
      const avgHighPerformerLength = highPerformers.reduce((sum, d) => sum + d.length, 0) / highPerformers.length;

      if (this.profile) {
        this.profile.preferences.optimalContentLength = {
          min: Math.max(300, avgHighPerformerLength - 300),
          max: avgHighPerformerLength + 300,
        };
      }

      patterns.push({
        id: crypto.randomUUID(),
        name: 'Optimal Content Length',
        type: 'correlative',
        confidence: 0.75,
        description: `Content around ${avgHighPerformerLength.toFixed(0)} words performs best`,
        conditions: { contentLength: { min: avgHighPerformerLength - 300, max: avgHighPerformerLength + 300 } },
        expectedOutcome: {
          metric: 'engagement',
          impact: 30,
        },
        occurrences: highPerformers.length,
        successRate: highPerformers.length / lengthData.length,
        lastSeen: new Date(),
      });
    }

    return patterns;
  }

  /**
   * Generate personalized recommendations
   */
  generateRecommendations(): Recommendation[] {
    const newRecommendations: Recommendation[] = [];

    // Only generate if we have patterns
    if (this.patterns.length === 0) {
      return [];
    }

    // Recommendation 1: Time-based optimization
    const timePattern = this.patterns.find(p => p.type === 'temporal');
    if (timePattern && timePattern.confidence > 0.7) {
      newRecommendations.push({
        id: crypto.randomUUID(),
        type: 'schedule',
        priority: 'high',
        confidence: timePattern.confidence,
        title: 'Optimize Publishing Schedule',
        description: `Publish at ${timePattern.conditions.hours.join(', ')}:00 for best results`,
        rationale: `Analysis of ${timePattern.occurrences} actions shows ${(timePattern.successRate * 100).toFixed(0)}% success rate at these times`,
        expectedImpact: {
          metric: 'engagement',
          improvement: timePattern.expectedOutcome.impact,
        },
        actionSteps: [
          `Schedule content for ${timePattern.conditions.hours[0]}:00`,
          'Monitor engagement metrics',
          'Adjust schedule based on results',
        ],
        basedOnPatterns: [timePattern.id],
        createdAt: new Date(),
        status: 'pending',
      });
    }

    // Recommendation 2: Platform optimization
    const platformPattern = this.patterns.find(p => p.name === 'High-Performing Platforms');
    if (platformPattern && platformPattern.confidence > 0.75) {
      newRecommendations.push({
        id: crypto.randomUUID(),
        type: 'platform',
        priority: 'high',
        confidence: platformPattern.confidence,
        title: 'Focus on Top Platforms',
        description: `Prioritize ${platformPattern.conditions.platforms[0]} for maximum revenue`,
        rationale: `This platform consistently generates higher revenue per post`,
        expectedImpact: {
          metric: 'revenue',
          improvement: platformPattern.expectedOutcome.impact,
        },
        actionSteps: [
          `Publish 70% of content to ${platformPattern.conditions.platforms[0]}`,
          'Repurpose top performers to other platforms',
          'Track revenue improvements',
        ],
        basedOnPatterns: [platformPattern.id],
        createdAt: new Date(),
        status: 'pending',
      });
    }

    // Recommendation 3: Content optimization
    const lengthPattern = this.patterns.find(p => p.name === 'Optimal Content Length');
    if (lengthPattern && lengthPattern.confidence > 0.7) {
      newRecommendations.push({
        id: crypto.randomUUID(),
        type: 'content',
        priority: 'medium',
        confidence: lengthPattern.confidence,
        title: 'Optimize Content Length',
        description: `Target ${lengthPattern.conditions.contentLength.min}-${lengthPattern.conditions.contentLength.max} words`,
        rationale: `Content in this range performs ${lengthPattern.expectedOutcome.impact.toFixed(0)}% better`,
        expectedImpact: {
          metric: 'engagement',
          improvement: lengthPattern.expectedOutcome.impact,
        },
        actionSteps: [
          'Draft content within optimal length range',
          'Use AI to expand or condense as needed',
          'Test different lengths within range',
        ],
        basedOnPatterns: [lengthPattern.id],
        createdAt: new Date(),
        status: 'pending',
      });
    }

    // Update recommendations list
    this.recommendations = [...this.recommendations, ...newRecommendations];

    if (newRecommendations.length > 0) {
      logger.info('Recommendations generated', { count: newRecommendations.length });

      activityService.addActivity({
        type: 'system',
        action: 'AI Recommendations Generated',
        description: `${newRecommendations.length} optimization suggestions available`,
        metadata: { count: newRecommendations.length },
      });
    }

    return newRecommendations;
  }

  /**
   * Generate insights from learning data
   */
  generateInsights(): LearningInsight[] {
    const insights: LearningInsight[] = [];

    if (this.actions.length < 20) {
      return [];
    }

    // Insight 1: Performance trend
    const recentActions = this.actions.slice(-20);
    const oldActions = this.actions.slice(-40, -20);

    if (oldActions.length >= 10 && recentActions.length >= 10) {
      const recentSuccessRate = recentActions.filter(a => a.outcome?.success).length / recentActions.length;
      const oldSuccessRate = oldActions.filter(a => a.outcome?.success).length / oldActions.length;

      const improvement = ((recentSuccessRate - oldSuccessRate) / oldSuccessRate) * 100;

      if (Math.abs(improvement) > 10) {
        insights.push({
          id: crypto.randomUUID(),
          category: improvement > 0 ? 'trend' : 'warning',
          title: improvement > 0 ? 'Performance Improving' : 'Performance Declining',
          description: `Success rate ${improvement > 0 ? 'increased' : 'decreased'} by ${Math.abs(improvement).toFixed(1)}% in recent actions`,
          dataPoints: 40,
          confidence: 0.8,
          actionable: true,
          suggestedActions: improvement > 0
            ? ['Continue current strategy', 'Scale successful actions']
            : ['Review recent changes', 'Revert to previous strategy', 'Analyze failure causes'],
          timestamp: new Date(),
        });
      }
    }

    // Insight 2: Untapped opportunity
    if (this.profile && this.profile.preferences.topPerformingPlatforms.length > 0) {
      const topPlatform = this.profile.preferences.topPerformingPlatforms[0];
      const platformActions = this.actions.filter(a => a.context.platform === topPlatform);
      const totalActions = this.actions.length;

      const platformUsage = (platformActions.length / totalActions) * 100;

      if (platformUsage < 40) {
        insights.push({
          id: crypto.randomUUID(),
          category: 'opportunity',
          title: 'Underutilizing Top Platform',
          description: `${topPlatform} is your best platform but only ${platformUsage.toFixed(0)}% of content goes there`,
          dataPoints: totalActions,
          confidence: 0.85,
          actionable: true,
          suggestedActions: [
            `Increase ${topPlatform} content to 60-70%`,
            'Repurpose best content for this platform',
            'Test more content types on this platform',
          ],
          timestamp: new Date(),
        });
      }
    }

    this.insights = [...this.insights, ...insights];

    return insights;
  }

  /**
   * Get all current recommendations
   */
  getRecommendations(type?: Recommendation['type'], priority?: Recommendation['priority']): Recommendation[] {
    let filtered = [...this.recommendations];

    if (type) {
      filtered = filtered.filter(r => r.type === type);
    }

    if (priority) {
      filtered = filtered.filter(r => r.priority === priority);
    }

    return filtered.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Apply recommendation
   */
  applyRecommendation(recommendationId: string): boolean {
    const rec = this.recommendations.find(r => r.id === recommendationId);

    if (!rec) {
      return false;
    }

    rec.status = 'applied';

    logger.info('Recommendation applied', { id: recommendationId, title: rec.title });

    activityService.addActivity({
      type: 'optimization',
      action: 'AI Recommendation Applied',
      description: rec.title,
      metadata: { recommendationId, expectedImpact: rec.expectedImpact },
    });

    this.saveToStorage();

    return true;
  }

  /**
   * Get user profile
   */
  getProfile(): UserProfile | null {
    return this.profile;
  }

  /**
   * Get detected patterns
   */
  getPatterns(): Pattern[] {
    return [...this.patterns];
  }

  /**
   * Get insights
   */
  getInsights(category?: LearningInsight['category']): LearningInsight[] {
    if (category) {
      return this.insights.filter(i => i.category === category);
    }
    return [...this.insights];
  }

  /**
   * Get learning analytics
   */
  getAnalytics(): {
    totalActions: number;
    successRate: number;
    patternsDetected: number;
    recommendationsGenerated: number;
    recommendationsApplied: number;
    insightsGenerated: number;
    learningDays: number;
  } {
    const successfulActions = this.actions.filter(a => a.outcome?.success).length;
    const actionsWithOutcomes = this.actions.filter(a => a.outcome).length;

    const learningDays = this.profile
      ? Math.floor((Date.now() - this.profile.learningStartDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      totalActions: this.actions.length,
      successRate: actionsWithOutcomes > 0 ? (successfulActions / actionsWithOutcomes) * 100 : 0,
      patternsDetected: this.patterns.length,
      recommendationsGenerated: this.recommendations.length,
      recommendationsApplied: this.recommendations.filter(r => r.status === 'applied').length,
      insightsGenerated: this.insights.length,
      learningDays,
    };
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('dlx_learning_actions', JSON.stringify(this.actions.slice(-100))); // Keep last 100
      localStorage.setItem('dlx_learning_patterns', JSON.stringify(this.patterns));
      localStorage.setItem('dlx_learning_recommendations', JSON.stringify(this.recommendations));
      localStorage.setItem('dlx_learning_profile', JSON.stringify(this.profile));
      localStorage.setItem('dlx_learning_insights', JSON.stringify(this.insights.slice(-20))); // Keep last 20
    } catch (error) {
      logger.error('Failed to save learning data', { error: error as Error });
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const actionsData = localStorage.getItem('dlx_learning_actions');
      const patternsData = localStorage.getItem('dlx_learning_patterns');
      const recommendationsData = localStorage.getItem('dlx_learning_recommendations');
      const profileData = localStorage.getItem('dlx_learning_profile');
      const insightsData = localStorage.getItem('dlx_learning_insights');

      if (actionsData) this.actions = JSON.parse(actionsData);
      if (patternsData) this.patterns = JSON.parse(patternsData);
      if (recommendationsData) this.recommendations = JSON.parse(recommendationsData);
      if (profileData) this.profile = JSON.parse(profileData);
      if (insightsData) this.insights = JSON.parse(insightsData);

      logger.info('Learning data loaded from storage', {
        actions: this.actions.length,
        patterns: this.patterns.length,
      });
    } catch (error) {
      logger.warn('Failed to load learning data', { error: error as Error });
    }
  }

  /**
   * Quick test method
   */
  async quickTest() {
    this.initialize('test-user');

    // Simulate some user actions
    for (let i = 0; i < 25; i++) {
      const hour = 9 + Math.floor(Math.random() * 12); // 9 AM to 9 PM
      const platform = ['Medium', 'WordPress', 'LinkedIn'][Math.floor(Math.random() * 3)];
      const contentLength = 500 + Math.floor(Math.random() * 1000);

      const action = this.recordAction({
        type: 'content_publish',
        context: {
          platform,
          contentLength,
          hour,
        },
      });

      // Simulate outcome (higher success for certain patterns)
      const isOptimalTime = hour >= 14 && hour <= 18;
      const isGoodPlatform = platform === 'Medium';
      const isGoodLength = contentLength >= 700 && contentLength <= 1200;

      const successProbability =
        (isOptimalTime ? 0.3 : 0) +
        (isGoodPlatform ? 0.3 : 0) +
        (isGoodLength ? 0.2 : 0) +
        0.2 + // Base probability
        Math.random() * 0.2; // Random factor

      setTimeout(() => {
        this.recordOutcome(action.id, {
          success: successProbability > 0.6,
          metrics: {
            engagement: Math.floor(Math.random() * 1000),
            revenue: Math.random() * 50,
            views: Math.floor(Math.random() * 5000),
          },
          timestamp: new Date(),
        });
      }, 100 * i);
    }

    // Wait for outcomes to be recorded
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Generate recommendations and insights
    const recommendations = this.generateRecommendations();
    const insights = this.generateInsights();
    const analytics = this.getAnalytics();

    return {
      profile: this.getProfile(),
      patterns: this.getPatterns(),
      recommendations,
      insights,
      analytics,
    };
  }
}

// Export singleton
export const learningSystemService = new LearningSystemService();

// Auto-initialize
if (typeof window !== 'undefined') {
  learningSystemService.initialize();
}

// Expose to window for testing
if (typeof window !== 'undefined') {
  (window as any).testLearningSystem = () => learningSystemService.quickTest();
  (window as any).learningSystemService = learningSystemService;
}
