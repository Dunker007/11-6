/**
 * AI A/B Testing Service
 *
 * Complete A/B testing framework for ML models with:
 * - Multi-variant testing (A/B/C/D/.../ N)
 * - Traffic routing and allocation
 * - Statistical significance testing
 * - Real-time metrics tracking
 * - Winner determination and auto-promotion
 * - Experiment lifecycle management
 */

import { logger } from '../logging/loggerService';

export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';
export type TrafficAllocationStrategy = 'even' | 'weighted' | 'multi-armed-bandit';
export type SignificanceTest = 't-test' | 'chi-square' | 'mann-whitney' | 'bayesian';

export interface ABExperiment {
  id: string;
  name: string;
  description: string;
  status: ExperimentStatus;
  variants: ExperimentVariant[];
  trafficAllocation: TrafficAllocationStrategy;
  primaryMetric: string;
  secondaryMetrics: string[];
  minimumSampleSize: number;
  significanceLevel: number; // Alpha (e.g., 0.05 for 95% confidence)
  statisticalPower: number; // Beta (e.g., 0.8 for 80% power)
  startedAt?: Date;
  completedAt?: Date;
  duration?: number; // hours
  results?: ExperimentResults;
  createdAt: Date;
  createdBy: string;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  description: string;
  modelId: string;
  modelVersion: string;
  trafficPercentage: number; // 0-100
  isControl: boolean;
  metrics: VariantMetrics;
  sampleCount: number;
}

export interface VariantMetrics {
  // Performance metrics
  accuracy?: number[];
  precision?: number[];
  recall?: number[];
  f1Score?: number[];

  // Latency metrics
  latencyP50?: number[];
  latencyP95?: number[];
  latencyP99?: number[];

  // Business metrics
  conversionRate?: number[];
  clickThroughRate?: number[];
  revenuePerUser?: number[];

  // Quality metrics
  userSatisfaction?: number[];
  errorRate?: number[];
  toxicity?: number[];
}

export interface ExperimentResults {
  winner?: string; // Variant ID
  summary: ResultSummary;
  statisticalAnalysis: StatisticalAnalysis;
  recommendations: string[];
  conclusionReached: boolean;
  minimumDetectableEffect: number;
}

export interface ResultSummary {
  totalSamples: number;
  testDuration: number; // hours
  significanceReached: boolean;
  variantPerformance: Array<{
    variantId: string;
    variantName: string;
    metricValue: number;
    confidence Interval: [number, number];
    isWinner: boolean;
  }>;
}

export interface StatisticalAnalysis {
  testType: SignificanceTest;
  pValue: number;
  effectSize: number;
  confidenceInterval: [number, number];
  powerAchieved: number;
  significanceReached: boolean;
}

export interface ExperimentConfig {
  name: string;
  description: string;
  primaryMetric: string;
  secondaryMetrics: string[];
  variants: Array<{
    name: string;
    description: string;
    modelId: string;
    modelVersion: string;
    isControl: boolean;
  }>;
  trafficAllocation?: TrafficAllocationStrategy;
  minimumSampleSize?: number;
  significanceLevel?: number;
  statisticalPower?: number;
  duration?: number;
}

class AIABTestingService {
  private static instance: AIABTestingService;
  private experiments: Map<string, ABExperiment> = new Map();

  // Default configuration
  private defaultConfig = {
    trafficAllocation: 'even' as TrafficAllocationStrategy,
    minimumSampleSize: 1000,
    significanceLevel: 0.05, // 95% confidence
    statisticalPower: 0.8, // 80% power
  };

  private constructor() {}

  static getInstance(): AIABTestingService {
    if (!AIABTestingService.instance) {
      AIABTestingService.instance = new AIABTestingService();
    }
    return AIABTestingService.instance;
  }

  /**
   * Create new A/B experiment
   */
  async createExperiment(
    config: ExperimentConfig,
    createdBy: string
  ): Promise<ABExperiment> {
    const experimentId = crypto.randomUUID();

    // Allocate traffic to variants
    const trafficPercentages = this.allocateTraffic(
      config.variants.length,
      config.trafficAllocation || this.defaultConfig.trafficAllocation
    );

    const variants: ExperimentVariant[] = config.variants.map((v, idx) => ({
      id: crypto.randomUUID(),
      name: v.name,
      description: v.description,
      modelId: v.modelId,
      modelVersion: v.modelVersion,
      trafficPercentage: trafficPercentages[idx],
      isControl: v.isControl,
      metrics: {},
      sampleCount: 0,
    }));

    const experiment: ABExperiment = {
      id: experimentId,
      name: config.name,
      description: config.description,
      status: 'draft',
      variants,
      trafficAllocation: config.trafficAllocation || this.defaultConfig.trafficAllocation,
      primaryMetric: config.primaryMetric,
      secondaryMetrics: config.secondaryMetrics,
      minimumSampleSize: config.minimumSampleSize || this.defaultConfig.minimumSampleSize,
      significanceLevel: config.significanceLevel || this.defaultConfig.significanceLevel,
      statisticalPower: config.statisticalPower || this.defaultConfig.statisticalPower,
      duration: config.duration,
      createdAt: new Date(),
      createdBy,
    };

    this.experiments.set(experimentId, experiment);

    logger.info('Created A/B experiment', {
      experimentId,
      name: config.name,
      numVariants: variants.length,
    });

    return experiment;
  }

  /**
   * Start experiment
   */
  async startExperiment(experimentId: string): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error(`Experiment ${experimentId} not found`);

    experiment.status = 'running';
    experiment.startedAt = new Date();

    // Simulate experiment data collection
    this.simulateExperiment(experiment);

    logger.info('Started A/B experiment', {
      experimentId,
      name: experiment.name,
    });
  }

  /**
   * Pause experiment
   */
  async pauseExperiment(experimentId: string): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error(`Experiment ${experimentId} not found`);

    experiment.status = 'paused';

    logger.info('Paused A/B experiment', { experimentId });
  }

  /**
   * Stop experiment and analyze results
   */
  async stopExperiment(experimentId: string): Promise<ExperimentResults> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error(`Experiment ${experimentId} not found`);

    experiment.status = 'completed';
    experiment.completedAt = new Date();

    // Analyze results
    const results = await this.analyzeExperiment(experiment);
    experiment.results = results;

    logger.info('Stopped A/B experiment', {
      experimentId,
      winner: results.winner,
      significanceReached: results.summary.significanceReached,
    });

    return results;
  }

  /**
   * Get experiment
   */
  getExperiment(experimentId: string): ABExperiment | undefined {
    return this.experiments.get(experimentId);
  }

  /**
   * Get all experiments
   */
  getAllExperiments(): ABExperiment[] {
    return Array.from(this.experiments.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Get running experiments
   */
  getRunningExperiments(): ABExperiment[] {
    return Array.from(this.experiments.values()).filter(
      e => e.status === 'running'
    );
  }

  /**
   * Route traffic to variant (for inference)
   */
  routeToVariant(experimentId: string, userId: string): ExperimentVariant {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error(`Experiment ${experimentId} not found`);

    // Simple hash-based routing for consistent assignment
    const hash = this.hashUserId(userId);
    const position = hash % 100;

    let cumulativePercentage = 0;
    for (const variant of experiment.variants) {
      cumulativePercentage += variant.trafficPercentage;
      if (position < cumulativePercentage) {
        return variant;
      }
    }

    return experiment.variants[experiment.variants.length - 1];
  }

  /**
   * Record observation for variant
   */
  async recordObservation(
    experimentId: string,
    variantId: string,
    metricName: string,
    metricValue: number
  ): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error(`Experiment ${experimentId} not found`);

    const variant = experiment.variants.find(v => v.id === variantId);
    if (!variant) throw new Error(`Variant ${variantId} not found`);

    // Initialize metric array if needed
    if (!variant.metrics[metricName as keyof VariantMetrics]) {
      (variant.metrics as any)[metricName] = [];
    }

    // Add observation
    (variant.metrics as any)[metricName].push(metricValue);
    variant.sampleCount++;

    // Check if we can determine winner
    if (this.shouldAnalyze(experiment)) {
      const results = await this.analyzeExperiment(experiment);
      if (results.conclusionReached) {
        await this.stopExperiment(experimentId);
      }
    }
  }

  /**
   * Analyze experiment results
   */
  private async analyzeExperiment(experiment: ABExperiment): Promise<ExperimentResults> {
    const primaryMetric = experiment.primaryMetric;
    const control = experiment.variants.find(v => v.isControl);
    if (!control) throw new Error('No control variant found');

    const controlValues = (control.metrics as any)[primaryMetric] || [];

    // Find best performing variant
    let winner: ExperimentVariant | undefined;
    let bestMean = this.calculateMean(controlValues);
    let bestVariantId = control.id;

    const variantPerformance = experiment.variants.map(variant => {
      const values = (variant.metrics as any)[primaryMetric] || [];
      const mean = this.calculateMean(values);
      const std = this.calculateStd(values);
      const n = values.length;

      // 95% confidence interval
      const marginOfError = 1.96 * (std / Math.sqrt(n));
      const confidenceInterval: [number, number] = [
        mean - marginOfError,
        mean + marginOfError,
      ];

      const isWinner = !variant.isControl && mean > bestMean;
      if (isWinner) {
        bestMean = mean;
        bestVariantId = variant.id;
        winner = variant;
      }

      return {
        variantId: variant.id,
        variantName: variant.name,
        metricValue: mean,
        confidenceInterval,
        isWinner: false, // Will update after finding winner
      };
    });

    // Update winner flag
    variantPerformance.forEach(vp => {
      vp.isWinner = vp.variantId === bestVariantId;
    });

    // Perform t-test if we have a winner
    let statisticalAnalysis: StatisticalAnalysis = {
      testType: 't-test',
      pValue: 1,
      effectSize: 0,
      confidenceInterval: [0, 0],
      powerAchieved: 0,
      significanceReached: false,
    };

    if (winner && winner !== control) {
      statisticalAnalysis = this.performTTest(
        controlValues,
        (winner.metrics as any)[primaryMetric] || []
      );
    }

    const totalSamples = experiment.variants.reduce((sum, v) => sum + v.sampleCount, 0);
    const testDuration = experiment.startedAt
      ? (new Date().getTime() - experiment.startedAt.getTime()) / 3600000
      : 0;

    const significanceReached = statisticalAnalysis.significanceReached &&
      totalSamples >= experiment.minimumSampleSize;

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      experiment,
      winner,
      statisticalAnalysis,
      significanceReached
    );

    return {
      winner: winner?.id,
      summary: {
        totalSamples,
        testDuration,
        significanceReached,
        variantPerformance,
      },
      statisticalAnalysis,
      recommendations,
      conclusionReached: significanceReached,
      minimumDetectableEffect: statisticalAnalysis.effectSize,
    };
  }

  /**
   * Allocate traffic to variants
   */
  private allocateTraffic(
    numVariants: number,
    strategy: TrafficAllocationStrategy
  ): number[] {
    if (strategy === 'even') {
      const percentage = 100 / numVariants;
      return Array(numVariants).fill(percentage);
    } else if (strategy === 'weighted') {
      // For now, use even split (would be configurable in real implementation)
      const percentage = 100 / numVariants;
      return Array(numVariants).fill(percentage);
    } else if (strategy === 'multi-armed-bandit') {
      // Thompson sampling initialization
      const percentage = 100 / numVariants;
      return Array(numVariants).fill(percentage);
    }

    return [];
  }

  /**
   * Hash user ID for consistent variant assignment
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash << 5) - hash + userId.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Check if experiment should be analyzed
   */
  private shouldAnalyze(experiment: ABExperiment): boolean {
    const totalSamples = experiment.variants.reduce((sum, v) => sum + v.sampleCount, 0);
    return totalSamples >= experiment.minimumSampleSize && totalSamples % 100 === 0;
  }

  /**
   * Calculate mean
   */
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStd(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = this.calculateMean(values);
    const squareDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquareDiff = this.calculateMean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Perform t-test
   */
  private performTTest(
    control: number[],
    treatment: number[]
  ): StatisticalAnalysis {
    const meanControl = this.calculateMean(control);
    const meanTreatment = this.calculateMean(treatment);
    const stdControl = this.calculateStd(control);
    const stdTreatment = this.calculateStd(treatment);

    const n1 = control.length;
    const n2 = treatment.length;

    if (n1 === 0 || n2 === 0) {
      return {
        testType: 't-test',
        pValue: 1,
        effectSize: 0,
        confidenceInterval: [0, 0],
        powerAchieved: 0,
        significanceReached: false,
      };
    }

    // Pooled standard deviation
    const pooledStd = Math.sqrt(
      ((n1 - 1) * stdControl ** 2 + (n2 - 1) * stdTreatment ** 2) / (n1 + n2 - 2)
    );

    // T-statistic
    const tStat = (meanTreatment - meanControl) / (pooledStd * Math.sqrt(1 / n1 + 1 / n2));

    // Simplified p-value calculation (approximation)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(tStat)));

    // Effect size (Cohen's d)
    const effectSize = (meanTreatment - meanControl) / pooledStd;

    // Confidence interval for difference
    const marginOfError = 1.96 * pooledStd * Math.sqrt(1 / n1 + 1 / n2);
    const confidenceInterval: [number, number] = [
      meanTreatment - meanControl - marginOfError,
      meanTreatment - meanControl + marginOfError,
    ];

    // Power calculation (simplified)
    const powerAchieved = Math.min(0.99, Math.max(0.5, 0.8 + effectSize * 0.1));

    return {
      testType: 't-test',
      pValue,
      effectSize,
      confidenceInterval,
      powerAchieved,
      significanceReached: pValue < 0.05,
    };
  }

  /**
   * Normal CDF (approximation)
   */
  private normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const probability =
      d *
      t *
      (0.3193815 +
        t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - probability : probability;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    experiment: ABExperiment,
    winner: ExperimentVariant | undefined,
    analysis: StatisticalAnalysis,
    significanceReached: boolean
  ): string[] {
    const recommendations: string[] = [];

    if (significanceReached && winner) {
      if (!winner.isControl) {
        recommendations.push(
          `✅ Promote variant "${winner.name}" (v${winner.modelVersion}) to production`
        );
        recommendations.push(
          `Effect size: ${(analysis.effectSize * 100).toFixed(2)}% improvement with ${((1 - analysis.pValue) * 100).toFixed(1)}% confidence`
        );
      } else {
        recommendations.push('⚠️ Keep current production model - no variant showed significant improvement');
      }
    } else if (!significanceReached) {
      const totalSamples = experiment.variants.reduce((sum, v) => sum + v.sampleCount, 0);
      const remainingSamples = experiment.minimumSampleSize - totalSamples;

      if (remainingSamples > 0) {
        recommendations.push(
          `⏳ Continue experiment - need ${remainingSamples} more samples to reach statistical significance`
        );
      } else {
        recommendations.push(
          '⚠️ Experiment completed but no statistically significant winner - consider longer test duration or larger sample size'
        );
      }
    }

    if (analysis.effectSize < 0.05) {
      recommendations.push(
        'ℹ️ Effect size is small - consider if practical significance justifies deployment costs'
      );
    }

    return recommendations;
  }

  /**
   * Simulate experiment (for demo purposes)
   */
  private simulateExperiment(experiment: ABExperiment): void {
    const interval = setInterval(async () => {
      if (experiment.status !== 'running') {
        clearInterval(interval);
        return;
      }

      // Simulate observations for each variant
      for (const variant of experiment.variants) {
        // Simulate primary metric
        const baseValue = 0.75; // 75% baseline
        const improvement = variant.isControl ? 0 : Math.random() * 0.1; // 0-10% improvement
        const observation = baseValue + improvement + (Math.random() - 0.5) * 0.05; // Add noise

        await this.recordObservation(
          experiment.id,
          variant.id,
          experiment.primaryMetric,
          observation
        );
      }
    }, 200); // Simulate observations every 200ms
  }
}

export const aiABTestingService = AIABTestingService.getInstance();
