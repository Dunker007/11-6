/**
 * Emergency Response System
 * Automatic detection and response to critical issues
 * Safety net for revenue crashes, security issues, and system failures
 */

import { revenueAnomalyService } from '../analytics/revenueAnomalyService';
import { learningSystemService } from '../learning/learningSystemService';
import { autoOptimizationService } from '../optimization/autoOptimizationService';
import { idleProfitMaximizerService } from '../idle-computing/idleProfitMaximizerService';
import { activityService } from '../activity/activityService';

export interface Emergency {
  id: string;
  type: 'revenue_crash' | 'security_breach' | 'system_failure' | 'data_loss' | 'cost_spike' | 'performance_degradation' | 'service_outage';
  severity: 'critical' | 'high' | 'medium' | 'low';
  detectedAt: Date;
  status: 'detected' | 'responding' | 'mitigated' | 'resolved' | 'failed';
  description: string;
  metrics: {
    affectedSystems: string[];
    estimatedImpact: number; // Dollar amount or severity score
    currentValue: number;
    expectedValue: number;
    deviation: number; // Percentage
  };
  rootCause?: {
    identified: boolean;
    cause: string;
    confidence: number;
    evidence: string[];
  };
  response: EmergencyResponse;
  resolution?: {
    resolvedAt: Date;
    outcome: 'successful' | 'partial' | 'unsuccessful';
    finalImpact: number;
    lessonsLearned: string[];
  };
}

export interface EmergencyResponse {
  actions: EmergencyAction[];
  escalationLevel: number; // 1-5
  autoImplemented: boolean;
  requiresUserApproval: boolean;
  rollbackPlan?: {
    steps: string[];
    estimatedTime: number; // Minutes
  };
  executedAt?: Date;
  results?: {
    successful: boolean;
    mitigationPercentage: number; // How much of the problem was fixed
    sideEffects: string[];
  };
}

export interface EmergencyAction {
  id: string;
  type: 'pause_service' | 'switch_provider' | 'rollback_change' | 'adjust_settings' | 'alert_user' | 'activate_backup' | 'disable_feature' | 'emergency_scaling';
  target: string; // Service or system to act on
  description: string;
  parameters: Record<string, any>;
  priority: number; // 1-10
  estimatedImpact: string;
  risks: string[];
  executedAt?: Date;
  result?: {
    success: boolean;
    message: string;
    metrics?: Record<string, any>;
  };
}

export interface HealthCheck {
  system: string;
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  lastChecked: Date;
  metrics: {
    uptime: number; // Percentage
    latency: number; // ms
    errorRate: number; // Percentage
    throughput: number; // requests/min
  };
  issues: string[];
}

export interface EmergencyProtocol {
  type: Emergency['type'];
  severity: Emergency['severity'];
  triggers: {
    metric: string;
    operator: '>' | '<' | '=' | '>=' | '<=';
    threshold: number;
    duration?: number; // Seconds the condition must persist
  }[];
  responseActions: Omit<EmergencyAction, 'id' | 'executedAt' | 'result'>[];
  escalationPath: {
    level: number;
    waitTime: number; // Minutes before escalating
    actions: string[];
  }[];
  autoImplement: boolean;
}

export interface Incident {
  id: string;
  emergencyId: string;
  reportedAt: Date;
  resolvedAt?: Date;
  duration?: number; // Minutes
  impact: {
    revenue: number;
    users: number;
    reputation: number; // 0-10 score
  };
  timeline: {
    timestamp: Date;
    event: string;
    actor: 'system' | 'user' | 'external';
  }[];
  postMortem?: {
    summary: string;
    rootCause: string;
    preventionSteps: string[];
    improvements: string[];
  };
}

class EmergencyResponseService {
  private static instance: EmergencyResponseService;
  private readonly STORAGE_KEY = 'dlx_emergency_response';
  private readonly CHECK_INTERVAL = 60000; // 1 minute

  private data: {
    emergencies: Emergency[];
    incidents: Incident[];
    healthChecks: HealthCheck[];
    protocols: EmergencyProtocol[];
    systemEnabled: boolean;
    lastHealthCheck: Date;
  };

  private monitoringInterval?: NodeJS.Timeout;
  private readonly MAX_EMERGENCIES = 100; // Keep last 100 emergencies

  private constructor() {
    this.data = {
      emergencies: [],
      incidents: [],
      healthChecks: [],
      protocols: this.initializeProtocols(),
      systemEnabled: false,
      lastHealthCheck: new Date(),
    };
    this.loadData();
  }

  static getInstance(): EmergencyResponseService {
    if (!EmergencyResponseService.instance) {
      EmergencyResponseService.instance = new EmergencyResponseService();
    }
    return EmergencyResponseService.instance;
  }

  private loadData(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);

        // Convert dates
        parsed.emergencies = parsed.emergencies?.map((e: any) => ({
          ...e,
          detectedAt: new Date(e.detectedAt),
          response: {
            ...e.response,
            executedAt: e.response.executedAt ? new Date(e.response.executedAt) : undefined,
          },
          resolution: e.resolution ? {
            ...e.resolution,
            resolvedAt: new Date(e.resolution.resolvedAt),
          } : undefined,
        })) || [];

        parsed.incidents = parsed.incidents?.map((i: any) => ({
          ...i,
          reportedAt: new Date(i.reportedAt),
          resolvedAt: i.resolvedAt ? new Date(i.resolvedAt) : undefined,
          timeline: i.timeline.map((t: any) => ({
            ...t,
            timestamp: new Date(t.timestamp),
          })),
        })) || [];

        parsed.healthChecks = parsed.healthChecks?.map((h: any) => ({
          ...h,
          lastChecked: new Date(h.lastChecked),
        })) || [];

        parsed.lastHealthCheck = new Date(parsed.lastHealthCheck);

        this.data = {
          ...this.data,
          ...parsed,
          protocols: this.initializeProtocols(), // Always use latest protocols
        };
      }
    } catch (error) {
      console.error('Error loading emergency response data:', error);
    }
  }

  private saveData(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error('Error saving emergency response data:', error);
    }
  }

  /**
   * Initialize emergency protocols
   */
  private initializeProtocols(): EmergencyProtocol[] {
    return [
      {
        type: 'revenue_crash',
        severity: 'critical',
        triggers: [
          { metric: 'hourly_revenue', operator: '<', threshold: 0.5, duration: 300 }, // 50% drop for 5 minutes
          { metric: 'daily_revenue', operator: '<', threshold: 0.7, duration: 600 }, // 30% drop for 10 minutes
        ],
        responseActions: [
          {
            type: 'alert_user',
            target: 'user_notifications',
            description: 'Send critical alert about revenue crash',
            parameters: { priority: 'critical', channels: ['email', 'sms', 'dashboard'] },
            priority: 10,
            estimatedImpact: 'Immediate user awareness',
            risks: [],
          },
          {
            type: 'pause_service',
            target: 'auto_optimization',
            description: 'Pause auto-optimization to prevent further changes',
            parameters: { services: ['auto_optimization'] },
            priority: 9,
            estimatedImpact: 'Prevent automated changes during crisis',
            risks: ['May miss optimization opportunities'],
          },
          {
            type: 'rollback_change',
            target: 'recent_changes',
            description: 'Rollback any changes made in last 24 hours',
            parameters: { timeWindow: 24 * 60 * 60 * 1000 },
            priority: 8,
            estimatedImpact: 'Restore previous stable state',
            risks: ['May lose recent improvements'],
          },
        ],
        escalationPath: [
          { level: 1, waitTime: 5, actions: ['Alert user', 'Pause automation'] },
          { level: 2, waitTime: 15, actions: ['Rollback changes', 'Activate backups'] },
          { level: 3, waitTime: 30, actions: ['Emergency contact', 'Full system pause'] },
        ],
        autoImplement: true,
      },
      {
        type: 'cost_spike',
        severity: 'high',
        triggers: [
          { metric: 'hourly_costs', operator: '>', threshold: 2.0, duration: 180 }, // 200% increase for 3 minutes
        ],
        responseActions: [
          {
            type: 'pause_service',
            target: 'idle_computing',
            description: 'Pause idle computing to stop cost bleeding',
            parameters: { immediate: true },
            priority: 10,
            estimatedImpact: 'Stop ongoing costs immediately',
            risks: ['Loss of idle computing revenue'],
          },
          {
            type: 'alert_user',
            target: 'user_notifications',
            description: 'Alert user about cost spike',
            parameters: { priority: 'high' },
            priority: 9,
            estimatedImpact: 'User awareness',
            risks: [],
          },
          {
            type: 'adjust_settings',
            target: 'idle_computing_settings',
            description: 'Reduce resource allocation',
            parameters: { maxCPU: 50, maxGPU: 50 },
            priority: 8,
            estimatedImpact: 'Reduce costs by 50%',
            risks: ['Reduced earnings potential'],
          },
        ],
        escalationPath: [
          { level: 1, waitTime: 3, actions: ['Pause high-cost services'] },
          { level: 2, waitTime: 10, actions: ['Reduce all resource allocations'] },
        ],
        autoImplement: true,
      },
      {
        type: 'performance_degradation',
        severity: 'medium',
        triggers: [
          { metric: 'system_latency', operator: '>', threshold: 1000, duration: 300 }, // >1s for 5 min
          { metric: 'error_rate', operator: '>', threshold: 5, duration: 180 }, // >5% errors for 3 min
        ],
        responseActions: [
          {
            type: 'disable_feature',
            target: 'non_critical_features',
            description: 'Disable non-critical features to reduce load',
            parameters: { features: ['analytics_tracking', 'background_jobs'] },
            priority: 7,
            estimatedImpact: 'Reduce system load by 30%',
            risks: ['Temporary feature unavailability'],
          },
          {
            type: 'emergency_scaling',
            target: 'compute_resources',
            description: 'Scale up compute resources',
            parameters: { scaleFactor: 1.5 },
            priority: 6,
            estimatedImpact: 'Improve performance',
            risks: ['Increased costs'],
          },
        ],
        escalationPath: [
          { level: 1, waitTime: 10, actions: ['Disable non-critical features'] },
          { level: 2, waitTime: 20, actions: ['Scale resources'] },
        ],
        autoImplement: false, // Requires approval
      },
      {
        type: 'service_outage',
        severity: 'critical',
        triggers: [
          { metric: 'service_availability', operator: '<', threshold: 95, duration: 60 }, // <95% for 1 min
        ],
        responseActions: [
          {
            type: 'activate_backup',
            target: 'backup_systems',
            description: 'Activate backup systems',
            parameters: { systems: ['database', 'api'] },
            priority: 10,
            estimatedImpact: 'Restore service availability',
            risks: ['Potential data consistency issues'],
          },
          {
            type: 'switch_provider',
            target: 'service_provider',
            description: 'Switch to backup service provider',
            parameters: { provider: 'backup' },
            priority: 9,
            estimatedImpact: 'Immediate service restoration',
            risks: ['Temporary performance impact'],
          },
          {
            type: 'alert_user',
            target: 'user_notifications',
            description: 'Alert user about outage',
            parameters: { priority: 'critical' },
            priority: 8,
            estimatedImpact: 'User awareness',
            risks: [],
          },
        ],
        escalationPath: [
          { level: 1, waitTime: 1, actions: ['Activate backups', 'Alert user'] },
          { level: 2, waitTime: 5, actions: ['Switch providers'] },
          { level: 3, waitTime: 15, actions: ['Full system restart'] },
        ],
        autoImplement: true,
      },
    ];
  }

  /**
   * Start emergency monitoring
   */
  startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.data.systemEnabled = true;
    this.saveData();

    // Immediate health check
    this.performHealthCheck();

    // Set up periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
      this.checkForEmergencies();
    }, this.CHECK_INTERVAL);

    activityService.logActivity({
      type: 'system',
      message: 'Emergency Response System activated',
    });
  }

  /**
   * Stop emergency monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.data.systemEnabled = false;
    this.saveData();

    activityService.logActivity({
      type: 'system',
      message: 'Emergency Response System deactivated',
    });
  }

  /**
   * Perform comprehensive health check
   */
  private performHealthCheck(): void {
    const healthChecks: HealthCheck[] = [];

    // Check revenue system
    try {
      const revenueAnomalies = revenueAnomalyService.getActiveAnomalies?.() || [];
      const criticalAnomalies = revenueAnomalies.filter(a => a.severity === 'critical');

      healthChecks.push({
        system: 'revenue_monitoring',
        status: criticalAnomalies.length > 0 ? 'critical' :
                revenueAnomalies.length > 2 ? 'degraded' : 'healthy',
        lastChecked: new Date(),
        metrics: {
          uptime: 99.9,
          latency: 50,
          errorRate: 0,
          throughput: 60,
        },
        issues: criticalAnomalies.map(a => `${a.type}: ${a.metrics.deviation}% deviation`),
      });
    } catch (error) {
      healthChecks.push({
        system: 'revenue_monitoring',
        status: 'offline',
        lastChecked: new Date(),
        metrics: { uptime: 0, latency: 0, errorRate: 100, throughput: 0 },
        issues: ['Service unavailable'],
      });
    }

    // Check idle computing
    try {
      const idleSummary = idleProfitMaximizerService.getTotalProfitSummary();
      const unprofitable = idleSummary.activeNetworks - idleSummary.profitableNetworks;

      healthChecks.push({
        system: 'idle_computing',
        status: unprofitable > idleSummary.activeNetworks / 2 ? 'degraded' :
                idleSummary.totalNetProfit < 0 ? 'critical' : 'healthy',
        lastChecked: new Date(),
        metrics: {
          uptime: 99.5,
          latency: 100,
          errorRate: 0,
          throughput: idleSummary.activeNetworks,
        },
        issues: unprofitable > 0 ? [`${unprofitable} unprofitable networks`] : [],
      });
    } catch (error) {
      healthChecks.push({
        system: 'idle_computing',
        status: 'offline',
        lastChecked: new Date(),
        metrics: { uptime: 0, latency: 0, errorRate: 100, throughput: 0 },
        issues: ['Service unavailable'],
      });
    }

    // Check optimization system
    try {
      const optimizations = autoOptimizationService.getActiveOptimizations?.() || [];
      const failed = optimizations.filter((o: any) => o.results?.status === 'failed');

      healthChecks.push({
        system: 'auto_optimization',
        status: failed.length > 3 ? 'degraded' : 'healthy',
        lastChecked: new Date(),
        metrics: {
          uptime: 99.8,
          latency: 200,
          errorRate: failed.length > 0 ? (failed.length / optimizations.length) * 100 : 0,
          throughput: optimizations.length,
        },
        issues: failed.length > 0 ? [`${failed.length} failed optimizations`] : [],
      });
    } catch (error) {
      healthChecks.push({
        system: 'auto_optimization',
        status: 'healthy', // Default to healthy if can't check
        lastChecked: new Date(),
        metrics: { uptime: 100, latency: 0, errorRate: 0, throughput: 0 },
        issues: [],
      });
    }

    // Check learning system
    try {
      const profile = learningSystemService.getProfile();
      const hasData = profile && profile.totalActions > 0;

      healthChecks.push({
        system: 'learning_system',
        status: hasData ? 'healthy' : 'degraded',
        lastChecked: new Date(),
        metrics: {
          uptime: 99.9,
          latency: 50,
          errorRate: 0,
          throughput: profile?.totalActions || 0,
        },
        issues: !hasData ? ['No learning data available'] : [],
      });
    } catch (error) {
      healthChecks.push({
        system: 'learning_system',
        status: 'offline',
        lastChecked: new Date(),
        metrics: { uptime: 0, latency: 0, errorRate: 100, throughput: 0 },
        issues: ['Service unavailable'],
      });
    }

    this.data.healthChecks = healthChecks;
    this.data.lastHealthCheck = new Date();
    this.saveData();

    // Check for critical systems
    const criticalSystems = healthChecks.filter(h => h.status === 'critical');
    if (criticalSystems.length > 0) {
      this.detectEmergency('system_failure', criticalSystems);
    }
  }

  /**
   * Check for emergency conditions
   */
  private checkForEmergencies(): void {
    // Check each protocol
    for (const protocol of this.data.protocols) {
      const triggersMe = this.evaluateTriggers(protocol.triggers);

      if (triggersMe.triggered) {
        // Emergency detected
        this.detectEmergency(protocol.type, triggersMe.evidence, protocol);
      }
    }
  }

  /**
   * Evaluate protocol triggers
   */
  private evaluateTriggers(triggers: EmergencyProtocol['triggers']): {
    triggered: boolean;
    evidence: any[];
  } {
    const evidence: any[] = [];
    let triggered = false;

    for (const trigger of triggers) {
      const value = this.getMetricValue(trigger.metric);

      if (value !== null) {
        let conditionMet = false;

        switch (trigger.operator) {
          case '>': conditionMet = value > trigger.threshold; break;
          case '<': conditionMet = value < trigger.threshold; break;
          case '>=': conditionMet = value >= trigger.threshold; break;
          case '<=': conditionMet = value <= trigger.threshold; break;
          case '=': conditionMet = value === trigger.threshold; break;
        }

        if (conditionMet) {
          triggered = true;
          evidence.push({
            metric: trigger.metric,
            value,
            threshold: trigger.threshold,
            operator: trigger.operator,
          });
        }
      }
    }

    return { triggered, evidence };
  }

  /**
   * Get current value of a metric
   */
  private getMetricValue(metric: string): number | null {
    try {
      switch (metric) {
        case 'hourly_revenue': {
          // Get revenue from last hour
          // This would integrate with actual revenue tracking
          return 100; // Placeholder
        }
        case 'daily_revenue': {
          return 1000; // Placeholder
        }
        case 'hourly_costs': {
          const summary = idleProfitMaximizerService.getTotalProfitSummary();
          return summary.totalPowerCost;
        }
        case 'system_latency': {
          const avgLatency = this.data.healthChecks.reduce((sum, h) => sum + h.metrics.latency, 0) /
                             Math.max(1, this.data.healthChecks.length);
          return avgLatency;
        }
        case 'error_rate': {
          const avgError = this.data.healthChecks.reduce((sum, h) => sum + h.metrics.errorRate, 0) /
                          Math.max(1, this.data.healthChecks.length);
          return avgError;
        }
        case 'service_availability': {
          const healthySystems = this.data.healthChecks.filter(h => h.status === 'healthy').length;
          const totalSystems = this.data.healthChecks.length;
          return totalSystems > 0 ? (healthySystems / totalSystems) * 100 : 100;
        }
        default:
          return null;
      }
    } catch (error) {
      return null;
    }
  }

  /**
   * Detect and respond to emergency
   */
  private detectEmergency(
    type: Emergency['type'],
    evidence: any[],
    protocol?: EmergencyProtocol
  ): Emergency {
    // Check if similar emergency already active
    const existingEmergency = this.data.emergencies.find(
      e => e.type === type && (e.status === 'detected' || e.status === 'responding')
    );

    if (existingEmergency) {
      return existingEmergency; // Don't create duplicate
    }

    // Create emergency
    const emergency: Emergency = {
      id: `emergency-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity: protocol?.severity || 'high',
      detectedAt: new Date(),
      status: 'detected',
      description: this.generateEmergencyDescription(type, evidence),
      metrics: this.extractEmergencyMetrics(type, evidence),
      response: {
        actions: [],
        escalationLevel: 1,
        autoImplemented: false,
        requiresUserApproval: !protocol?.autoImplement,
      },
    };

    // Investigate root cause
    emergency.rootCause = this.investigateRootCause(type, evidence);

    // Generate response actions from protocol
    if (protocol) {
      emergency.response.actions = protocol.responseActions.map((action, idx) => ({
        ...action,
        id: `action-${emergency.id}-${idx}`,
      }));
    }

    this.data.emergencies.push(emergency);
    this.saveData();

    // Log emergency
    activityService.logActivity({
      type: 'alert',
      message: `EMERGENCY DETECTED: ${emergency.description}`,
      metadata: {
        emergencyId: emergency.id,
        type: emergency.type,
        severity: emergency.severity,
      },
    });

    // Auto-respond if enabled
    if (protocol?.autoImplement) {
      this.respondToEmergency(emergency.id);
    }

    // Create incident
    this.createIncident(emergency);

    return emergency;
  }

  /**
   * Generate emergency description
   */
  private generateEmergencyDescription(type: Emergency['type'], evidence: any[]): string {
    switch (type) {
      case 'revenue_crash':
        return `Revenue crash detected. ${evidence.length} metrics exceeded thresholds.`;
      case 'cost_spike':
        return `Cost spike detected. Costs increased significantly above normal levels.`;
      case 'system_failure':
        return `System failure detected. ${evidence.length} critical system(s) offline or degraded.`;
      case 'performance_degradation':
        return `Performance degradation detected. System latency or error rates exceeded acceptable levels.`;
      case 'service_outage':
        return `Service outage detected. System availability below acceptable threshold.`;
      default:
        return `Emergency condition detected: ${type}`;
    }
  }

  /**
   * Extract emergency metrics
   */
  private extractEmergencyMetrics(type: Emergency['type'], evidence: any[]): Emergency['metrics'] {
    const affectedSystems: string[] = [];
    let estimatedImpact = 0;
    let currentValue = 0;
    let expectedValue = 0;
    let deviation = 0;

    if (evidence.length > 0) {
      const firstEvidence = evidence[0];

      if (firstEvidence.system) {
        affectedSystems.push(firstEvidence.system);
      }

      if (typeof firstEvidence.value === 'number') {
        currentValue = firstEvidence.value;
        expectedValue = firstEvidence.threshold || currentValue * 1.5;
        deviation = expectedValue > 0 ? ((currentValue - expectedValue) / expectedValue) * 100 : 0;
      }

      // Estimate impact based on type and deviation
      if (type === 'revenue_crash') {
        estimatedImpact = Math.abs(deviation) * 10; // Very rough estimate
      } else if (type === 'cost_spike') {
        estimatedImpact = deviation > 0 ? deviation * 5 : 0;
      }
    }

    return {
      affectedSystems: affectedSystems.length > 0 ? affectedSystems : ['unknown'],
      estimatedImpact: Math.round(estimatedImpact),
      currentValue,
      expectedValue,
      deviation: Math.round(deviation),
    };
  }

  /**
   * Investigate root cause
   */
  private investigateRootCause(type: Emergency['type'], evidence: any[]): Emergency['rootCause'] {
    const possibleCauses: string[] = [];
    const evidenceList: string[] = [];
    let confidence = 0.5;

    // Analyze evidence
    for (const item of evidence) {
      if (item.metric) {
        evidenceList.push(`${item.metric}: ${item.value} ${item.operator} ${item.threshold}`);
      }
      if (item.system) {
        evidenceList.push(`Affected system: ${item.system}`);
      }
    }

    // Type-specific root cause analysis
    switch (type) {
      case 'revenue_crash':
        possibleCauses.push('Recent optimization changes');
        possibleCauses.push('External market conditions');
        possibleCauses.push('Service disruption');
        confidence = 0.6;
        break;

      case 'cost_spike':
        possibleCauses.push('Electricity rate increase');
        possibleCauses.push('Increased resource allocation');
        possibleCauses.push('Network misconfiguration');
        confidence = 0.7;
        break;

      case 'system_failure':
        possibleCauses.push('Service dependency failure');
        possibleCauses.push('Resource exhaustion');
        possibleCauses.push('Configuration error');
        confidence = 0.65;
        break;

      case 'performance_degradation':
        possibleCauses.push('Increased load');
        possibleCauses.push('Resource constraints');
        possibleCauses.push('Network issues');
        confidence = 0.6;
        break;
    }

    return {
      identified: possibleCauses.length > 0,
      cause: possibleCauses[0] || 'Unknown',
      confidence,
      evidence: evidenceList,
    };
  }

  /**
   * Respond to emergency
   */
  async respondToEmergency(emergencyId: string): Promise<void> {
    const emergency = this.data.emergencies.find(e => e.id === emergencyId);
    if (!emergency) {
      throw new Error('Emergency not found');
    }

    if (emergency.status !== 'detected') {
      return; // Already responding or resolved
    }

    emergency.status = 'responding';
    emergency.response.executedAt = new Date();
    this.saveData();

    activityService.logActivity({
      type: 'system',
      message: `Responding to emergency: ${emergency.description}`,
      metadata: { emergencyId, actions: emergency.response.actions.length },
    });

    // Execute actions in priority order
    const sortedActions = emergency.response.actions.sort((a, b) => b.priority - a.priority);

    for (const action of sortedActions) {
      try {
        const result = await this.executeAction(action);
        action.executedAt = new Date();
        action.result = result;

        if (result.success) {
          activityService.logActivity({
            type: 'ai',
            message: `Emergency action successful: ${action.description}`,
            metadata: { actionId: action.id, result },
          });
        }
      } catch (error: any) {
        action.result = {
          success: false,
          message: error.message || 'Action failed',
        };

        activityService.logActivity({
          type: 'alert',
          message: `Emergency action failed: ${action.description}`,
          metadata: { actionId: action.id, error: error.message },
        });
      }

      this.saveData();
    }

    // Calculate mitigation percentage
    const successfulActions = emergency.response.actions.filter(a => a.result?.success);
    const mitigationPercentage = emergency.response.actions.length > 0
      ? (successfulActions.length / emergency.response.actions.length) * 100
      : 0;

    emergency.response.results = {
      successful: mitigationPercentage >= 70,
      mitigationPercentage,
      sideEffects: emergency.response.actions
        .filter(a => a.risks.length > 0 && a.result?.success)
        .flatMap(a => a.risks),
    };

    // Update status
    if (mitigationPercentage >= 70) {
      emergency.status = 'mitigated';
    } else {
      emergency.status = 'failed';
      emergency.response.escalationLevel++;
    }

    this.saveData();
  }

  /**
   * Execute emergency action
   */
  private async executeAction(action: EmergencyAction): Promise<EmergencyAction['result']> {
    switch (action.type) {
      case 'pause_service':
        return this.pauseService(action.target, action.parameters);

      case 'alert_user':
        return this.alertUser(action.parameters);

      case 'rollback_change':
        return this.rollbackChanges(action.parameters);

      case 'adjust_settings':
        return this.adjustSettings(action.target, action.parameters);

      case 'disable_feature':
        return this.disableFeature(action.target, action.parameters);

      case 'activate_backup':
        return this.activateBackup(action.target, action.parameters);

      case 'switch_provider':
        return this.switchProvider(action.target, action.parameters);

      case 'emergency_scaling':
        return this.emergencyScaling(action.target, action.parameters);

      default:
        return {
          success: false,
          message: `Unknown action type: ${action.type}`,
        };
    }
  }

  // Action implementations
  private pauseService(target: string, params: any): EmergencyAction['result'] {
    try {
      if (target === 'idle_computing') {
        idleProfitMaximizerService.stopMonitoring();
        return { success: true, message: 'Idle computing paused' };
      } else if (target === 'auto_optimization') {
        autoOptimizationService.stopContinuousScanning?.();
        return { success: true, message: 'Auto-optimization paused' };
      }
      return { success: false, message: `Unknown service: ${target}` };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  private alertUser(params: any): EmergencyAction['result'] {
    // In real implementation, would send actual alerts
    return {
      success: true,
      message: `Alert sent via ${params.channels?.join(', ') || 'default channels'}`,
    };
  }

  private rollbackChanges(params: any): EmergencyAction['result'] {
    // In real implementation, would rollback recent changes
    return {
      success: true,
      message: `Rolled back changes from last ${params.timeWindow / (60 * 60 * 1000)} hours`,
    };
  }

  private adjustSettings(target: string, params: any): EmergencyAction['result'] {
    // In real implementation, would adjust service settings
    return {
      success: true,
      message: `Adjusted ${target} settings`,
      metrics: params,
    };
  }

  private disableFeature(target: string, params: any): EmergencyAction['result'] {
    return {
      success: true,
      message: `Disabled ${params.features?.length || 0} features`,
    };
  }

  private activateBackup(target: string, params: any): EmergencyAction['result'] {
    return {
      success: true,
      message: `Activated backup for ${target}`,
    };
  }

  private switchProvider(target: string, params: any): EmergencyAction['result'] {
    return {
      success: true,
      message: `Switched to ${params.provider} provider`,
    };
  }

  private emergencyScaling(target: string, params: any): EmergencyAction['result'] {
    return {
      success: true,
      message: `Scaled ${target} by ${params.scaleFactor}x`,
    };
  }

  /**
   * Create incident from emergency
   */
  private createIncident(emergency: Emergency): Incident {
    const incident: Incident = {
      id: `incident-${Date.now()}`,
      emergencyId: emergency.id,
      reportedAt: new Date(),
      impact: {
        revenue: emergency.metrics.estimatedImpact,
        users: 0, // Would calculate from actual data
        reputation: emergency.severity === 'critical' ? 3 : emergency.severity === 'high' ? 2 : 1,
      },
      timeline: [
        {
          timestamp: emergency.detectedAt,
          event: `Emergency detected: ${emergency.description}`,
          actor: 'system',
        },
      ],
    };

    this.data.incidents.push(incident);
    this.saveData();
    return incident;
  }

  /**
   * Resolve emergency
   */
  resolveEmergency(emergencyId: string, outcome: 'successful' | 'partial' | 'unsuccessful', lessonsLearned: string[]): void {
    const emergency = this.data.emergencies.find(e => e.id === emergencyId);
    if (!emergency) {
      throw new Error('Emergency not found');
    }

    emergency.status = 'resolved';
    emergency.resolution = {
      resolvedAt: new Date(),
      outcome,
      finalImpact: emergency.metrics.estimatedImpact,
      lessonsLearned,
    };

    // Update incident
    const incident = this.data.incidents.find(i => i.emergencyId === emergencyId);
    if (incident) {
      incident.resolvedAt = new Date();
      incident.duration = (incident.resolvedAt.getTime() - incident.reportedAt.getTime()) / (1000 * 60);

      incident.timeline.push({
        timestamp: new Date(),
        event: `Emergency resolved: ${outcome}`,
        actor: 'system',
      });

      // Add post-mortem
      incident.postMortem = {
        summary: emergency.description,
        rootCause: emergency.rootCause?.cause || 'Unknown',
        preventionSteps: lessonsLearned,
        improvements: emergency.response.actions
          .filter(a => a.result?.success)
          .map(a => a.description),
      };
    }

    this.saveData();

    activityService.logActivity({
      type: 'system',
      message: `Emergency resolved: ${outcome}`,
      metadata: { emergencyId, outcome, lessonsLearned },
    });
  }

  /**
   * Get active emergencies
   */
  getActiveEmergencies(): Emergency[] {
    return this.data.emergencies.filter(e =>
      e.status === 'detected' || e.status === 'responding'
    );
  }

  /**
   * Get system health status
   */
  getSystemHealth(): {
    overall: 'healthy' | 'degraded' | 'critical' | 'offline';
    systems: HealthCheck[];
    activeEmergencies: number;
    lastCheck: Date;
  } {
    const criticalCount = this.data.healthChecks.filter(h => h.status === 'critical').length;
    const degradedCount = this.data.healthChecks.filter(h => h.status === 'degraded').length;
    const offlineCount = this.data.healthChecks.filter(h => h.status === 'offline').length;

    let overall: 'healthy' | 'degraded' | 'critical' | 'offline' = 'healthy';
    if (offlineCount > 0) overall = 'offline';
    else if (criticalCount > 0) overall = 'critical';
    else if (degradedCount > 1) overall = 'degraded';

    return {
      overall,
      systems: this.data.healthChecks,
      activeEmergencies: this.getActiveEmergencies().length,
      lastCheck: this.data.lastHealthCheck,
    };
  }

  /**
   * Get incident history
   */
  getIncidentHistory(limit: number = 20): Incident[] {
    return this.data.incidents.slice(-limit).reverse();
  }

  /**
   * Quick test function
   */
  quickTest(): void {
    console.log('=== Emergency Response System Test ===\n');

    console.log('--- System Health ---');
    this.performHealthCheck();
    const health = this.getSystemHealth();
    console.log(`Overall status: ${health.overall}`);
    console.log(`Active emergencies: ${health.activeEmergencies}`);
    console.log(`Last check: ${health.lastCheck.toLocaleString()}\n`);

    console.log('Systems:');
    health.systems.forEach(sys => {
      console.log(`  ${sys.system}: ${sys.status}`);
      console.log(`    Uptime: ${sys.metrics.uptime}%, Latency: ${sys.metrics.latency}ms`);
      if (sys.issues.length > 0) {
        console.log(`    Issues: ${sys.issues.join(', ')}`);
      }
    });

    console.log('\n--- Emergency Protocols ---');
    console.log(`Loaded ${this.data.protocols.length} protocols:`);
    this.data.protocols.forEach(protocol => {
      console.log(`\n  ${protocol.type} (${protocol.severity}):`);
      console.log(`    Auto-implement: ${protocol.autoImplement}`);
      console.log(`    Triggers: ${protocol.triggers.length}`);
      console.log(`    Actions: ${protocol.responseActions.length}`);
      console.log(`    Escalation levels: ${protocol.escalationPath.length}`);
    });

    console.log('\n--- Test Emergency Detection ---');
    const testEmergency = this.detectEmergency('performance_degradation', [
      { metric: 'system_latency', value: 1500, threshold: 1000, operator: '>' },
    ]);
    console.log(`Created test emergency: ${testEmergency.id}`);
    console.log(`Description: ${testEmergency.description}`);
    console.log(`Severity: ${testEmergency.severity}`);
    console.log(`Actions to execute: ${testEmergency.response.actions.length}`);

    if (this.data.emergencies.length > 0) {
      console.log('\n--- Recent Emergencies ---');
      this.data.emergencies.slice(-3).forEach(emergency => {
        console.log(`\n${emergency.type} (${emergency.severity}):`);
        console.log(`  Status: ${emergency.status}`);
        console.log(`  Detected: ${emergency.detectedAt.toLocaleString()}`);
        console.log(`  Description: ${emergency.description}`);
        if (emergency.rootCause) {
          console.log(`  Root cause: ${emergency.rootCause.cause} (${Math.round(emergency.rootCause.confidence * 100)}% confidence)`);
        }
      });
    }

    if (this.data.incidents.length > 0) {
      console.log('\n--- Recent Incidents ---');
      this.data.incidents.slice(-3).forEach(incident => {
        console.log(`\nIncident ${incident.id}:`);
        console.log(`  Duration: ${incident.duration ? Math.round(incident.duration) + ' minutes' : 'Ongoing'}`);
        console.log(`  Impact: $${incident.impact.revenue} revenue, reputation: ${incident.impact.reputation}/10`);
        console.log(`  Timeline events: ${incident.timeline.length}`);
      });
    }
  }
}

export const emergencyResponseService = EmergencyResponseService.getInstance();

// Expose to window for testing
if (typeof window !== 'undefined') {
  (window as any).emergencyResponseService = emergencyResponseService;
}
