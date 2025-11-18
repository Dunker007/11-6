/**
 * Model Registry Service
 *
 * Centralized model versioning and management with:
 * - Model versioning (semantic versioning)
 * - Model lineage tracking
 * - Deployment status management
 * - Performance tracking and regression detection
 * - Model promotion workflows
 * - Metadata and tags
 */

import { logger } from '../logging/loggerService';

export type ModelStage = 'development' | 'staging' | 'production' | 'archived';
export type ModelStatus = 'draft' | 'trained' | 'validated' | 'deployed' | 'deprecated';

export interface RegisteredModel {
  id: string;
  name: string;
  description: string;
  task: string; // e.g., 'text-generation', 'classification', etc.
  framework: string; // e.g., 'pytorch', 'tensorflow', 'transformers'
  baseModel?: string;
  versions: ModelVersion[];
  currentVersion?: string;
  latestVersion: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ModelVersion {
  version: string;
  modelId: string;
  stage: ModelStage;
  status: ModelStatus;
  trainingJobId?: string;
  checkpointPath: string;
  size: number; // bytes
  metrics: ModelMetrics;
  hyperparameters: Record<string, any>;
  datasetId?: string;
  parentVersion?: string;
  createdAt: Date;
  createdBy: string;
  deployedAt?: Date;
  description?: string;
}

export interface ModelMetrics {
  training: {
    finalLoss: number;
    finalAccuracy?: number;
    perplexity?: number;
    bleuScore?: number;
  };
  validation: {
    loss: number;
    accuracy?: number;
    f1Score?: number;
    precision?: number;
    recall?: number;
  };
  performance: {
    latencyMs?: number; // Average latency
    throughput?: number; // Samples/sec
    memoryMB?: number;
  };
}

export interface ModelComparison {
  baselineVersion: string;
  candidateVersion: string;
  metricDifferences: Record<string, {
    baseline: number;
    candidate: number;
    difference: number;
    percentChange: number;
    isImprovement: boolean;
  }>;
  recommendation: 'promote' | 'reject' | 'needs-review';
  reasons: string[];
}

export interface PerformanceRegression {
  modelId: string;
  version: string;
  previousVersion: string;
  regressionType: 'accuracy' | 'latency' | 'memory' | 'throughput';
  metric: string;
  previousValue: number;
  currentValue: number;
  degradation: number; // percentage
  threshold: number; // percentage threshold for alerts
  detected At: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ModelPromotionRequest {
  modelId: string;
  version: string;
  fromStage: ModelStage;
  toStage: ModelStage;
  requestedBy: string;
  justification: string;
  approvalRequired: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

class ModelRegistryService {
  private static instance: ModelRegistryService;
  private models: Map<string, RegisteredModel> = new Map();
  private promotionRequests: Map<string, ModelPromotionRequest> = new Map();
  private regressionDetections: PerformanceRegression[] = [];

  // Regression detection thresholds
  private regressionThresholds = {
    accuracy: 2, // 2% degradation
    latency: 10, // 10% increase
    memory: 15, // 15% increase
    throughput: 10, // 10% decrease
  };

  private constructor() {}

  static getInstance(): ModelRegistryService {
    if (!ModelRegistryService.instance) {
      ModelRegistryService.instance = new ModelRegistryService();
    }
    return ModelRegistryService.instance;
  }

  /**
   * Register new model
   */
  async registerModel(
    name: string,
    description: string,
    task: string,
    framework: string
  ): Promise<RegisteredModel> {
    const modelId = crypto.randomUUID();

    const model: RegisteredModel = {
      id: modelId,
      name,
      description,
      task,
      framework,
      versions: [],
      latestVersion: '0.0.0',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.models.set(modelId, model);

    logger.info('Registered new model', {
      modelId,
      name,
      task,
      framework,
    });

    return model;
  }

  /**
   * Add model version
   */
  async addModelVersion(
    modelId: string,
    checkpointPath: string,
    metrics: ModelMetrics,
    hyperparameters: Record<string, any>,
    trainingJobId?: string,
    datasetId?: string,
    description?: string
  ): Promise<ModelVersion> {
    const model = this.models.get(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);

    // Generate next version number (simplified semantic versioning)
    const nextVersion = this.getNextVersion(model.latestVersion);

    const version: ModelVersion = {
      version: nextVersion,
      modelId,
      stage: 'development',
      status: 'trained',
      trainingJobId,
      checkpointPath,
      size: Math.floor(Math.random() * 5000000000) + 1000000000, // 1-6GB
      metrics,
      hyperparameters,
      datasetId,
      createdAt: new Date(),
      createdBy: 'system',
      description,
    };

    model.versions.push(version);
    model.latestVersion = nextVersion;
    model.updatedAt = new Date();

    // Check for performance regression
    if (model.versions.length > 1) {
      await this.detectRegressions(modelId, nextVersion);
    }

    logger.info('Added model version', {
      modelId,
      version: nextVersion,
      stage: version.stage,
    });

    return version;
  }

  /**
   * Get model by ID
   */
  getModel(modelId: string): RegisteredModel | undefined {
    return this.models.get(modelId);
  }

  /**
   * Get all models
   */
  getAllModels(): RegisteredModel[] {
    return Array.from(this.models.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  /**
   * Get model version
   */
  getModelVersion(modelId: string, version: string): ModelVersion | undefined {
    const model = this.models.get(modelId);
    if (!model) return undefined;

    return model.versions.find(v => v.version === version);
  }

  /**
   * Get models by stage
   */
  getModelsByStage(stage: ModelStage): Array<{ model: RegisteredModel; version: ModelVersion }> {
    const results: Array<{ model: RegisteredModel; version: ModelVersion }> = [];

    for (const model of this.models.values()) {
      for (const version of model.versions) {
        if (version.stage === stage) {
          results.push({ model, version });
        }
      }
    }

    return results;
  }

  /**
   * Compare two model versions
   */
  async compareVersions(
    modelId: string,
    baselineVersion: string,
    candidateVersion: string
  ): Promise<ModelComparison> {
    const model = this.models.get(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);

    const baseline = model.versions.find(v => v.version === baselineVersion);
    const candidate = model.versions.find(v => v.version === candidateVersion);

    if (!baseline || !candidate) {
      throw new Error('Version not found');
    }

    const metricDifferences: ModelComparison['metricDifferences'] = {};
    const reasons: string[] = [];

    // Compare validation loss
    const lossBaseline = baseline.metrics.validation.loss;
    const lossCandidate = candidate.metrics.validation.loss;
    const lossDiff = lossCandidate - lossBaseline;
    const lossPercentChange = (lossDiff / lossBaseline) * 100;

    metricDifferences['validation_loss'] = {
      baseline: lossBaseline,
      candidate: lossCandidate,
      difference: lossDiff,
      percentChange: lossPercentChange,
      isImprovement: lossDiff < 0,
    };

    if (lossDiff < 0) {
      reasons.push(`Validation loss improved by ${Math.abs(lossPercentChange).toFixed(2)}%`);
    } else if (lossDiff > 0) {
      reasons.push(`Validation loss degraded by ${lossPercentChange.toFixed(2)}%`);
    }

    // Compare accuracy if available
    if (baseline.metrics.validation.accuracy && candidate.metrics.validation.accuracy) {
      const accBaseline = baseline.metrics.validation.accuracy;
      const accCandidate = candidate.metrics.validation.accuracy;
      const accDiff = accCandidate - accBaseline;
      const accPercentChange = (accDiff / accBaseline) * 100;

      metricDifferences['validation_accuracy'] = {
        baseline: accBaseline,
        candidate: accCandidate,
        difference: accDiff,
        percentChange: accPercentChange,
        isImprovement: accDiff > 0,
      };

      if (accDiff > 0) {
        reasons.push(`Accuracy improved by ${accPercentChange.toFixed(2)}%`);
      } else if (accDiff < 0) {
        reasons.push(`Accuracy degraded by ${Math.abs(accPercentChange).toFixed(2)}%`);
      }
    }

    // Compare latency if available
    if (baseline.metrics.performance.latencyMs && candidate.metrics.performance.latencyMs) {
      const latBaseline = baseline.metrics.performance.latencyMs;
      const latCandidate = candidate.metrics.performance.latencyMs;
      const latDiff = latCandidate - latBaseline;
      const latPercentChange = (latDiff / latBaseline) * 100;

      metricDifferences['latency'] = {
        baseline: latBaseline,
        candidate: latCandidate,
        difference: latDiff,
        percentChange: latPercentChange,
        isImprovement: latDiff < 0,
      };

      if (latDiff < 0) {
        reasons.push(`Latency improved by ${Math.abs(latPercentChange).toFixed(2)}%`);
      } else if (latDiff > 0) {
        reasons.push(`Latency increased by ${latPercentChange.toFixed(2)}%`);
      }
    }

    // Make recommendation
    let recommendation: ModelComparison['recommendation'] = 'needs-review';
    if (lossDiff < -0.05) {
      recommendation = 'promote'; // Significant improvement
    } else if (lossDiff > 0.02) {
      recommendation = 'reject'; // Regression
    }

    return {
      baselineVersion,
      candidateVersion,
      metricDifferences,
      recommendation,
      reasons,
    };
  }

  /**
   * Promote model version to different stage
   */
  async promoteVersion(
    modelId: string,
    version: string,
    toStage: ModelStage,
    requestedBy: string,
    justification: string
  ): Promise<ModelPromotionRequest> {
    const model = this.models.get(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);

    const modelVersion = model.versions.find(v => v.version === version);
    if (!modelVersion) throw new Error(`Version ${version} not found`);

    const requestId = crypto.randomUUID();
    const approvalRequired = toStage === 'production';

    const request: ModelPromotionRequest = {
      modelId,
      version,
      fromStage: modelVersion.stage,
      toStage,
      requestedBy,
      justification,
      approvalRequired,
      status: approvalRequired ? 'pending' : 'approved',
      createdAt: new Date(),
    };

    this.promotionRequests.set(requestId, request);

    // Auto-approve if not going to production
    if (!approvalRequired) {
      await this.approvePromotion(requestId, 'system');
    }

    logger.info('Created promotion request', {
      requestId,
      modelId,
      version,
      fromStage: modelVersion.stage,
      toStage,
    });

    return request;
  }

  /**
   * Approve promotion request
   */
  async approvePromotion(requestId: string, reviewedBy: string): Promise<void> {
    const request = this.promotionRequests.get(requestId);
    if (!request) throw new Error(`Request ${requestId} not found`);

    request.status = 'approved';
    request.reviewedAt = new Date();
    request.reviewedBy = reviewedBy;

    // Update model version stage
    const model = this.models.get(request.modelId);
    if (model) {
      const version = model.versions.find(v => v.version === request.version);
      if (version) {
        version.stage = request.toStage;

        if (request.toStage === 'production') {
          version.deployedAt = new Date();
          version.status = 'deployed';
          model.currentVersion = request.version;
        }

        model.updatedAt = new Date();
      }
    }

    logger.info('Approved promotion request', {
      requestId,
      modelId: request.modelId,
      version: request.version,
      toStage: request.toStage,
    });
  }

  /**
   * Detect performance regressions
   */
  private async detectRegressions(modelId: string, version: string): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) return;

    const currentVersion = model.versions.find(v => v.version === version);
    if (!currentVersion) return;

    // Find previous production version for comparison
    const previousVersions = model.versions
      .filter(v => v.version !== version)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (previousVersions.length === 0) return;

    const previousVersion = previousVersions[0];

    // Check accuracy regression
    if (
      currentVersion.metrics.validation.accuracy &&
      previousVersion.metrics.validation.accuracy
    ) {
      const degradation =
        ((previousVersion.metrics.validation.accuracy -
          currentVersion.metrics.validation.accuracy) /
          previousVersion.metrics.validation.accuracy) *
        100;

      if (degradation > this.regressionThresholds.accuracy) {
        this.reportRegression(
          modelId,
          version,
          previousVersion.version,
          'accuracy',
          'validation_accuracy',
          previousVersion.metrics.validation.accuracy,
          currentVersion.metrics.validation.accuracy,
          degradation
        );
      }
    }

    // Check latency regression
    if (
      currentVersion.metrics.performance.latencyMs &&
      previousVersion.metrics.performance.latencyMs
    ) {
      const degradation =
        ((currentVersion.metrics.performance.latencyMs -
          previousVersion.metrics.performance.latencyMs) /
          previousVersion.metrics.performance.latencyMs) *
        100;

      if (degradation > this.regressionThresholds.latency) {
        this.reportRegression(
          modelId,
          version,
          previousVersion.version,
          'latency',
          'latency_ms',
          previousVersion.metrics.performance.latencyMs,
          currentVersion.metrics.performance.latencyMs,
          degradation
        );
      }
    }
  }

  /**
   * Report performance regression
   */
  private reportRegression(
    modelId: string,
    version: string,
    previousVersion: string,
    regressionType: PerformanceRegression['regressionType'],
    metric: string,
    previousValue: number,
    currentValue: number,
    degradation: number
  ): void {
    let severity: PerformanceRegression['severity'] = 'low';
    if (degradation > 20) severity = 'critical';
    else if (degradation > 10) severity = 'high';
    else if (degradation > 5) severity = 'medium';

    const regression: PerformanceRegression = {
      modelId,
      version,
      previousVersion,
      regressionType,
      metric,
      previousValue,
      currentValue,
      degradation,
      threshold: this.regressionThresholds[regressionType],
      detectedAt: new Date(),
      severity,
    };

    this.regressionDetections.push(regression);

    logger.warn('Performance regression detected', {
      modelId,
      version,
      regressionType,
      degradation: `${degradation.toFixed(2)}%`,
      severity,
    });
  }

  /**
   * Get performance regressions
   */
  getRegressions(modelId?: string): PerformanceRegression[] {
    if (modelId) {
      return this.regressionDetections.filter(r => r.modelId === modelId);
    }
    return this.regressionDetections;
  }

  /**
   * Get pending promotion requests
   */
  getPendingPromotions(): ModelPromotionRequest[] {
    return Array.from(this.promotionRequests.values()).filter(
      r => r.status === 'pending'
    );
  }

  /**
   * Get next version number
   */
  private getNextVersion(currentVersion: string): string {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }

  /**
   * Delete model
   */
  async deleteModel(modelId: string): Promise<void> {
    this.models.delete(modelId);

    logger.info('Deleted model', { modelId });
  }
}

export const modelRegistryService = ModelRegistryService.getInstance();
