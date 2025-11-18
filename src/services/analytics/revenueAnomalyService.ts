/**
 * revenueAnomalyService.ts
 *
 * Intelligent revenue anomaly detection system.
 * Detects unusual revenue patterns, investigates causes, and suggests actions.
 *
 * FEATURES:
 * ✅ Real-time anomaly detection (spikes & drops)
 * ✅ Statistical analysis (z-score, moving averages)
 * ✅ Automatic cause investigation
 * ✅ Severity classification
 * ✅ Actionable recommendations
 * ✅ Historical pattern comparison
 * ✅ Multi-timeframe analysis (hourly, daily, weekly)
 * ✅ Smart alerting (no spam)
 */

import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';
import { learningSystemService } from '../learning/learningSystemService';

export interface RevenueDataPoint {
  timestamp: Date;
  amount: number;
  source: string; // 'stripe', 'gumroad', 'affiliate', etc.
  metadata?: Record<string, any>;
}

export interface Anomaly {
  id: string;
  type: 'spike' | 'drop' | 'pattern_break' | 'volatility';
  severity: 'critical' | 'high' | 'medium' | 'low';
  detectedAt: Date;
  timeframe: 'hourly' | 'daily' | 'weekly' | 'monthly';
  description: string;

  metrics: {
    currentValue: number;
    expectedValue: number;
    deviation: number; // Percentage
    zScore: number;
  };

  investigation: {
    probableCauses: string[];
    affectedSources: string[];
    correlatedEvents: string[];
    confidence: number; // 0-1
  };

  recommendations: {
    priority: 'immediate' | 'soon' | 'monitor';
    actions: string[];
    expectedOutcome: string;
  };

  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  resolvedAt?: Date;
}

export interface RevenueBaseline {
  timeframe: 'hourly' | 'daily' | 'weekly';
  mean: number;
  stdDev: number;
  median: number;
  min: number;
  max: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  lastUpdated: Date;
  sampleSize: number;
}

export interface Alert {
  id: string;
  anomalyId: string;
  severity: Anomaly['severity'];
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  dismissed: boolean;
}

class RevenueAnomalyService {
  private dataPoints: RevenueDataPoint[] = [];
  private baselines: Map<string, RevenueBaseline> = new Map();
  private anomalies: Anomaly[] = [];
  private alerts: Alert[] = [];

  private readonly SPIKE_THRESHOLD = 2.0; // Z-score
  private readonly DROP_THRESHOLD = -2.0; // Z-score
  private readonly MIN_DATA_POINTS = 20;

  /**
   * Record revenue data point
   */
  recordRevenue(data: Omit<RevenueDataPoint, 'timestamp'>): RevenueDataPoint {
    const dataPoint: RevenueDataPoint = {
      timestamp: new Date(),
      ...data,
    };

    this.dataPoints.push(dataPoint);

    // Update baselines
    this.updateBaselines();

    // Check for anomalies (but not on every single data point to avoid spam)
    if (this.dataPoints.length % 5 === 0) {
      this.detectAnomalies(dataPoint);
    }

    // Keep only last 1000 data points
    if (this.dataPoints.length > 1000) {
      this.dataPoints = this.dataPoints.slice(-1000);
    }

    this.saveToStorage();

    return dataPoint;
  }

  /**
   * Update statistical baselines
   */
  private updateBaselines(): void {
    if (this.dataPoints.length < this.MIN_DATA_POINTS) {
      return;
    }

    // Calculate daily baseline
    this.updateBaselineForTimeframe('daily', 24 * 60 * 60 * 1000);

    // Calculate weekly baseline
    this.updateBaselineForTimeframe('weekly', 7 * 24 * 60 * 60 * 1000);

    // Calculate hourly baseline
    this.updateBaselineForTimeframe('hourly', 60 * 60 * 1000);
  }

  /**
   * Update baseline for specific timeframe
   */
  private updateBaselineForTimeframe(
    timeframe: RevenueBaseline['timeframe'],
    windowMs: number
  ): void {
    const now = Date.now();
    const relevantPoints = this.dataPoints.filter(
      p => now - p.timestamp.getTime() < windowMs * 30 // Last 30 periods
    );

    if (relevantPoints.length < 10) return;

    // Group by period
    const periodRevenues: number[] = [];
    const periodSize = windowMs;

    const firstTimestamp = relevantPoints[0].timestamp.getTime();
    const periods = Math.ceil((now - firstTimestamp) / periodSize);

    for (let i = 0; i < periods; i++) {
      const periodStart = firstTimestamp + (i * periodSize);
      const periodEnd = periodStart + periodSize;

      const periodData = relevantPoints.filter(
        p => p.timestamp.getTime() >= periodStart && p.timestamp.getTime() < periodEnd
      );

      const periodTotal = periodData.reduce((sum, p) => sum + p.amount, 0);
      periodRevenues.push(periodTotal);
    }

    if (periodRevenues.length < 10) return;

    // Calculate statistics
    const mean = periodRevenues.reduce((sum, v) => sum + v, 0) / periodRevenues.length;

    const variance = periodRevenues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / periodRevenues.length;
    const stdDev = Math.sqrt(variance);

    const sorted = [...periodRevenues].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    // Determine trend
    const recentPeriods = periodRevenues.slice(-10);
    const olderPeriods = periodRevenues.slice(-20, -10);

    const recentAvg = recentPeriods.reduce((sum, v) => sum + v, 0) / recentPeriods.length;
    const olderAvg = olderPeriods.length > 0
      ? olderPeriods.reduce((sum, v) => sum + v, 0) / olderPeriods.length
      : recentAvg;

    let trend: RevenueBaseline['trend'] = 'stable';
    const changePct = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (changePct > 10) trend = 'increasing';
    else if (changePct < -10) trend = 'decreasing';

    this.baselines.set(timeframe, {
      timeframe,
      mean,
      stdDev,
      median,
      min: Math.min(...periodRevenues),
      max: Math.max(...periodRevenues),
      trend,
      lastUpdated: new Date(),
      sampleSize: periodRevenues.length,
    });
  }

  /**
   * Detect anomalies in revenue data
   */
  private detectAnomalies(dataPoint: RevenueDataPoint): void {
    // Get recent revenue for comparison
    const last24Hours = this.getRevenueForPeriod(24 * 60 * 60 * 1000);
    const lastWeek = this.getRevenueForPeriod(7 * 24 * 60 * 60 * 1000);

    // Check daily baseline
    const dailyBaseline = this.baselines.get('daily');
    if (dailyBaseline && dailyBaseline.sampleSize >= 10) {
      const zScore = (last24Hours - dailyBaseline.mean) / dailyBaseline.stdDev;

      // Spike detection
      if (zScore > this.SPIKE_THRESHOLD) {
        this.createAnomaly('spike', 'daily', last24Hours, dailyBaseline.mean, zScore);
      }

      // Drop detection
      if (zScore < this.DROP_THRESHOLD) {
        this.createAnomaly('drop', 'daily', last24Hours, dailyBaseline.mean, zScore);
      }
    }

    // Check weekly volatility
    const weeklyBaseline = this.baselines.get('weekly');
    if (weeklyBaseline && weeklyBaseline.sampleSize >= 4) {
      const deviation = Math.abs(lastWeek - weeklyBaseline.mean);
      const volatilityThreshold = weeklyBaseline.stdDev * 2.5;

      if (deviation > volatilityThreshold) {
        this.createAnomaly('volatility', 'weekly', lastWeek, weeklyBaseline.mean, deviation / weeklyBaseline.stdDev);
      }
    }
  }

  /**
   * Create anomaly record
   */
  private createAnomaly(
    type: Anomaly['type'],
    timeframe: Anomaly['timeframe'],
    currentValue: number,
    expectedValue: number,
    zScore: number
  ): void {
    // Check if we already have a recent anomaly of this type (avoid spam)
    const recentAnomaly = this.anomalies.find(
      a => a.type === type &&
           a.timeframe === timeframe &&
           a.status === 'active' &&
           (Date.now() - a.detectedAt.getTime()) < 3600000 // Within last hour
    );

    if (recentAnomaly) {
      return; // Don't create duplicate
    }

    const deviation = ((currentValue - expectedValue) / expectedValue) * 100;

    // Determine severity
    let severity: Anomaly['severity'] = 'low';
    if (Math.abs(zScore) > 4) severity = 'critical';
    else if (Math.abs(zScore) > 3) severity = 'high';
    else if (Math.abs(zScore) > 2) severity = 'medium';

    // Investigate causes
    const investigation = this.investigate(type, currentValue, expectedValue);

    // Generate recommendations
    const recommendations = this.generateRecommendations(type, investigation, severity);

    const anomaly: Anomaly = {
      id: crypto.randomUUID(),
      type,
      severity,
      detectedAt: new Date(),
      timeframe,
      description: this.generateDescription(type, deviation, timeframe),
      metrics: {
        currentValue,
        expectedValue,
        deviation,
        zScore,
      },
      investigation,
      recommendations,
      status: 'investigating',
    };

    this.anomalies.push(anomaly);

    // Create alert
    this.createAlert(anomaly);

    // Record in learning system
    learningSystemService.recordAction({
      type: 'revenue_event',
      context: {
        anomalyType: type,
        severity,
        deviation,
        timeframe,
      },
    });

    logger.warn('Revenue anomaly detected', {
      type,
      severity,
      deviation: deviation.toFixed(1) + '%',
      timeframe,
    });

    activityService.addActivity({
      type: 'warning',
      action: `Revenue ${type} Detected`,
      description: anomaly.description,
      metadata: {
        anomalyId: anomaly.id,
        severity,
        deviation: deviation.toFixed(1),
      },
    });

    this.saveToStorage();
  }

  /**
   * Investigate anomaly causes
   */
  private investigate(
    type: Anomaly['type'],
    currentValue: number,
    expectedValue: number
  ): Anomaly['investigation'] {
    const probableCauses: string[] = [];
    const affectedSources: string[] = [];
    const correlatedEvents: string[] = [];

    // Analyze by source
    const recentData = this.dataPoints.slice(-50);
    const sourceRevenue: Record<string, number> = {};

    recentData.forEach(dp => {
      sourceRevenue[dp.source] = (sourceRevenue[dp.source] || 0) + dp.amount;
    });

    // Find which sources are affected
    const avgPerSource = Object.values(sourceRevenue).reduce((sum, v) => sum + v, 0) / Object.keys(sourceRevenue).length;

    Object.entries(sourceRevenue).forEach(([source, amount]) => {
      if (type === 'spike' && amount > avgPerSource * 1.5) {
        affectedSources.push(source);
        probableCauses.push(`Spike in ${source} revenue`);
      } else if (type === 'drop' && amount < avgPerSource * 0.5) {
        affectedSources.push(source);
        probableCauses.push(`Drop in ${source} revenue`);
      }
    });

    // Check for time-based patterns
    const hourOfDay = new Date().getHours();
    if (type === 'spike' && (hourOfDay >= 9 && hourOfDay <= 17)) {
      probableCauses.push('Spike during business hours (possible campaign success)');
    }

    if (type === 'drop') {
      probableCauses.push('Possible service outage or payment processor issue');
      probableCauses.push('Content performance decline');
      probableCauses.push('Seasonal variation');
    }

    if (type === 'spike') {
      probableCauses.push('Viral content or successful campaign');
      probableCauses.push('New traffic source');
      probableCauses.push('Seasonal demand increase');
    }

    // Look for correlated events in activity log
    const recentActivities = activityService.getRecentActivities(20);
    recentActivities.forEach(activity => {
      if (activity.type === 'automation' || activity.type === 'content') {
        correlatedEvents.push(activity.action);
      }
    });

    return {
      probableCauses: probableCauses.slice(0, 5),
      affectedSources,
      correlatedEvents: correlatedEvents.slice(0, 5),
      confidence: affectedSources.length > 0 ? 0.8 : 0.5,
    };
  }

  /**
   * Generate recommendations for anomaly
   */
  private generateRecommendations(
    type: Anomaly['type'],
    investigation: Anomaly['investigation'],
    severity: Anomaly['severity']
  ): Anomaly['recommendations'] {
    const actions: string[] = [];
    let priority: 'immediate' | 'soon' | 'monitor' = 'monitor';
    let expectedOutcome = '';

    if (type === 'spike') {
      priority = severity === 'critical' ? 'soon' : 'monitor';

      actions.push('Analyze what caused the spike');
      actions.push('Document successful strategies');
      actions.push('Attempt to replicate success');

      if (investigation.affectedSources.length > 0) {
        actions.push(`Focus more effort on: ${investigation.affectedSources.join(', ')}`);
      }

      actions.push('Scale winning campaigns');
      expectedOutcome = 'Sustain and grow revenue spike into consistent performance';
    }

    if (type === 'drop') {
      priority = severity === 'critical' ? 'immediate' : severity === 'high' ? 'soon' : 'monitor';

      actions.push('Check for service outages or errors');
      actions.push('Review recent changes to content or strategy');
      actions.push('Verify payment processor connections');

      if (investigation.affectedSources.length > 0) {
        actions.push(`Investigate ${investigation.affectedSources.join(', ')} performance`);
      }

      actions.push('Implement recovery plan');
      expectedOutcome = 'Restore revenue to baseline levels';
    }

    if (type === 'volatility') {
      priority = 'soon';
      actions.push('Identify sources of volatility');
      actions.push('Diversify revenue streams');
      actions.push('Implement more consistent posting schedule');
      actions.push('Add stable recurring revenue sources');
      expectedOutcome = 'Reduce revenue volatility by 30-50%';
    }

    return {
      priority,
      actions,
      expectedOutcome,
    };
  }

  /**
   * Generate human-readable description
   */
  private generateDescription(type: Anomaly['type'], deviation: number, timeframe: string): string {
    const absDeviation = Math.abs(deviation);

    if (type === 'spike') {
      return `Revenue spike: ${absDeviation.toFixed(0)}% above ${timeframe} average`;
    }

    if (type === 'drop') {
      return `Revenue drop: ${absDeviation.toFixed(0)}% below ${timeframe} average`;
    }

    if (type === 'volatility') {
      return `High revenue volatility detected over ${timeframe} period`;
    }

    return `Revenue pattern anomaly detected`;
  }

  /**
   * Create alert for anomaly
   */
  private createAlert(anomaly: Anomaly): void {
    const alert: Alert = {
      id: crypto.randomUUID(),
      anomalyId: anomaly.id,
      severity: anomaly.severity,
      title: this.getAlertTitle(anomaly),
      message: this.getAlertMessage(anomaly),
      timestamp: new Date(),
      read: false,
      dismissed: false,
    };

    this.alerts.push(alert);
  }

  /**
   * Get alert title
   */
  private getAlertTitle(anomaly: Anomaly): string {
    const emoji = anomaly.type === 'spike' ? '📈' : anomaly.type === 'drop' ? '📉' : '⚠️';

    if (anomaly.type === 'spike') {
      return `${emoji} Revenue Spike Detected!`;
    }

    if (anomaly.type === 'drop') {
      return `${emoji} Revenue Drop Alert`;
    }

    return `${emoji} Revenue Volatility Warning`;
  }

  /**
   * Get alert message
   */
  private getAlertMessage(anomaly: Anomaly): string {
    const parts: string[] = [];

    parts.push(anomaly.description);
    parts.push(`\nCurrent: $${anomaly.metrics.currentValue.toFixed(2)}`);
    parts.push(`Expected: $${anomaly.metrics.expectedValue.toFixed(2)}`);

    if (anomaly.investigation.probableCauses.length > 0) {
      parts.push(`\nPossible causes:\n• ${anomaly.investigation.probableCauses.join('\n• ')}`);
    }

    if (anomaly.recommendations.actions.length > 0) {
      parts.push(`\nRecommended actions:\n1. ${anomaly.recommendations.actions.slice(0, 3).join('\n2. ')}`);
    }

    return parts.join('');
  }

  /**
   * Get revenue for time period
   */
  private getRevenueForPeriod(periodMs: number): number {
    const cutoff = Date.now() - periodMs;
    return this.dataPoints
      .filter(dp => dp.timestamp.getTime() > cutoff)
      .reduce((sum, dp) => sum + dp.amount, 0);
  }

  /**
   * Get all anomalies
   */
  getAnomalies(status?: Anomaly['status']): Anomaly[] {
    if (status) {
      return this.anomalies.filter(a => a.status === status);
    }
    return [...this.anomalies].sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
  }

  /**
   * Get alerts
   */
  getAlerts(unreadOnly: boolean = false): Alert[] {
    let alerts = [...this.alerts];

    if (unreadOnly) {
      alerts = alerts.filter(a => !a.read && !a.dismissed);
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Mark alert as read
   */
  markAlertRead(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.read = true;
    this.saveToStorage();
    return true;
  }

  /**
   * Dismiss alert
   */
  dismissAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.dismissed = true;
    this.saveToStorage();
    return true;
  }

  /**
   * Resolve anomaly
   */
  resolveAnomaly(anomalyId: string): boolean {
    const anomaly = this.anomalies.find(a => a.id === anomalyId);
    if (!anomaly) return false;

    anomaly.status = 'resolved';
    anomaly.resolvedAt = new Date();

    logger.info('Anomaly resolved', { anomalyId, type: anomaly.type });

    this.saveToStorage();
    return true;
  }

  /**
   * Get baselines
   */
  getBaselines(): RevenueBaseline[] {
    return Array.from(this.baselines.values());
  }

  /**
   * Get analytics summary
   */
  getAnalytics(): {
    totalDataPoints: number;
    totalAnomalies: number;
    activeAnomalies: number;
    unreadAlerts: number;
    revenueToday: number;
    revenueThisWeek: number;
    revenueThisMonth: number;
    trend: RevenueBaseline['trend'];
  } {
    const dailyBaseline = this.baselines.get('daily');

    return {
      totalDataPoints: this.dataPoints.length,
      totalAnomalies: this.anomalies.length,
      activeAnomalies: this.anomalies.filter(a => a.status === 'active' || a.status === 'investigating').length,
      unreadAlerts: this.alerts.filter(a => !a.read && !a.dismissed).length,
      revenueToday: this.getRevenueForPeriod(24 * 60 * 60 * 1000),
      revenueThisWeek: this.getRevenueForPeriod(7 * 24 * 60 * 60 * 1000),
      revenueThisMonth: this.getRevenueForPeriod(30 * 24 * 60 * 60 * 1000),
      trend: dailyBaseline?.trend || 'stable',
    };
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('dlx_revenue_datapoints', JSON.stringify(this.dataPoints.slice(-500)));
      localStorage.setItem('dlx_revenue_baselines', JSON.stringify(Array.from(this.baselines.entries())));
      localStorage.setItem('dlx_revenue_anomalies', JSON.stringify(this.anomalies.slice(-50)));
      localStorage.setItem('dlx_revenue_alerts', JSON.stringify(this.alerts.slice(-50)));
    } catch (error) {
      logger.error('Failed to save revenue anomaly data', { error: error as Error });
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const dataPointsData = localStorage.getItem('dlx_revenue_datapoints');
      const baselinesData = localStorage.getItem('dlx_revenue_baselines');
      const anomaliesData = localStorage.getItem('dlx_revenue_anomalies');
      const alertsData = localStorage.getItem('dlx_revenue_alerts');

      if (dataPointsData) this.dataPoints = JSON.parse(dataPointsData);
      if (baselinesData) this.baselines = new Map(JSON.parse(baselinesData));
      if (anomaliesData) this.anomalies = JSON.parse(anomaliesData);
      if (alertsData) this.alerts = JSON.parse(alertsData);
    } catch (error) {
      logger.warn('Failed to load revenue anomaly data', { error: error as Error });
    }
  }

  /**
   * Quick test method
   */
  async quickTest() {
    // Simulate revenue data with patterns and anomalies
    const baseRevenue = 100;

    // Normal pattern for 30 days
    for (let day = 0; day < 30; day++) {
      const dailyRevenue = baseRevenue + (Math.random() * 40 - 20); // ±20% variation

      this.recordRevenue({
        amount: dailyRevenue,
        source: 'stripe',
        metadata: { day },
      });
    }

    // Create a spike
    this.recordRevenue({
      amount: baseRevenue * 3,
      source: 'stripe',
      metadata: { event: 'spike' },
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Normal days
    for (let i = 0; i < 3; i++) {
      this.recordRevenue({
        amount: baseRevenue + (Math.random() * 20 - 10),
        source: 'stripe',
      });
    }

    // Create a drop
    this.recordRevenue({
      amount: baseRevenue * 0.2,
      source: 'gumroad',
      metadata: { event: 'drop' },
    });

    return {
      anomalies: this.getAnomalies(),
      alerts: this.getAlerts(),
      baselines: this.getBaselines(),
      analytics: this.getAnalytics(),
    };
  }
}

// Export singleton
export const revenueAnomalyService = new RevenueAnomalyService();

// Auto-load from storage
if (typeof window !== 'undefined') {
  (revenueAnomalyService as any).loadFromStorage();
}

// Expose to window for testing
if (typeof window !== 'undefined') {
  (window as any).testRevenueAnomaly = () => revenueAnomalyService.quickTest();
  (window as any).revenueAnomalyService = revenueAnomalyService;
}
