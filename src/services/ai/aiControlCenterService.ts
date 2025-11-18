/**
 * AI Control Center
 * Centralized control and configuration for all AI systems
 * Master control panel for enabling/disabling and configuring AI features
 */

import { learningSystemService } from '../learning/learningSystemService';
import { autoOptimizationService } from '../optimization/autoOptimizationService';
import { smartSchedulerService } from '../scheduling/smartSchedulerService';
import { contentRecyclerService } from '../content/contentRecyclerService';
import { idleProfitMaximizerService } from '../idle-computing/idleProfitMaximizerService';
import { emergencyResponseService } from '../safety/emergencyResponseService';
import { aiNotificationService } from './aiNotificationService';
import { activityService } from '../activity/activityService';

export interface AISystemStatus {
  id: string;
  name: string;
  category: 'learning' | 'optimization' | 'automation' | 'safety' | 'analytics';
  enabled: boolean;
  running: boolean;
  health: 'healthy' | 'degraded' | 'offline' | 'error';
  lastActive?: Date;
  stats?: {
    actionsToday: number;
    successRate: number;
    totalImpact: number; // Dollar value
  };
}

export interface AISettings {
  // Global AI settings
  aiEnabled: boolean;
  autoApproveOptimizations: boolean;
  aggressiveness: 'conservative' | 'balanced' | 'aggressive';
  maxDailyChanges: number;

  // System-specific settings
  learning: {
    enabled: boolean;
    minConfidence: number; // 0-1
    trackingEnabled: boolean;
  };

  optimization: {
    enabled: boolean;
    autoImplement: boolean;
    scanInterval: number; // Minutes
    minROI: number; // Percentage
  };

  scheduler: {
    enabled: boolean;
    autoOptimize: boolean;
    platformsEnabled: string[];
  };

  contentRecycler: {
    enabled: boolean;
    autoRecycle: boolean;
    minPerformanceScore: number;
    maxRecyclesPerContent: number;
  };

  idleComputing: {
    enabled: boolean;
    autoOptimize: boolean;
    profitThreshold: number; // Minimum $/hour
  };

  emergency: {
    enabled: boolean;
    autoRespond: boolean;
    criticalOnly: boolean;
  };

  notifications: {
    enabled: boolean;
    soundEnabled: boolean;
    desktopEnabled: boolean;
    minPriority: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface AIPerformanceReport {
  period: '24h' | '7d' | '30d';
  generatedAt: Date;

  summary: {
    totalOptimizations: number;
    successfulOptimizations: number;
    totalRevenue: number;
    totalSavings: number;
    netImpact: number;
  };

  bySystem: {
    [key: string]: {
      actions: number;
      successRate: number;
      impact: number;
    };
  };

  topWins: Array<{
    system: string;
    description: string;
    impact: number;
    timestamp: Date;
  }>;

  recommendations: string[];
}

class AIControlCenterService {
  private static instance: AIControlCenterService;
  private readonly STORAGE_KEY = 'dlx_ai_control_center';

  private data: {
    settings: AISettings;
    systemStatuses: AISystemStatus[];
    lastHealthCheck: Date;
  };

  private constructor() {
    this.data = {
      settings: this.getDefaultSettings(),
      systemStatuses: [],
      lastHealthCheck: new Date(),
    };
    this.loadData();
  }

  static getInstance(): AIControlCenterService {
    if (!AIControlCenterService.instance) {
      AIControlCenterService.instance = new AIControlCenterService();
    }
    return AIControlCenterService.instance;
  }

  private loadData(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.lastHealthCheck = new Date(parsed.lastHealthCheck);
        parsed.systemStatuses = parsed.systemStatuses?.map((s: any) => ({
          ...s,
          lastActive: s.lastActive ? new Date(s.lastActive) : undefined,
        })) || [];
        this.data = { ...this.data, ...parsed };
      }
    } catch (error) {
      console.error('Error loading AI Control Center data:', error);
    }
  }

  private saveData(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error('Error saving AI Control Center data:', error);
    }
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): AISettings {
    return {
      aiEnabled: true,
      autoApproveOptimizations: false,
      aggressiveness: 'balanced',
      maxDailyChanges: 10,

      learning: {
        enabled: true,
        minConfidence: 0.7,
        trackingEnabled: true,
      },

      optimization: {
        enabled: true,
        autoImplement: false,
        scanInterval: 60,
        minROI: 15,
      },

      scheduler: {
        enabled: true,
        autoOptimize: false,
        platformsEnabled: ['medium', 'linkedin', 'twitter', 'wordpress'],
      },

      contentRecycler: {
        enabled: true,
        autoRecycle: false,
        minPerformanceScore: 70,
        maxRecyclesPerContent: 3,
      },

      idleComputing: {
        enabled: true,
        autoOptimize: false,
        profitThreshold: 0.15,
      },

      emergency: {
        enabled: true,
        autoRespond: true,
        criticalOnly: false,
      },

      notifications: {
        enabled: true,
        soundEnabled: true,
        desktopEnabled: false,
        minPriority: 'medium',
      },
    };
  }

  /**
   * Get current settings
   */
  getSettings(): AISettings {
    return { ...this.data.settings };
  }

  /**
   * Update settings
   */
  updateSettings(updates: Partial<AISettings>): void {
    this.data.settings = { ...this.data.settings, ...updates };
    this.saveData();

    // Apply settings to systems
    this.applySettings();

    // Notify
    aiNotificationService.notify({
      type: 'info',
      source: 'system',
      title: 'AI Settings Updated',
      message: 'AI system settings have been updated',
      priority: 'low',
    });

    activityService.logActivity({
      type: 'system',
      message: 'AI Control Center settings updated',
      metadata: { updates },
    });
  }

  /**
   * Apply settings to all systems
   */
  private applySettings(): void {
    const { settings } = this.data;

    // Update notification service
    aiNotificationService.updateSettings({
      enabled: settings.notifications.enabled,
      soundEnabled: settings.notifications.soundEnabled,
      desktopEnabled: settings.notifications.desktopEnabled,
      minPriority: settings.notifications.minPriority,
    });

    // Update optimization service
    if (settings.optimization.enabled) {
      if (settings.optimization.autoImplement) {
        autoOptimizationService.enableAutoApproval?.();
      } else {
        autoOptimizationService.disableAutoApproval?.();
      }
    }

    // Update scheduler
    if (settings.scheduler.enabled && settings.scheduler.autoOptimize) {
      smartSchedulerService.enableAutoOptimization?.();
    } else {
      smartSchedulerService.disableAutoOptimization?.();
    }

    // Update content recycler
    if (settings.contentRecycler.enabled && settings.contentRecycler.autoRecycle) {
      contentRecyclerService.enableAutoRecycle();
    } else {
      contentRecyclerService.disableAutoRecycle();
    }

    // Update idle computing
    if (settings.idleComputing.enabled && settings.idleComputing.autoOptimize) {
      idleProfitMaximizerService.enableAutoOptimization();
    } else {
      idleProfitMaximizerService.disableAutoOptimization();
    }

    // Update emergency response
    if (settings.emergency.enabled) {
      emergencyResponseService.startMonitoring();
    } else {
      emergencyResponseService.stopMonitoring();
    }
  }

  /**
   * Enable AI master switch
   */
  enableAI(): void {
    this.data.settings.aiEnabled = true;
    this.saveData();
    this.applySettings();

    aiNotificationService.notify({
      type: 'success',
      source: 'system',
      title: 'AI Systems Enabled',
      message: 'All AI systems are now active',
      priority: 'high',
    });
  }

  /**
   * Disable AI master switch
   */
  disableAI(): void {
    this.data.settings.aiEnabled = false;
    this.saveData();

    // Stop all systems
    autoOptimizationService.stopContinuousScanning?.();
    smartSchedulerService.disableAutoOptimization?.();
    contentRecyclerService.disableAutoRecycle();
    idleProfitMaximizerService.disableAutoOptimization();
    emergencyResponseService.stopMonitoring();

    aiNotificationService.notify({
      type: 'warning',
      source: 'system',
      title: 'AI Systems Disabled',
      message: 'All AI systems have been paused',
      priority: 'high',
    });
  }

  /**
   * Get status of all AI systems
   */
  getSystemStatuses(): AISystemStatus[] {
    const statuses: AISystemStatus[] = [
      {
        id: 'learning_system',
        name: 'Learning System',
        category: 'learning',
        enabled: this.data.settings.learning.enabled,
        running: this.data.settings.learning.trackingEnabled,
        health: 'healthy',
        lastActive: new Date(),
        stats: this.getLearningStats(),
      },
      {
        id: 'auto_optimization',
        name: 'Auto-Optimization Engine',
        category: 'optimization',
        enabled: this.data.settings.optimization.enabled,
        running: this.data.settings.optimization.autoImplement,
        health: 'healthy',
        stats: this.getOptimizationStats(),
      },
      {
        id: 'smart_scheduler',
        name: 'Smart Scheduler 2.0',
        category: 'automation',
        enabled: this.data.settings.scheduler.enabled,
        running: this.data.settings.scheduler.autoOptimize,
        health: 'healthy',
      },
      {
        id: 'content_recycler',
        name: 'Content Recycler',
        category: 'automation',
        enabled: this.data.settings.contentRecycler.enabled,
        running: this.data.settings.contentRecycler.autoRecycle,
        health: 'healthy',
      },
      {
        id: 'idle_profit_maximizer',
        name: 'Idle Computing Profit Maximizer',
        category: 'optimization',
        enabled: this.data.settings.idleComputing.enabled,
        running: this.data.settings.idleComputing.autoOptimize,
        health: 'healthy',
        stats: this.getIdleComputingStats(),
      },
      {
        id: 'emergency_response',
        name: 'Emergency Response System',
        category: 'safety',
        enabled: this.data.settings.emergency.enabled,
        running: this.data.settings.emergency.autoRespond,
        health: this.getEmergencyHealth(),
      },
    ];

    this.data.systemStatuses = statuses;
    this.data.lastHealthCheck = new Date();
    this.saveData();

    return statuses;
  }

  /**
   * Get learning system stats
   */
  private getLearningStats() {
    try {
      const profile = learningSystemService.getUserProfile();
      if (!profile) return undefined;

      return {
        actionsToday: profile.totalActions,
        successRate: profile.patterns.length > 0
          ? profile.patterns.reduce((sum, p) => sum + p.successRate, 0) / profile.patterns.length * 100
          : 0,
        totalImpact: 0,
      };
    } catch {
      return undefined;
    }
  }

  /**
   * Get optimization stats
   */
  private getOptimizationStats() {
    try {
      const summary = autoOptimizationService.getPerformanceSummary?.('24h');
      if (!summary) return undefined;

      return {
        actionsToday: summary.total || 0,
        successRate: summary.successRate || 0,
        totalImpact: summary.totalROI || 0,
      };
    } catch {
      return undefined;
    }
  }

  /**
   * Get idle computing stats
   */
  private getIdleComputingStats() {
    try {
      const summary = idleProfitMaximizerService.getTotalProfitSummary();

      return {
        actionsToday: summary.activeNetworks,
        successRate: summary.profitableNetworks / Math.max(1, summary.activeNetworks) * 100,
        totalImpact: summary.totalNetProfit,
      };
    } catch {
      return undefined;
    }
  }

  /**
   * Get emergency system health
   */
  private getEmergencyHealth(): AISystemStatus['health'] {
    try {
      const health = emergencyResponseService.getSystemHealth();
      return health.overall;
    } catch {
      return 'offline';
    }
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(period: '24h' | '7d' | '30d' = '24h'): AIPerformanceReport {
    const report: AIPerformanceReport = {
      period,
      generatedAt: new Date(),
      summary: {
        totalOptimizations: 0,
        successfulOptimizations: 0,
        totalRevenue: 0,
        totalSavings: 0,
        netImpact: 0,
      },
      bySystem: {},
      topWins: [],
      recommendations: [],
    };

    // Get optimization summary
    try {
      const optSummary = autoOptimizationService.getPerformanceSummary?.(period);
      if (optSummary) {
        report.summary.totalOptimizations = optSummary.total || 0;
        report.summary.successfulOptimizations = optSummary.successful || 0;
        report.summary.totalRevenue = optSummary.totalROI || 0;
      }
    } catch (error) {
      console.error('Error getting optimization summary:', error);
    }

    // Get idle computing impact
    try {
      const idleSummary = idleProfitMaximizerService.getTotalProfitSummary();
      report.summary.totalRevenue += idleSummary.projectedDailyProfit || 0;
      report.summary.totalSavings += (idleSummary.totalGrossRevenue - idleSummary.totalNetProfit) || 0;
    } catch (error) {
      console.error('Error getting idle computing summary:', error);
    }

    // Calculate net impact
    report.summary.netImpact = report.summary.totalRevenue - report.summary.totalSavings;

    // Generate recommendations
    const statuses = this.getSystemStatuses();
    const disabledSystems = statuses.filter(s => !s.enabled || !s.running);

    if (disabledSystems.length > 0) {
      report.recommendations.push(
        `${disabledSystems.length} AI system(s) are disabled. Enable them to maximize performance.`
      );
    }

    if (!this.data.settings.optimization.autoImplement) {
      report.recommendations.push(
        'Auto-implementation is disabled. Enable it to automatically apply safe optimizations.'
      );
    }

    if (report.summary.successfulOptimizations < report.summary.totalOptimizations * 0.7) {
      report.recommendations.push(
        'Optimization success rate is below 70%. Consider adjusting aggressiveness settings.'
      );
    }

    return report;
  }

  /**
   * Get quick stats for dashboard
   */
  getQuickStats(): {
    aiEnabled: boolean;
    systemsActive: number;
    systemsTotal: number;
    todayImpact: number;
    unreadAlerts: number;
  } {
    const statuses = this.getSystemStatuses();
    const notifStats = aiNotificationService.getStats();

    return {
      aiEnabled: this.data.settings.aiEnabled,
      systemsActive: statuses.filter(s => s.enabled && s.running).length,
      systemsTotal: statuses.length,
      todayImpact: statuses.reduce((sum, s) => sum + (s.stats?.totalImpact || 0), 0),
      unreadAlerts: notifStats.unread,
    };
  }

  /**
   * Emergency pause all AI
   */
  emergencyPauseAll(): void {
    this.disableAI();

    aiNotificationService.notify({
      type: 'critical',
      source: 'system',
      title: 'EMERGENCY: All AI Paused',
      message: 'All AI systems have been emergency paused',
      priority: 'critical',
    });

    activityService.logActivity({
      type: 'alert',
      message: 'Emergency pause activated - all AI systems stopped',
    });
  }

  /**
   * Reset to defaults
   */
  resetToDefaults(): void {
    this.data.settings = this.getDefaultSettings();
    this.saveData();
    this.applySettings();

    aiNotificationService.notify({
      type: 'info',
      source: 'system',
      title: 'Settings Reset',
      message: 'AI settings have been reset to defaults',
      priority: 'medium',
    });
  }

  /**
   * Quick test function
   */
  quickTest(): void {
    console.log('=== AI Control Center Test ===\n');

    console.log('--- System Statuses ---');
    const statuses = this.getSystemStatuses();
    statuses.forEach(status => {
      console.log(`\n${status.name} (${status.category}):`);
      console.log(`  Enabled: ${status.enabled}`);
      console.log(`  Running: ${status.running}`);
      console.log(`  Health: ${status.health}`);
      if (status.stats) {
        console.log(`  Actions today: ${status.stats.actionsToday}`);
        console.log(`  Success rate: ${Math.round(status.stats.successRate)}%`);
        console.log(`  Total impact: $${status.stats.totalImpact.toFixed(2)}`);
      }
    });

    console.log('\n--- Quick Stats ---');
    const quickStats = this.getQuickStats();
    console.log(`AI Enabled: ${quickStats.aiEnabled}`);
    console.log(`Active Systems: ${quickStats.systemsActive}/${quickStats.systemsTotal}`);
    console.log(`Today's Impact: $${quickStats.todayImpact.toFixed(2)}`);
    console.log(`Unread Alerts: ${quickStats.unreadAlerts}`);

    console.log('\n--- Performance Report (24h) ---');
    const report = this.generatePerformanceReport('24h');
    console.log(`Total Optimizations: ${report.summary.totalOptimizations}`);
    console.log(`Successful: ${report.summary.successfulOptimizations}`);
    console.log(`Total Revenue: $${report.summary.totalRevenue.toFixed(2)}`);
    console.log(`Total Savings: $${report.summary.totalSavings.toFixed(2)}`);
    console.log(`Net Impact: $${report.summary.netImpact.toFixed(2)}`);

    if (report.recommendations.length > 0) {
      console.log('\nRecommendations:');
      report.recommendations.forEach((rec, idx) => {
        console.log(`  ${idx + 1}. ${rec}`);
      });
    }

    console.log('\n--- Current Settings ---');
    const settings = this.getSettings();
    console.log(`Aggressiveness: ${settings.aggressiveness}`);
    console.log(`Max Daily Changes: ${settings.maxDailyChanges}`);
    console.log(`Auto-Approve Optimizations: ${settings.autoApproveOptimizations}`);
    console.log(`\nOptimization:`);
    console.log(`  Auto-Implement: ${settings.optimization.autoImplement}`);
    console.log(`  Scan Interval: ${settings.optimization.scanInterval} minutes`);
    console.log(`  Min ROI: ${settings.optimization.minROI}%`);
  }
}

export const aiControlCenterService = AIControlCenterService.getInstance();

// Expose to window for testing
if (typeof window !== 'undefined') {
  (window as any).aiControlCenterService = aiControlCenterService;
}
