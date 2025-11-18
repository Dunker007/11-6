/**
 * AI Insights Service
 * Aggregates insights, patterns, and recommendations from all AI systems
 * Provides unified intelligence feed and actionable insights
 */

import { learningSystemService } from '../learning/learningSystemService';
import { revenueAnomalyService } from '../analytics/revenueAnomalyService';
import { contentPerformancePredictorService } from './contentPerformancePredictorService';
import { autoOptimizationService } from '../optimization/autoOptimizationService';
import { smartSchedulerService } from '../scheduling/smartSchedulerService';
import { contentRecyclerService } from '../content/contentRecyclerService';
import { idleProfitMaximizerService } from '../idle-computing/idleProfitMaximizerService';
import { emergencyResponseService } from '../safety/emergencyResponseService';
import { aiNotificationService } from './aiNotificationService';

export interface AIInsight {
  id: string;
  type: 'pattern' | 'anomaly' | 'opportunity' | 'recommendation' | 'prediction' | 'alert';
  source: string;
  title: string;
  description: string;
  confidence: number; // 0-1
  priority: 'low' | 'medium' | 'high' | 'critical';

  impact: {
    category: 'revenue' | 'engagement' | 'efficiency' | 'cost' | 'quality';
    estimated: number; // Dollar value or percentage
    timeframe: string;
  };

  actionable: boolean;
  actions?: Array<{
    label: string;
    description: string;
    automated: boolean;
  }>;

  metadata: Record<string, any>;
  timestamp: Date;
  expiresAt?: Date;
}

export interface AIActivityEvent {
  id: string;
  timestamp: Date;
  system: string;
  action: string;
  description: string;
  result?: 'success' | 'partial' | 'failed';
  impact?: {
    metric: string;
    value: number;
  };
  metadata?: Record<string, any>;
}

export interface InsightsSummary {
  totalInsights: number;
  byType: Record<AIInsight['type'], number>;
  byPriority: Record<AIInsight['priority'], number>;
  highValueOpportunities: number;
  criticalAlerts: number;
  actionableInsights: number;
  estimatedTotalImpact: number;
}

class AIInsightsService {
  private static instance: AIInsightsService;
  private readonly STORAGE_KEY = 'dlx_ai_insights';
  private readonly MAX_INSIGHTS = 200;
  private readonly MAX_ACTIVITY = 500;

  private data: {
    insights: AIInsight[];
    activityFeed: AIActivityEvent[];
    lastAggregation: Date;
  };

  private constructor() {
    this.data = {
      insights: [],
      activityFeed: [],
      lastAggregation: new Date(),
    };
    this.loadData();
  }

  static getInstance(): AIInsightsService {
    if (!AIInsightsService.instance) {
      AIInsightsService.instance = new AIInsightsService();
    }
    return AIInsightsService.instance;
  }

  private loadData(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.insights = parsed.insights?.map((i: any) => ({
          ...i,
          timestamp: new Date(i.timestamp),
          expiresAt: i.expiresAt ? new Date(i.expiresAt) : undefined,
        })) || [];
        parsed.activityFeed = parsed.activityFeed?.map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp),
        })) || [];
        parsed.lastAggregation = new Date(parsed.lastAggregation);
        this.data = { ...this.data, ...parsed };
      }
    } catch (error) {
      console.error('Error loading AI insights:', error);
    }
  }

  private saveData(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error('Error saving AI insights:', error);
    }
  }

  /**
   * Aggregate insights from all AI systems
   */
  async aggregateInsights(): Promise<AIInsight[]> {
    const newInsights: AIInsight[] = [];

    // 1. Learning System Patterns
    try {
      const recommendations = learningSystemService.generateRecommendations();
      for (const rec of recommendations) {
        newInsights.push({
          id: `insight-learning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'recommendation',
          source: 'Learning System',
          title: `${rec.type.replace('_', ' ').toUpperCase()}: ${rec.actionSteps[0]}`,
          description: `AI has learned that ${rec.actionSteps[0]} could improve ${rec.expectedImpact.metric} by ${rec.expectedImpact.improvement}%`,
          confidence: rec.confidence,
          priority: rec.priority,
          impact: {
            category: rec.type === 'monetization' || rec.type === 'optimization' ? 'revenue' : 'engagement',
            estimated: rec.expectedImpact.improvement,
            timeframe: '1-2 weeks',
          },
          actionable: true,
          actions: rec.actionSteps.map(step => ({
            label: step,
            description: `Implement: ${step}`,
            automated: false,
          })),
          metadata: { recommendation: rec },
          timestamp: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      }
    } catch (error) {
      console.error('Error aggregating learning insights:', error);
    }

    // 2. Revenue Anomalies
    try {
      const anomalies = revenueAnomalyService.getActiveAnomalies?.() || [];
      for (const anomaly of anomalies.slice(0, 5)) {
        newInsights.push({
          id: `insight-revenue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'anomaly',
          source: 'Revenue Anomaly Detector',
          title: `${anomaly.type.toUpperCase()}: ${anomaly.metrics.deviation}% deviation`,
          description: anomaly.investigation?.probableCauses?.[0] || `Revenue ${anomaly.type} detected`,
          confidence: anomaly.investigation?.confidence || 0.7,
          priority: anomaly.severity === 'critical' ? 'critical' : anomaly.severity === 'high' ? 'high' : 'medium',
          impact: {
            category: 'revenue',
            estimated: Math.abs(anomaly.metrics.currentValue - anomaly.metrics.expectedValue),
            timeframe: 'immediate',
          },
          actionable: true,
          actions: anomaly.recommendations?.map(rec => ({
            label: 'Investigate',
            description: rec,
            automated: false,
          })) || [],
          metadata: { anomaly },
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error('Error aggregating revenue insights:', error);
    }

    // 3. Optimization Opportunities
    try {
      const opportunities = autoOptimizationService.getPendingOptimizations?.() || [];
      for (const opp of opportunities.slice(0, 5)) {
        newInsights.push({
          id: `insight-opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'opportunity',
          source: 'Auto-Optimization Engine',
          title: `${opp.type.toUpperCase()}: ${opp.analysis.problem}`,
          description: opp.solution.description,
          confidence: opp.analysis.confidence,
          priority: opp.priority,
          impact: {
            category: opp.category,
            estimated: opp.solution.estimatedROI,
            timeframe: opp.solution.expectedImpact.timeframe,
          },
          actionable: true,
          actions: [{
            label: opp.implementation.autoImplementable ? 'Auto-Implement' : 'Manual Implementation Required',
            description: opp.solution.description,
            automated: opp.implementation.autoImplementable,
          }],
          metadata: { optimization: opp },
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error('Error aggregating optimization insights:', error);
    }

    // 4. Scheduling Recommendations
    try {
      const scheduleRecs = smartSchedulerService.getRecommendations();
      for (const rec of scheduleRecs.slice(0, 3)) {
        newInsights.push({
          id: `insight-schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'recommendation',
          source: 'Smart Scheduler',
          title: `Schedule: ${rec.type.replace('_', ' ').toUpperCase()}`,
          description: rec.reasoning,
          confidence: rec.expectedImpact.confidence,
          priority: rec.priority,
          impact: {
            category: 'engagement',
            estimated: rec.expectedImpact.improvement,
            timeframe: '1 week',
          },
          actionable: rec.autoImplementable,
          actions: rec.actionSteps.map(step => ({
            label: step,
            description: step,
            automated: rec.autoImplementable,
          })),
          metadata: { scheduleRecommendation: rec },
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error('Error aggregating scheduler insights:', error);
    }

    // 5. Content Recycling Opportunities
    try {
      const recycleOpps = contentRecyclerService.getOpportunities(3);
      for (const opp of recycleOpps) {
        newInsights.push({
          id: `insight-recycle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'opportunity',
          source: 'Content Recycler',
          title: `Recycle: "${opp.sourceContent.title.substring(0, 50)}..."`,
          description: opp.reasoning,
          confidence: opp.expectedImpact.confidence,
          priority: opp.priority,
          impact: {
            category: 'revenue',
            estimated: opp.expectedImpact.estimatedRevenue,
            timeframe: '1-2 weeks',
          },
          actionable: true,
          actions: [{
            label: `Recycle to ${opp.targetPlatforms.join(', ')}`,
            description: `Expected $${opp.expectedImpact.estimatedRevenue.toFixed(2)} revenue`,
            automated: false,
          }],
          metadata: { recyclingOpportunity: opp },
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error('Error aggregating content insights:', error);
    }

    // 6. Idle Computing Opportunities
    try {
      const idleAlerts = idleProfitMaximizerService.getAlerts('high');
      for (const alert of idleAlerts.slice(0, 3)) {
        if (alert.type === 'opportunity') {
          newInsights.push({
            id: `insight-idle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'opportunity',
            source: 'Idle Computing Maximizer',
            title: alert.message,
            description: alert.recommendations.join('. '),
            confidence: 0.8,
            priority: alert.severity === 'critical' ? 'critical' : 'high',
            impact: {
              category: 'revenue',
              estimated: alert.metrics.difference,
              timeframe: 'immediate',
            },
            actionable: true,
            actions: alert.recommendations.map(rec => ({
              label: 'Apply',
              description: rec,
              automated: true,
            })),
            metadata: { profitAlert: alert },
            timestamp: new Date(),
          });
        }
      }
    } catch (error) {
      console.error('Error aggregating idle computing insights:', error);
    }

    // Add to stored insights
    this.data.insights.unshift(...newInsights);

    // Keep only recent insights
    if (this.data.insights.length > this.MAX_INSIGHTS) {
      this.data.insights = this.data.insights.slice(0, this.MAX_INSIGHTS);
    }

    this.data.lastAggregation = new Date();
    this.saveData();

    // Send notifications for high-priority insights
    for (const insight of newInsights) {
      if (insight.priority === 'critical' || insight.priority === 'high') {
        aiNotificationService.notify({
          type: insight.type === 'anomaly' || insight.type === 'alert' ? 'warning' : 'info',
          source: insight.source.toLowerCase().replace(/\s+/g, '_') as any,
          title: insight.title,
          message: insight.description,
          priority: insight.priority,
          metadata: {
            estimatedImpact: insight.impact.estimated,
            requiresAction: insight.actionable,
          },
        });
      }
    }

    return newInsights;
  }

  /**
   * Add activity event
   */
  logActivity(event: Omit<AIActivityEvent, 'id' | 'timestamp'>): void {
    const fullEvent: AIActivityEvent = {
      ...event,
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    this.data.activityFeed.unshift(fullEvent);

    // Keep only recent activity
    if (this.data.activityFeed.length > this.MAX_ACTIVITY) {
      this.data.activityFeed = this.data.activityFeed.slice(0, this.MAX_ACTIVITY);
    }

    this.saveData();
  }

  /**
   * Get all insights
   */
  getInsights(filter?: {
    type?: AIInsight['type'];
    source?: string;
    priority?: AIInsight['priority'];
    actionable?: boolean;
    limit?: number;
  }): AIInsight[] {
    let filtered = this.data.insights;

    if (filter?.type) {
      filtered = filtered.filter(i => i.type === filter.type);
    }
    if (filter?.source) {
      filtered = filtered.filter(i => i.source === filter.source);
    }
    if (filter?.priority) {
      filtered = filtered.filter(i => i.priority === filter.priority);
    }
    if (filter?.actionable !== undefined) {
      filtered = filtered.filter(i => i.actionable === filter.actionable);
    }
    if (filter?.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  /**
   * Get activity feed
   */
  getActivityFeed(filter?: {
    system?: string;
    result?: 'success' | 'partial' | 'failed';
    limit?: number;
  }): AIActivityEvent[] {
    let filtered = this.data.activityFeed;

    if (filter?.system) {
      filtered = filtered.filter(a => a.system === filter.system);
    }
    if (filter?.result) {
      filtered = filtered.filter(a => a.result === filter.result);
    }
    if (filter?.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  /**
   * Get insights summary
   */
  getSummary(): InsightsSummary {
    const summary: InsightsSummary = {
      totalInsights: this.data.insights.length,
      byType: { pattern: 0, anomaly: 0, opportunity: 0, recommendation: 0, prediction: 0, alert: 0 },
      byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
      highValueOpportunities: 0,
      criticalAlerts: 0,
      actionableInsights: 0,
      estimatedTotalImpact: 0,
    };

    for (const insight of this.data.insights) {
      summary.byType[insight.type]++;
      summary.byPriority[insight.priority]++;

      if (insight.actionable) {
        summary.actionableInsights++;
      }

      if (insight.priority === 'critical' && (insight.type === 'alert' || insight.type === 'anomaly')) {
        summary.criticalAlerts++;
      }

      if (insight.type === 'opportunity' && insight.impact.estimated > 50) {
        summary.highValueOpportunities++;
      }

      if (insight.impact.category === 'revenue' || insight.impact.category === 'cost') {
        summary.estimatedTotalImpact += insight.impact.estimated;
      }
    }

    return summary;
  }

  /**
   * Get top insights by priority and impact
   */
  getTopInsights(limit: number = 10): AIInsight[] {
    return this.data.insights
      .sort((a, b) => {
        // Sort by priority first
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // Then by estimated impact
        return b.impact.estimated - a.impact.estimated;
      })
      .slice(0, limit);
  }

  /**
   * Clear old insights
   */
  clearExpired(): void {
    const now = new Date();
    const before = this.data.insights.length;

    this.data.insights = this.data.insights.filter(
      i => !i.expiresAt || i.expiresAt > now
    );

    if (this.data.insights.length < before) {
      this.saveData();
    }
  }

  /**
   * Quick test function
   */
  quickTest(): void {
    console.log('=== AI Insights Service Test ===\n');

    console.log('Aggregating insights from all AI systems...\n');
    this.aggregateInsights().then(newInsights => {
      console.log(`Found ${newInsights.length} new insights\n`);

      console.log('--- Summary ---');
      const summary = this.getSummary();
      console.log(`Total Insights: ${summary.totalInsights}`);
      console.log(`Actionable: ${summary.actionableInsights}`);
      console.log(`Critical Alerts: ${summary.criticalAlerts}`);
      console.log(`High-Value Opportunities: ${summary.highValueOpportunities}`);
      console.log(`Estimated Total Impact: $${summary.estimatedTotalImpact.toFixed(2)}`);

      console.log('\nBy Type:');
      Object.entries(summary.byType).forEach(([type, count]) => {
        if (count > 0) console.log(`  ${type}: ${count}`);
      });

      console.log('\nBy Priority:');
      Object.entries(summary.byPriority).forEach(([priority, count]) => {
        if (count > 0) console.log(`  ${priority}: ${count}`);
      });

      console.log('\n--- Top 5 Insights ---');
      const topInsights = this.getTopInsights(5);
      topInsights.forEach((insight, idx) => {
        console.log(`\n${idx + 1}. [${insight.priority.toUpperCase()}] ${insight.title}`);
        console.log(`   Source: ${insight.source}`);
        console.log(`   ${insight.description}`);
        console.log(`   Impact: ${insight.impact.estimated.toFixed(1)}% improvement in ${insight.impact.category}`);
        console.log(`   Confidence: ${Math.round(insight.confidence * 100)}%`);
        if (insight.actionable && insight.actions) {
          console.log(`   Actions: ${insight.actions.length} available`);
        }
      });

      console.log('\n--- Actionable Insights ---');
      const actionable = this.getInsights({ actionable: true, limit: 5 });
      console.log(`${actionable.length} actionable insights:`);
      actionable.forEach((insight, idx) => {
        console.log(`${idx + 1}. ${insight.title} (${insight.source})`);
      });

      // Log some test activity
      console.log('\n--- Logging Test Activity ---');
      this.logActivity({
        system: 'Auto-Optimization',
        action: 'Applied optimization',
        description: 'Optimized posting schedule for LinkedIn',
        result: 'success',
        impact: { metric: 'engagement', value: 15 },
      });

      this.logActivity({
        system: 'Content Recycler',
        action: 'Recycled content',
        description: 'Recycled "10 JavaScript Tips" to LinkedIn',
        result: 'success',
        impact: { metric: 'revenue', value: 45 },
      });

      console.log('Logged 2 activity events');

      console.log('\n--- Recent Activity ---');
      const recentActivity = this.getActivityFeed({ limit: 5 });
      recentActivity.forEach((activity, idx) => {
        console.log(`${idx + 1}. [${activity.system}] ${activity.action}`);
        console.log(`   ${activity.description}`);
        if (activity.result) {
          console.log(`   Result: ${activity.result}`);
        }
        if (activity.impact) {
          console.log(`   Impact: ${activity.impact.value}% ${activity.impact.metric}`);
        }
      });
    });
  }
}

export const aiInsightsService = AIInsightsService.getInstance();

// Expose to window for testing
if (typeof window !== 'undefined') {
  (window as any).aiInsightsService = aiInsightsService;
}
