/**
 * Idle Computing Profit Maximizer
 * Intelligent profit optimization for idle computing
 * Real-time cost monitoring and autonomous network switching
 */

import { idleRevenueService, IdleNetwork, EarningsHistory } from './idleRevenueService';
import { learningSystemService } from '../learning/learningSystemService';
import { revenueAnomalyService } from '../analytics/revenueAnomalyService';
import { activityService } from '../activity/activityService';

export interface ElectricityPricing {
  provider: string;
  baseRate: number; // $/kWh
  peakRate?: number; // $/kWh during peak hours
  offPeakRate?: number; // $/kWh during off-peak hours
  peakHours?: { start: number; end: number }[]; // Array of peak time windows
  timezone: string;
  lastUpdated: Date;
}

export interface NetworkProfitability {
  networkId: string;
  networkName: string;
  currentStatus: 'active' | 'paused' | 'available' | 'unprofitable';
  hourlyMetrics: {
    grossRevenue: number; // $/hour
    powerCost: number; // $/hour
    netProfit: number; // $/hour
    profitMargin: number; // Percentage
    roi: number; // Return on investment %
  };
  prediction: {
    nextHourProfit: number;
    next24HoursProfit: number;
    confidence: number;
  };
  powerConsumption: {
    cpuWatts: number;
    gpuWatts: number;
    totalWatts: number;
    costPerHour: number;
  };
  recommendation: 'start' | 'stop' | 'continue' | 'switch';
  reasoning: string;
}

export interface ProfitOptimization {
  id: string;
  type: 'network_switch' | 'shutdown' | 'startup' | 'resource_adjustment';
  timestamp: Date;
  from?: string; // Network ID
  to?: string; // Network ID
  reason: string;
  expectedSavings: number; // $/hour
  autoImplemented: boolean;
  results?: {
    actualSavings: number;
    successful: boolean;
  };
}

export interface HourlyPrediction {
  hour: number; // 0-23
  electricityCost: number; // $/kWh
  estimatedConsumption: number; // kWh
  totalPowerCost: number; // $
  estimatedRevenue: number; // $
  netProfit: number; // $
  isProfitable: boolean;
  recommendation: 'run' | 'pause' | 'reduce';
}

export interface ProfitAlert {
  id: string;
  type: 'unprofitable' | 'high_cost' | 'opportunity' | 'anomaly';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  affectedNetworks: string[];
  metrics: {
    currentProfit: number;
    threshold: number;
    difference: number;
  };
  recommendations: string[];
  autoActionTaken?: string;
  timestamp: Date;
}

class IdleProfitMaximizerService {
  private static instance: IdleProfitMaximizerService;
  private readonly STORAGE_KEY = 'dlx_idle_profit_maximizer';
  private readonly PROFITABILITY_THRESHOLD = 0.15; // Minimum $0.15/hour net profit
  private readonly SHUTDOWN_THRESHOLD = -0.05; // Shutdown if losing more than $0.05/hour

  private data: {
    electricityPricing: ElectricityPricing;
    profitabilityHistory: Array<{
      timestamp: Date;
      networkId: string;
      grossRevenue: number;
      powerCost: number;
      netProfit: number;
    }>;
    optimizations: ProfitOptimization[];
    alerts: ProfitAlert[];
    autoOptimizeEnabled: boolean;
    monitoringEnabled: boolean;
    lastPriceUpdate: Date;
  };

  private monitoringInterval?: NodeJS.Timeout;

  private constructor() {
    this.data = {
      electricityPricing: {
        provider: 'Default',
        baseRate: 0.12,
        peakRate: 0.18,
        offPeakRate: 0.08,
        peakHours: [
          { start: 16, end: 21 }, // 4 PM - 9 PM peak
        ],
        timezone: 'America/New_York',
        lastUpdated: new Date(),
      },
      profitabilityHistory: [],
      optimizations: [],
      alerts: [],
      autoOptimizeEnabled: false,
      monitoringEnabled: false,
      lastPriceUpdate: new Date(),
    };
    this.loadData();
  }

  static getInstance(): IdleProfitMaximizerService {
    if (!IdleProfitMaximizerService.instance) {
      IdleProfitMaximizerService.instance = new IdleProfitMaximizerService();
    }
    return IdleProfitMaximizerService.instance;
  }

  private loadData(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);

        // Convert date strings back to Date objects
        parsed.electricityPricing.lastUpdated = new Date(parsed.electricityPricing.lastUpdated);
        parsed.lastPriceUpdate = new Date(parsed.lastPriceUpdate);
        parsed.profitabilityHistory = parsed.profitabilityHistory?.map((h: any) => ({
          ...h,
          timestamp: new Date(h.timestamp),
        })) || [];
        parsed.optimizations = parsed.optimizations?.map((o: any) => ({
          ...o,
          timestamp: new Date(o.timestamp),
        })) || [];
        parsed.alerts = parsed.alerts?.map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp),
        })) || [];

        this.data = { ...this.data, ...parsed };
      }
    } catch (error) {
      console.error('Error loading profit maximizer data:', error);
    }
  }

  private saveData(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error('Error saving profit maximizer data:', error);
    }
  }

  /**
   * Update electricity pricing
   */
  updateElectricityPricing(pricing: Partial<ElectricityPricing>): void {
    this.data.electricityPricing = {
      ...this.data.electricityPricing,
      ...pricing,
      lastUpdated: new Date(),
    };
    this.data.lastPriceUpdate = new Date();
    this.saveData();

    activityService.logActivity({
      type: 'system',
      message: `Updated electricity pricing: $${this.data.electricityPricing.baseRate}/kWh`,
      metadata: { pricing: this.data.electricityPricing },
    });

    // Re-analyze profitability with new pricing
    if (this.data.monitoringEnabled) {
      this.analyzeProfitability();
    }
  }

  /**
   * Get current electricity rate based on time of day
   */
  getCurrentElectricityRate(time?: Date): number {
    const now = time || new Date();
    const hour = now.getHours();
    const pricing = this.data.electricityPricing;

    // Check if current hour is peak
    if (pricing.peakHours && pricing.peakRate) {
      const isPeak = pricing.peakHours.some(
        window => hour >= window.start && hour <= window.end
      );
      if (isPeak) {
        return pricing.peakRate;
      }
    }

    // Return off-peak rate if available and not peak
    if (pricing.offPeakRate && pricing.peakHours) {
      const isPeak = pricing.peakHours.some(
        window => hour >= window.start && hour <= window.end
      );
      if (!isPeak) {
        return pricing.offPeakRate;
      }
    }

    return pricing.baseRate;
  }

  /**
   * Calculate power consumption for a network
   */
  private calculatePowerConsumption(network: IdleNetwork): {
    cpuWatts: number;
    gpuWatts: number;
    totalWatts: number;
    costPerHour: number;
  } {
    let cpuWatts = 0;
    let gpuWatts = 0;

    // Estimate based on network type
    if (network.type === 'storage') {
      cpuWatts = 30; // Low CPU for storage
      gpuWatts = 0;
    } else if (network.type === 'compute') {
      if (network.requirements.minGPU) {
        cpuWatts = 95; // Full CPU
        gpuWatts = 250; // Full GPU
      } else {
        cpuWatts = 75; // High CPU
        gpuWatts = 0;
      }
    } else if (network.type === 'scientific') {
      cpuWatts = 50;
      gpuWatts = network.requirements.minGPU ? 150 : 0;
    }

    const totalWatts = cpuWatts + gpuWatts;
    const kWh = totalWatts / 1000;
    const currentRate = this.getCurrentElectricityRate();
    const costPerHour = kWh * currentRate;

    return {
      cpuWatts,
      gpuWatts,
      totalWatts,
      costPerHour,
    };
  }

  /**
   * Analyze profitability of all active networks
   */
  analyzeProfitability(): NetworkProfitability[] {
    const networks = idleRevenueService.getAvailableNetworks();
    const profitabilityAnalysis: NetworkProfitability[] = [];

    for (const network of networks) {
      const powerConsumption = this.calculatePowerConsumption(network);
      const grossRevenue = network.estimatedEarnings.hourly;
      const netProfit = grossRevenue - powerConsumption.costPerHour;
      const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
      const roi = powerConsumption.costPerHour > 0
        ? (netProfit / powerConsumption.costPerHour) * 100
        : 0;

      // Predict next hour based on historical data
      const historicalData = this.data.profitabilityHistory.filter(
        h => h.networkId === network.id
      );
      const recentData = historicalData.slice(-24); // Last 24 hours

      let nextHourProfit = netProfit; // Default to current
      let next24HoursProfit = netProfit * 24;
      let confidence = 0.5;

      if (recentData.length >= 10) {
        const avgProfit = recentData.reduce((sum, h) => sum + h.netProfit, 0) / recentData.length;
        nextHourProfit = avgProfit;
        next24HoursProfit = avgProfit * 24;
        confidence = 0.8;
      }

      // Determine recommendation
      let recommendation: 'start' | 'stop' | 'continue' | 'switch' = 'continue';
      let reasoning = '';

      if (network.status !== 'active') {
        if (netProfit > this.PROFITABILITY_THRESHOLD) {
          recommendation = 'start';
          reasoning = `Profitable at $${netProfit.toFixed(2)}/hour. Start to earn revenue.`;
        } else {
          recommendation = 'stop';
          reasoning = `Not profitable enough ($${netProfit.toFixed(2)}/hour). Keep paused.`;
        }
      } else {
        // Network is active
        if (netProfit < this.SHUTDOWN_THRESHOLD) {
          recommendation = 'stop';
          reasoning = `Losing money at $${netProfit.toFixed(2)}/hour. Stop immediately.`;
        } else if (netProfit < this.PROFITABILITY_THRESHOLD) {
          recommendation = 'switch';
          reasoning = `Low profit ($${netProfit.toFixed(2)}/hour). Consider switching to more profitable network.`;
        } else {
          recommendation = 'continue';
          reasoning = `Profitable at $${netProfit.toFixed(2)}/hour. Continue running.`;
        }
      }

      // Determine status
      let currentStatus: 'active' | 'paused' | 'available' | 'unprofitable' = network.status as any;
      if (netProfit < this.SHUTDOWN_THRESHOLD) {
        currentStatus = 'unprofitable';
      }

      profitabilityAnalysis.push({
        networkId: network.id,
        networkName: network.name,
        currentStatus,
        hourlyMetrics: {
          grossRevenue,
          powerCost: powerConsumption.costPerHour,
          netProfit,
          profitMargin,
          roi,
        },
        prediction: {
          nextHourProfit,
          next24HoursProfit,
          confidence,
        },
        powerConsumption,
        recommendation,
        reasoning,
      });

      // Record profitability history
      this.data.profitabilityHistory.push({
        timestamp: new Date(),
        networkId: network.id,
        grossRevenue,
        powerCost: powerConsumption.costPerHour,
        netProfit,
      });
    }

    // Keep last 7 days of history
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    this.data.profitabilityHistory = this.data.profitabilityHistory.filter(
      h => h.timestamp >= sevenDaysAgo
    );

    this.saveData();
    return profitabilityAnalysis;
  }

  /**
   * Predict hourly profitability for next 24 hours
   */
  predictHourlyProfitability(networkId: string): HourlyPrediction[] {
    const network = idleRevenueService.getAvailableNetworks().find(n => n.id === networkId);
    if (!network) {
      return [];
    }

    const predictions: HourlyPrediction[] = [];
    const powerConsumption = this.calculatePowerConsumption(network);
    const now = new Date();

    for (let i = 0; i < 24; i++) {
      const hour = (now.getHours() + i) % 24;
      const futureTime = new Date(now);
      futureTime.setHours(futureTime.getHours() + i);

      const electricityCost = this.getCurrentElectricityRate(futureTime);
      const estimatedConsumption = powerConsumption.totalWatts / 1000; // kWh
      const totalPowerCost = estimatedConsumption * electricityCost;
      const estimatedRevenue = network.estimatedEarnings.hourly;
      const netProfit = estimatedRevenue - totalPowerCost;
      const isProfitable = netProfit > this.PROFITABILITY_THRESHOLD;

      let recommendation: 'run' | 'pause' | 'reduce' = 'run';
      if (!isProfitable) {
        recommendation = 'pause';
      } else if (netProfit < this.PROFITABILITY_THRESHOLD * 2) {
        recommendation = 'reduce';
      }

      predictions.push({
        hour,
        electricityCost,
        estimatedConsumption,
        totalPowerCost,
        estimatedRevenue,
        netProfit,
        isProfitable,
        recommendation,
      });
    }

    return predictions;
  }

  /**
   * Find the most profitable network to run right now
   */
  getMostProfitableNetwork(): NetworkProfitability | null {
    const analysis = this.analyzeProfitability();

    if (analysis.length === 0) {
      return null;
    }

    // Filter to only profitable networks
    const profitable = analysis.filter(
      a => a.hourlyMetrics.netProfit > this.PROFITABILITY_THRESHOLD
    );

    if (profitable.length === 0) {
      return null;
    }

    // Sort by net profit
    return profitable.sort(
      (a, b) => b.hourlyMetrics.netProfit - a.hourlyMetrics.netProfit
    )[0];
  }

  /**
   * Auto-optimize network selection based on profitability
   */
  async autoOptimize(): Promise<ProfitOptimization[]> {
    const analysis = this.analyzeProfitability();
    const optimizations: ProfitOptimization[] = [];

    // Find unprofitable active networks
    const unprofitable = analysis.filter(
      a => a.currentStatus === 'active' &&
           a.hourlyMetrics.netProfit < this.SHUTDOWN_THRESHOLD
    );

    for (const network of unprofitable) {
      // Shutdown unprofitable network
      const optimization: ProfitOptimization = {
        id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'shutdown',
        timestamp: new Date(),
        from: network.networkId,
        reason: `Unprofitable: losing $${Math.abs(network.hourlyMetrics.netProfit).toFixed(2)}/hour`,
        expectedSavings: Math.abs(network.hourlyMetrics.netProfit),
        autoImplemented: this.data.autoOptimizeEnabled,
      };

      if (this.data.autoOptimizeEnabled) {
        // Actually shutdown the network
        idleRevenueService.leaveNetwork(network.networkId);

        activityService.logActivity({
          type: 'ai',
          message: `Auto-shutdown ${network.networkName} (unprofitable)`,
          metadata: {
            networkId: network.networkId,
            netProfit: network.hourlyMetrics.netProfit,
          },
        });

        // Record in learning system
        learningSystemService.recordAction({
          id: `opt-${Date.now()}`,
          type: 'optimization_applied',
          timestamp: new Date(),
          context: {
            type: 'idle_computing',
            action: 'shutdown',
            networkId: network.networkId,
            reason: 'unprofitable',
          },
        });
      }

      optimizations.push(optimization);
      this.data.optimizations.push(optimization);
    }

    // Find inactive but profitable networks
    const shouldStart = analysis.filter(
      a => a.currentStatus !== 'active' &&
           a.currentStatus !== 'unprofitable' &&
           a.hourlyMetrics.netProfit > this.PROFITABILITY_THRESHOLD
    );

    for (const network of shouldStart.slice(0, 2)) { // Start max 2 new networks at once
      const optimization: ProfitOptimization = {
        id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'startup',
        timestamp: new Date(),
        to: network.networkId,
        reason: `Profitable opportunity: $${network.hourlyMetrics.netProfit.toFixed(2)}/hour`,
        expectedSavings: network.hourlyMetrics.netProfit,
        autoImplemented: this.data.autoOptimizeEnabled,
      };

      if (this.data.autoOptimizeEnabled) {
        // Actually start the network
        idleRevenueService.joinNetwork(network.networkId);

        activityService.logActivity({
          type: 'ai',
          message: `Auto-started ${network.networkName} (profitable)`,
          metadata: {
            networkId: network.networkId,
            expectedProfit: network.hourlyMetrics.netProfit,
          },
        });

        // Record in learning system
        learningSystemService.recordAction({
          id: `opt-${Date.now()}`,
          type: 'optimization_applied',
          timestamp: new Date(),
          context: {
            type: 'idle_computing',
            action: 'startup',
            networkId: network.networkId,
            expectedProfit: network.hourlyMetrics.netProfit,
          },
        });
      }

      optimizations.push(optimization);
      this.data.optimizations.push(optimization);
    }

    // Switch to more profitable network if significant difference
    const mostProfitable = this.getMostProfitableNetwork();
    const activeNetworks = analysis.filter(a => a.currentStatus === 'active');

    if (mostProfitable && activeNetworks.length > 0) {
      const currentBest = activeNetworks.sort(
        (a, b) => b.hourlyMetrics.netProfit - a.hourlyMetrics.netProfit
      )[0];

      const profitDifference = mostProfitable.hourlyMetrics.netProfit - currentBest.hourlyMetrics.netProfit;

      // If there's a 50%+ profit improvement, suggest switching
      if (profitDifference > currentBest.hourlyMetrics.netProfit * 0.5) {
        const optimization: ProfitOptimization = {
          id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'network_switch',
          timestamp: new Date(),
          from: currentBest.networkId,
          to: mostProfitable.networkId,
          reason: `Switch to ${mostProfitable.networkName} for $${profitDifference.toFixed(2)}/hour more profit`,
          expectedSavings: profitDifference,
          autoImplemented: false, // Network switching requires manual approval
        };

        optimizations.push(optimization);
        this.data.optimizations.push(optimization);

        // Create alert for manual review
        this.createAlert({
          type: 'opportunity',
          severity: 'high',
          message: `Network switch recommended: ${currentBest.networkName} → ${mostProfitable.networkName}`,
          affectedNetworks: [currentBest.networkId, mostProfitable.networkId],
          metrics: {
            currentProfit: currentBest.hourlyMetrics.netProfit,
            threshold: mostProfitable.hourlyMetrics.netProfit,
            difference: profitDifference,
          },
          recommendations: [
            `Stop ${currentBest.networkName}`,
            `Start ${mostProfitable.networkName}`,
            `Expected improvement: $${profitDifference.toFixed(2)}/hour`,
          ],
        });
      }
    }

    this.saveData();

    if (optimizations.length > 0) {
      activityService.logActivity({
        type: 'ai',
        message: `Idle Computing: Applied ${optimizations.length} profit optimizations`,
        metadata: {
          optimizations: optimizations.map(o => ({
            type: o.type,
            savings: o.expectedSavings,
          })),
        },
      });
    }

    return optimizations;
  }

  /**
   * Create a profit alert
   */
  private createAlert(alert: Omit<ProfitAlert, 'id' | 'timestamp'>): ProfitAlert {
    const fullAlert: ProfitAlert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    this.data.alerts.push(fullAlert);
    this.saveData();

    activityService.logActivity({
      type: 'alert',
      message: `Idle Computing Alert: ${alert.message}`,
      metadata: { alert: fullAlert },
    });

    return fullAlert;
  }

  /**
   * Check for profit issues and create alerts
   */
  private checkForAlerts(): void {
    const analysis = this.analyzeProfitability();

    // Alert for unprofitable networks
    const unprofitable = analysis.filter(
      a => a.currentStatus === 'active' && a.hourlyMetrics.netProfit < 0
    );

    if (unprofitable.length > 0) {
      this.createAlert({
        type: 'unprofitable',
        severity: 'critical',
        message: `${unprofitable.length} network(s) losing money`,
        affectedNetworks: unprofitable.map(n => n.networkId),
        metrics: {
          currentProfit: unprofitable.reduce((sum, n) => sum + n.hourlyMetrics.netProfit, 0),
          threshold: 0,
          difference: Math.abs(unprofitable.reduce((sum, n) => sum + n.hourlyMetrics.netProfit, 0)),
        },
        recommendations: unprofitable.map(n => `Stop ${n.networkName} (losing $${Math.abs(n.hourlyMetrics.netProfit).toFixed(2)}/hour)`),
        autoActionTaken: this.data.autoOptimizeEnabled ? 'Networks automatically shutdown' : undefined,
      });
    }

    // Alert for high electricity costs
    const currentRate = this.getCurrentElectricityRate();
    if (currentRate > this.data.electricityPricing.baseRate * 1.3) {
      const activeNetworks = analysis.filter(a => a.currentStatus === 'active');
      const totalCost = activeNetworks.reduce((sum, n) => sum + n.powerConsumption.costPerHour, 0);

      this.createAlert({
        type: 'high_cost',
        severity: 'high',
        message: `Peak electricity rate: $${currentRate.toFixed(2)}/kWh`,
        affectedNetworks: activeNetworks.map(n => n.networkId),
        metrics: {
          currentProfit: currentRate,
          threshold: this.data.electricityPricing.baseRate,
          difference: currentRate - this.data.electricityPricing.baseRate,
        },
        recommendations: [
          'Consider pausing low-profit networks during peak hours',
          `Total hourly cost: $${totalCost.toFixed(2)}`,
        ],
      });
    }

    // Alert for profitable opportunities
    const opportunities = analysis.filter(
      a => a.currentStatus !== 'active' &&
           a.currentStatus !== 'unprofitable' &&
           a.hourlyMetrics.netProfit > this.PROFITABILITY_THRESHOLD * 2
    );

    if (opportunities.length > 0) {
      this.createAlert({
        type: 'opportunity',
        severity: 'medium',
        message: `${opportunities.length} profitable network(s) available`,
        affectedNetworks: opportunities.map(n => n.networkId),
        metrics: {
          currentProfit: 0,
          threshold: this.PROFITABILITY_THRESHOLD,
          difference: opportunities.reduce((sum, n) => sum + n.hourlyMetrics.netProfit, 0),
        },
        recommendations: opportunities.map(n => `Start ${n.networkName} (profit: $${n.hourlyMetrics.netProfit.toFixed(2)}/hour)`),
      });
    }
  }

  /**
   * Start continuous profit monitoring
   */
  startMonitoring(intervalMinutes: number = 60): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.data.monitoringEnabled = true;
    this.saveData();

    // Immediate analysis
    this.analyzeProfitability();
    this.checkForAlerts();

    // Set up periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.analyzeProfitability();
      this.checkForAlerts();

      if (this.data.autoOptimizeEnabled) {
        this.autoOptimize();
      }

      // Integrate with revenue anomaly detection
      const totalProfit = this.getTotalProfitSummary();
      revenueAnomalyService.recordRevenue({
        id: `idle-${Date.now()}`,
        timestamp: new Date(),
        amount: totalProfit.currentHourProfit,
        source: 'idle_computing',
        type: 'recurring',
        metadata: {
          activeNetworks: totalProfit.activeNetworks,
          powerCost: totalProfit.totalPowerCost,
        },
      });
    }, intervalMinutes * 60 * 1000);

    activityService.logActivity({
      type: 'system',
      message: `Idle Computing Profit Maximizer monitoring started (every ${intervalMinutes} minutes)`,
    });
  }

  /**
   * Stop continuous monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.data.monitoringEnabled = false;
    this.saveData();

    activityService.logActivity({
      type: 'system',
      message: 'Idle Computing Profit Maximizer monitoring stopped',
    });
  }

  /**
   * Enable auto-optimization
   */
  enableAutoOptimization(): void {
    this.data.autoOptimizeEnabled = true;
    this.saveData();

    activityService.logActivity({
      type: 'system',
      message: 'Idle Computing auto-optimization enabled',
    });
  }

  /**
   * Disable auto-optimization
   */
  disableAutoOptimization(): void {
    this.data.autoOptimizeEnabled = false;
    this.saveData();

    activityService.logActivity({
      type: 'system',
      message: 'Idle Computing auto-optimization disabled',
    });
  }

  /**
   * Get current profit summary
   */
  getTotalProfitSummary(): {
    totalGrossRevenue: number;
    totalPowerCost: number;
    totalNetProfit: number;
    currentHourProfit: number;
    projectedDailyProfit: number;
    projectedMonthlyProfit: number;
    activeNetworks: number;
    profitableNetworks: number;
    recommendations: string[];
  } {
    const analysis = this.analyzeProfitability();
    const active = analysis.filter(a => a.currentStatus === 'active');

    const totalGrossRevenue = active.reduce((sum, n) => sum + n.hourlyMetrics.grossRevenue, 0);
    const totalPowerCost = active.reduce((sum, n) => sum + n.hourlyMetrics.powerCost, 0);
    const totalNetProfit = totalGrossRevenue - totalPowerCost;
    const profitableNetworks = active.filter(n => n.hourlyMetrics.netProfit > 0).length;

    const recommendations: string[] = [];

    // Check for improvements
    const shouldStop = active.filter(n => n.hourlyMetrics.netProfit < this.SHUTDOWN_THRESHOLD);
    if (shouldStop.length > 0) {
      recommendations.push(
        `Stop ${shouldStop.length} unprofitable network(s) to save $${Math.abs(shouldStop.reduce((sum, n) => sum + n.hourlyMetrics.netProfit, 0)).toFixed(2)}/hour`
      );
    }

    const mostProfitable = this.getMostProfitableNetwork();
    if (mostProfitable && !active.find(n => n.networkId === mostProfitable.networkId)) {
      recommendations.push(
        `Start ${mostProfitable.networkName} to earn $${mostProfitable.hourlyMetrics.netProfit.toFixed(2)}/hour`
      );
    }

    // Check for peak hours
    const currentRate = this.getCurrentElectricityRate();
    if (currentRate > this.data.electricityPricing.baseRate * 1.2) {
      recommendations.push(
        'Currently in peak electricity hours - consider reducing operations'
      );
    }

    return {
      totalGrossRevenue: Math.round(totalGrossRevenue * 100) / 100,
      totalPowerCost: Math.round(totalPowerCost * 100) / 100,
      totalNetProfit: Math.round(totalNetProfit * 100) / 100,
      currentHourProfit: Math.round(totalNetProfit * 100) / 100,
      projectedDailyProfit: Math.round(totalNetProfit * 24 * 100) / 100,
      projectedMonthlyProfit: Math.round(totalNetProfit * 24 * 30 * 100) / 100,
      activeNetworks: active.length,
      profitableNetworks,
      recommendations,
    };
  }

  /**
   * Get all alerts
   */
  getAlerts(severity?: 'critical' | 'high' | 'medium' | 'low'): ProfitAlert[] {
    if (severity) {
      return this.data.alerts.filter(a => a.severity === severity);
    }
    return this.data.alerts;
  }

  /**
   * Get optimization history
   */
  getOptimizationHistory(limit: number = 50): ProfitOptimization[] {
    return this.data.optimizations.slice(-limit).reverse();
  }

  /**
   * Quick test function
   */
  quickTest(): void {
    console.log('=== Idle Computing Profit Maximizer Test ===\n');

    // Initialize base service
    idleRevenueService.initializeNetworks();
    idleRevenueService.detectResources();

    // Join some networks
    idleRevenueService.joinNetwork('filecoin');
    idleRevenueService.joinNetwork('golem');
    idleRevenueService.joinNetwork('storj');

    console.log('--- Current Electricity Pricing ---');
    console.log(`Base rate: $${this.data.electricityPricing.baseRate}/kWh`);
    console.log(`Peak rate: $${this.data.electricityPricing.peakRate}/kWh`);
    console.log(`Off-peak rate: $${this.data.electricityPricing.offPeakRate}/kWh`);
    console.log(`Current rate: $${this.getCurrentElectricityRate()}/kWh`);

    console.log('\n--- Profitability Analysis ---');
    const analysis = this.analyzeProfitability();
    analysis.forEach(network => {
      console.log(`\n${network.networkName} (${network.currentStatus}):`);
      console.log(`  Gross revenue: $${network.hourlyMetrics.grossRevenue.toFixed(2)}/hour`);
      console.log(`  Power cost: $${network.hourlyMetrics.powerCost.toFixed(2)}/hour`);
      console.log(`  Net profit: $${network.hourlyMetrics.netProfit.toFixed(2)}/hour`);
      console.log(`  Profit margin: ${network.hourlyMetrics.profitMargin.toFixed(1)}%`);
      console.log(`  ROI: ${network.hourlyMetrics.roi.toFixed(1)}%`);
      console.log(`  Recommendation: ${network.recommendation}`);
      console.log(`  Reasoning: ${network.reasoning}`);
    });

    console.log('\n--- 24-Hour Prediction (Golem Network) ---');
    const predictions = this.predictHourlyProfitability('golem');
    predictions.slice(0, 12).forEach((pred, idx) => {
      console.log(`Hour ${pred.hour}: Revenue $${pred.estimatedRevenue.toFixed(2)} - Cost $${pred.totalPowerCost.toFixed(2)} = $${pred.netProfit.toFixed(2)} (${pred.recommendation})`);
    });

    console.log('\n--- Most Profitable Network ---');
    const mostProfitable = this.getMostProfitableNetwork();
    if (mostProfitable) {
      console.log(`${mostProfitable.networkName}: $${mostProfitable.hourlyMetrics.netProfit.toFixed(2)}/hour`);
    }

    console.log('\n--- Total Profit Summary ---');
    const summary = this.getTotalProfitSummary();
    console.log(`Active networks: ${summary.activeNetworks}`);
    console.log(`Profitable networks: ${summary.profitableNetworks}`);
    console.log(`Gross revenue: $${summary.totalGrossRevenue.toFixed(2)}/hour`);
    console.log(`Power cost: $${summary.totalPowerCost.toFixed(2)}/hour`);
    console.log(`Net profit: $${summary.totalNetProfit.toFixed(2)}/hour`);
    console.log(`Projected daily: $${summary.projectedDailyProfit.toFixed(2)}`);
    console.log(`Projected monthly: $${summary.projectedMonthlyProfit.toFixed(2)}`);

    if (summary.recommendations.length > 0) {
      console.log('\nRecommendations:');
      summary.recommendations.forEach((rec, idx) => {
        console.log(`  ${idx + 1}. ${rec}`);
      });
    }

    // Test auto-optimization
    console.log('\n--- Auto-Optimization Test ---');
    this.enableAutoOptimization();
    this.autoOptimize().then(optimizations => {
      console.log(`Applied ${optimizations.length} optimizations:`);
      optimizations.forEach((opt, idx) => {
        console.log(`  ${idx + 1}. ${opt.type}: ${opt.reason}`);
        console.log(`     Expected savings: $${opt.expectedSavings.toFixed(2)}/hour`);
      });
    });

    // Test peak pricing impact
    console.log('\n--- Peak Pricing Impact Test ---');
    this.updateElectricityPricing({ peakRate: 0.25 });
    console.log('Updated to peak rate: $0.25/kWh');

    const peakAnalysis = this.analyzeProfitability();
    console.log('Impact on profitability:');
    peakAnalysis.forEach(network => {
      if (network.currentStatus === 'active') {
        console.log(`  ${network.networkName}: $${network.hourlyMetrics.netProfit.toFixed(2)}/hour (${network.recommendation})`);
      }
    });
  }
}

export const idleProfitMaximizerService = IdleProfitMaximizerService.getInstance();

// Expose to window for testing
if (typeof window !== 'undefined') {
  (window as any).idleProfitMaximizerService = idleProfitMaximizerService;
}
