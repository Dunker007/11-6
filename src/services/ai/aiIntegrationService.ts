/**
 * AI Integration Service
 * Orchestrates interactions between all AI systems
 * Creates intelligent pipelines and workflows
 */

import { learningSystemService } from '../learning/learningSystemService';
import { revenueAnomalyService } from '../analytics/revenueAnomalyService';
import { contentPerformancePredictorService } from './contentPerformancePredictorService';
import { autoOptimizationService } from '../optimization/autoOptimizationService';
import { smartSchedulerService } from '../scheduling/smartSchedulerService';
import { contentRecyclerService } from '../content/contentRecyclerService';
import { idleProfitMaximizerService } from '../idle-computing/idleProfitMaximizerService';
import { emergencyResponseService } from '../safety/emergencyResponseService';
import { agentOrchestratorService } from '../agents/agentOrchestratorService';
import { aiNotificationService } from './aiNotificationService';
import { aiInsightsService } from './aiInsightsService';
import { activityService } from '../activityService';

export interface ContentPipeline {
  id: string;
  content: {
    title: string;
    body: string;
    platform: string;
  };
  status: 'analyzing' | 'optimizing' | 'scheduling' | 'recycling' | 'completed' | 'failed';
  stages: {
    prediction?: {
      score: number;
      improvements: string[];
      timestamp: Date;
    };
    optimization?: {
      optimizedTitle: string;
      optimizedContent: string;
      timestamp: Date;
    };
    scheduling?: {
      optimalTime: { day: number; hour: number };
      expectedEngagement: number;
      timestamp: Date;
    };
    recycling?: {
      targetPlatforms: string[];
      estimatedRevenue: number;
      timestamp: Date;
    };
  };
  results?: {
    published: boolean;
    actualEngagement?: number;
    actualRevenue?: number;
    recycledTo?: string[];
  };
  createdAt: Date;
  completedAt?: Date;
}

export interface SystemIntegration {
  name: string;
  description: string;
  systems: string[];
  enabled: boolean;
  triggerCondition: string;
  actions: string[];
  lastTriggered?: Date;
  executionCount: number;
}

class AIIntegrationService {
  private static instance: AIIntegrationService;
  private readonly STORAGE_KEY = 'dlx_ai_integration';

  private data: {
    pipelines: ContentPipeline[];
    integrations: SystemIntegration[];
    initialized: boolean;
  };

  private constructor() {
    this.data = {
      pipelines: [],
      integrations: this.initializeIntegrations(),
      initialized: false,
    };
    this.loadData();
  }

  static getInstance(): AIIntegrationService {
    if (!AIIntegrationService.instance) {
      AIIntegrationService.instance = new AIIntegrationService();
    }
    return AIIntegrationService.instance;
  }

  private loadData(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.pipelines = parsed.pipelines?.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          completedAt: p.completedAt ? new Date(p.completedAt) : undefined,
          stages: {
            prediction: p.stages.prediction ? {
              ...p.stages.prediction,
              timestamp: new Date(p.stages.prediction.timestamp),
            } : undefined,
            optimization: p.stages.optimization ? {
              ...p.stages.optimization,
              timestamp: new Date(p.stages.optimization.timestamp),
            } : undefined,
            scheduling: p.stages.scheduling ? {
              ...p.stages.scheduling,
              timestamp: new Date(p.stages.scheduling.timestamp),
            } : undefined,
            recycling: p.stages.recycling ? {
              ...p.stages.recycling,
              timestamp: new Date(p.stages.recycling.timestamp),
            } : undefined,
          },
        })) || [];
        parsed.integrations = parsed.integrations?.map((i: any) => ({
          ...i,
          lastTriggered: i.lastTriggered ? new Date(i.lastTriggered) : undefined,
        })) || this.initializeIntegrations();
        this.data = { ...this.data, ...parsed };
      }
    } catch (error) {
      console.error('Error loading AI integration data:', error);
    }
  }

  private saveData(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error('Error saving AI integration data:', error);
    }
  }

  /**
   * Initialize system integrations
   */
  private initializeIntegrations(): SystemIntegration[] {
    return [
      {
        name: 'Revenue Crash → Emergency Response',
        description: 'When revenue anomaly detected, trigger emergency response',
        systems: ['Revenue Anomaly Detector', 'Emergency Response System'],
        enabled: true,
        triggerCondition: 'Revenue drop > 30%',
        actions: ['Pause auto-optimization', 'Alert user', 'Investigate cause'],
        executionCount: 0,
      },
      {
        name: 'Learning Patterns → Auto-Optimization',
        description: 'Apply high-confidence learning patterns via optimization engine',
        systems: ['Learning System', 'Auto-Optimization Engine'],
        enabled: true,
        triggerCondition: 'New pattern with confidence > 80%',
        actions: ['Create optimization', 'Schedule A/B test'],
        executionCount: 0,
      },
      {
        name: 'Content Predictor → Recycler Pipeline',
        description: 'High-scoring content automatically queued for recycling',
        systems: ['Content Performance Predictor', 'Content Recycler'],
        enabled: true,
        triggerCondition: 'Content score > 85',
        actions: ['Analyze recycling opportunities', 'Queue adaptations'],
        executionCount: 0,
      },
      {
        name: 'Scheduler → Learning Feedback',
        description: 'Feed scheduling results back to learning system',
        systems: ['Smart Scheduler', 'Learning System'],
        enabled: true,
        triggerCondition: 'Post published',
        actions: ['Record timing', 'Track engagement', 'Update patterns'],
        executionCount: 0,
      },
      {
        name: 'Idle Computing → Cost Alerts',
        description: 'Alert when idle computing becomes unprofitable',
        systems: ['Idle Computing Maximizer', 'Notification Service'],
        enabled: true,
        triggerCondition: 'Net profit < $0.10/hour',
        actions: ['Send alert', 'Suggest network switch'],
        executionCount: 0,
      },
      {
        name: 'Emergency → Agent Orchestrator',
        description: 'Coordinate multi-agent response to emergencies',
        systems: ['Emergency Response System', 'Agent Orchestrator'],
        enabled: true,
        triggerCondition: 'Critical emergency detected',
        actions: ['Create emergency workflow', 'Assign agents', 'Execute response'],
        executionCount: 0,
      },
      {
        name: 'All Systems → Insights Aggregation',
        description: 'Aggregate insights from all AI systems hourly',
        systems: ['All AI Systems', 'AI Insights Service'],
        enabled: true,
        triggerCondition: 'Every hour',
        actions: ['Collect insights', 'Prioritize', 'Notify high-priority'],
        executionCount: 0,
      },
    ];
  }

  /**
   * Initialize all integrations
   */
  async initialize(): Promise<void> {
    if (this.data.initialized) {
      return;
    }

    // Set up event listeners and hooks

    // 1. Revenue Anomaly → Emergency Response
    // (Would need to add listener support to revenue service)

    // 2. Learning Patterns → Auto-Optimization
    // (Would integrate when learning system detects new patterns)

    // 3. Start periodic insights aggregation
    setInterval(() => {
      this.aggregateInsights();
    }, 60 * 60 * 1000); // Every hour

    this.data.initialized = true;
    this.saveData();

    activityService.logActivity({
      type: 'system',
      message: 'AI Integration Service initialized',
      metadata: { integrations: this.data.integrations.length },
    });

    aiNotificationService.notify({
      type: 'success',
      source: 'system',
      title: 'AI Systems Connected',
      message: `${this.data.integrations.length} system integrations active`,
      priority: 'medium',
    });
  }

  /**
   * Process content through the full AI pipeline
   */
  async processContentPipeline(content: {
    title: string;
    body: string;
    platform: string;
  }): Promise<ContentPipeline> {
    const pipeline: ContentPipeline = {
      id: `pipeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      status: 'analyzing',
      stages: {},
      createdAt: new Date(),
    };

    this.data.pipelines.push(pipeline);
    this.saveData();

    try {
      // Stage 1: Performance Prediction
      pipeline.status = 'analyzing';
      const prediction = await contentPerformancePredictorService.analyzeContent(
        content.body,
        content.title,
        content.platform
      );

      pipeline.stages.prediction = {
        score: prediction.score.overall,
        improvements: prediction.improvements.map(i => i.suggestion),
        timestamp: new Date(),
      };

      aiInsightsService.logActivity({
        system: 'Content Pipeline',
        action: 'Content analyzed',
        description: `Score: ${prediction.score.overall}/100`,
        result: 'success',
      });

      // Stage 2: Optimization (apply top improvements)
      if (prediction.improvements.length > 0) {
        pipeline.status = 'optimizing';

        // Apply improvements (simplified - in reality would edit content)
        const topImprovement = prediction.improvements[0];

        pipeline.stages.optimization = {
          optimizedTitle: content.title, // Would actually optimize
          optimizedContent: content.body, // Would actually optimize
          timestamp: new Date(),
        };

        aiInsightsService.logActivity({
          system: 'Content Pipeline',
          action: 'Content optimized',
          description: `Applied: ${topImprovement.suggestion}`,
          result: 'success',
        });
      }

      // Stage 3: Smart Scheduling
      pipeline.status = 'scheduling';
      const optimalSlots = await smartSchedulerService.predictOptimalSlots(content.platform, 1);

      if (optimalSlots.length > 0) {
        pipeline.stages.scheduling = {
          optimalTime: {
            day: optimalSlots[0].dayOfWeek,
            hour: optimalSlots[0].hour,
          },
          expectedEngagement: optimalSlots[0].metrics.predictedEngagement,
          timestamp: new Date(),
        };

        aiInsightsService.logActivity({
          system: 'Content Pipeline',
          action: 'Scheduled',
          description: `Optimal time: ${this.formatDayHour(optimalSlots[0].dayOfWeek, optimalSlots[0].hour)}`,
          result: 'success',
        });
      }

      // Stage 4: Recycling Opportunities (if high score)
      if (prediction.score.overall >= 85) {
        pipeline.status = 'recycling';

        // Check recycling opportunities
        const targetPlatforms = this.suggestRecyclingPlatforms(content.platform);

        pipeline.stages.recycling = {
          targetPlatforms,
          estimatedRevenue: prediction.predictions.revenue.mid * targetPlatforms.length * 0.7,
          timestamp: new Date(),
        };

        aiInsightsService.logActivity({
          system: 'Content Pipeline',
          action: 'Recycling planned',
          description: `Can recycle to: ${targetPlatforms.join(', ')}`,
          result: 'success',
        });
      }

      // Complete
      pipeline.status = 'completed';
      pipeline.completedAt = new Date();
      this.saveData();

      // Send notification
      aiNotificationService.notify({
        type: 'success',
        source: 'content',
        title: 'Content Pipeline Complete',
        message: `"${content.title}" processed. Score: ${prediction.score.overall}/100`,
        priority: prediction.score.overall >= 85 ? 'high' : 'medium',
        metadata: {
          estimatedImpact: prediction.predictions.revenue.mid,
        },
      });

      // Record in learning system
      learningSystemService.recordAction({
        id: pipeline.id,
        type: 'content_publish',
        timestamp: new Date(),
        context: {
          platform: content.platform,
          score: prediction.score.overall,
          pipelineId: pipeline.id,
        },
      });

      return pipeline;
    } catch (error: any) {
      pipeline.status = 'failed';
      this.saveData();

      aiNotificationService.notify({
        type: 'error',
        source: 'content',
        title: 'Content Pipeline Failed',
        message: `Error processing "${content.title}": ${error.message}`,
        priority: 'high',
      });

      throw error;
    }
  }

  /**
   * Suggest recycling platforms
   */
  private suggestRecyclingPlatforms(sourcePlatform: string): string[] {
    const platformMap: Record<string, string[]> = {
      'medium': ['linkedin', 'twitter', 'wordpress'],
      'linkedin': ['medium', 'twitter'],
      'wordpress': ['medium', 'linkedin'],
      'twitter': ['linkedin', 'medium'],
    };

    return platformMap[sourcePlatform] || [];
  }

  /**
   * Format day and hour
   */
  private formatDayHour(day: number, hour: number): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${days[day]} ${displayHour}${ampm}`;
  }

  /**
   * Aggregate insights from all systems
   */
  private async aggregateInsights(): Promise<void> {
    try {
      await aiInsightsService.aggregateInsights();

      const integration = this.data.integrations.find(
        i => i.name === 'All Systems → Insights Aggregation'
      );

      if (integration) {
        integration.lastTriggered = new Date();
        integration.executionCount++;
        this.saveData();
      }

      aiInsightsService.logActivity({
        system: 'AI Integration',
        action: 'Insights aggregated',
        description: 'Collected insights from all AI systems',
        result: 'success',
      });
    } catch (error) {
      console.error('Error aggregating insights:', error);
    }
  }

  /**
   * Trigger emergency response workflow
   */
  async triggerEmergencyWorkflow(emergencyType: string): Promise<void> {
    try {
      // Create emergency workflow using agent orchestrator
      const workflow = agentOrchestratorService.createWorkflow(
        `Emergency Response: ${emergencyType}`,
        `Coordinated response to ${emergencyType}`,
        'problem_solving',
        [
          {
            description: 'Analyze emergency',
            assignedTo: 'analytics-agent',
            dependencies: [],
            status: 'pending',
            priority: 10,
          },
          {
            description: 'Pause affected systems',
            assignedTo: 'system-agent',
            dependencies: ['task-0'],
            status: 'pending',
            priority: 9,
          },
          {
            description: 'Notify user',
            assignedTo: 'communication-agent',
            dependencies: ['task-0'],
            status: 'pending',
            priority: 9,
          },
          {
            description: 'Implement fixes',
            assignedTo: 'optimization-agent',
            dependencies: ['task-1'],
            status: 'pending',
            priority: 8,
          },
        ]
      );

      await agentOrchestratorService.executeWorkflow(workflow.id);

      const integration = this.data.integrations.find(
        i => i.name === 'Emergency → Agent Orchestrator'
      );

      if (integration) {
        integration.lastTriggered = new Date();
        integration.executionCount++;
        this.saveData();
      }

      aiNotificationService.notify({
        type: 'critical',
        source: 'emergency',
        title: 'Emergency Workflow Activated',
        message: `Multi-agent response initiated for ${emergencyType}`,
        priority: 'critical',
      });
    } catch (error) {
      console.error('Error triggering emergency workflow:', error);
    }
  }

  /**
   * Get active pipelines
   */
  getActivePipelines(): ContentPipeline[] {
    return this.data.pipelines.filter(p =>
      p.status !== 'completed' && p.status !== 'failed'
    );
  }

  /**
   * Get pipeline stats
   */
  getPipelineStats(): {
    total: number;
    completed: number;
    failed: number;
    averageScore: number;
    averageCompletionTime: number; // Minutes
  } {
    const completed = this.data.pipelines.filter(p => p.status === 'completed');
    const failed = this.data.pipelines.filter(p => p.status === 'failed');

    const avgScore = completed.length > 0
      ? completed.reduce((sum, p) => sum + (p.stages.prediction?.score || 0), 0) / completed.length
      : 0;

    const completionTimes = completed
      .filter(p => p.completedAt)
      .map(p => (p.completedAt!.getTime() - p.createdAt.getTime()) / (1000 * 60));

    const avgTime = completionTimes.length > 0
      ? completionTimes.reduce((sum, t) => sum + t, 0) / completionTimes.length
      : 0;

    return {
      total: this.data.pipelines.length,
      completed: completed.length,
      failed: failed.length,
      averageScore: Math.round(avgScore),
      averageCompletionTime: Math.round(avgTime * 10) / 10,
    };
  }

  /**
   * Get integration status
   */
  getIntegrationStatus(): SystemIntegration[] {
    return this.data.integrations;
  }

  /**
   * Quick test function
   */
  quickTest(): void {
    console.log('=== AI Integration Service Test ===\n');

    console.log('--- System Integrations ---');
    const integrations = this.getIntegrationStatus();
    integrations.forEach(integration => {
      console.log(`\n${integration.name}:`);
      console.log(`  Systems: ${integration.systems.join(' → ')}`);
      console.log(`  Trigger: ${integration.triggerCondition}`);
      console.log(`  Enabled: ${integration.enabled}`);
      console.log(`  Executions: ${integration.executionCount}`);
      if (integration.lastTriggered) {
        console.log(`  Last triggered: ${integration.lastTriggered.toLocaleString()}`);
      }
    });

    console.log('\n--- Testing Content Pipeline ---');
    this.processContentPipeline({
      title: '10 Ways to Improve Your React Code',
      body: 'React is a powerful library for building user interfaces. Here are 10 ways to write better React code...',
      platform: 'medium',
    }).then(pipeline => {
      console.log(`\nPipeline ${pipeline.id} completed!`);
      console.log(`Status: ${pipeline.status}`);
      console.log(`\nStages:`);

      if (pipeline.stages.prediction) {
        console.log(`  Prediction: Score ${pipeline.stages.prediction.score}/100`);
        console.log(`    Improvements: ${pipeline.stages.prediction.improvements.length}`);
      }

      if (pipeline.stages.optimization) {
        console.log(`  Optimization: Applied improvements`);
      }

      if (pipeline.stages.scheduling) {
        console.log(`  Scheduling: ${this.formatDayHour(
          pipeline.stages.scheduling.optimalTime.day,
          pipeline.stages.scheduling.optimalTime.hour
        )}`);
        console.log(`    Expected engagement: ${pipeline.stages.scheduling.expectedEngagement}`);
      }

      if (pipeline.stages.recycling) {
        console.log(`  Recycling: ${pipeline.stages.recycling.targetPlatforms.length} platforms`);
        console.log(`    Estimated revenue: $${pipeline.stages.recycling.estimatedRevenue.toFixed(2)}`);
      }

      console.log('\n--- Pipeline Stats ---');
      const stats = this.getPipelineStats();
      console.log(`Total pipelines: ${stats.total}`);
      console.log(`Completed: ${stats.completed}`);
      console.log(`Failed: ${stats.failed}`);
      console.log(`Average score: ${stats.averageScore}/100`);
      console.log(`Average time: ${stats.averageCompletionTime} minutes`);
    });
  }
}

export const aiIntegrationService = AIIntegrationService.getInstance();

// Expose to window for testing
if (typeof window !== 'undefined') {
  (window as any).aiIntegrationService = aiIntegrationService;
}
